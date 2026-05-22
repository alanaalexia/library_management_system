import { supabase } from './supabaseClient';

const DOMINIOS_INSTITUCIONAIS = ["@biblioteca.com", "@instituicao.edu"];

// ─── HELPERS ────────────────────────────────────────────────────────────────

const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('pessoa')
    .select('*')
    .eq('id_pessoa', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

// ─── REGRAS DE ACESSO ────────────────────────────────────────────────────────

/**
 * Valida se o perfil pode acessar o sistema.
 * Lança erro com mensagem amigável se não puder.
 */
const validarAcesso = async (profile) => {
  if (!profile) {
    throw new Error('Perfil não encontrado. Entre em contato com o bibliotecário.');
  }

  if (profile.status !== 'Ativo') {
    throw new Error('Seu cadastro está aguardando aprovação do bibliotecário.');
  }

  if (profile.papel === 'bibliotecario') {
    // Verifica se outro bibliotecário já está logado
    const { data, error } = await supabase
      .from('bibliotecario')
      .select('id_pessoa')
      .eq('esta_logado', true)
      .neq('id_pessoa', profile.id_pessoa) // ignora o próprio usuário
      .maybeSingle();

    if (error) throw error;

    if (data) {
      throw new Error('Já existe um bibliotecário ativo no sistema. Aguarde o logout dele para entrar.');
    }
  }
};

/**
 * Marca esta_logado = true para bibliotecários.
 */
const marcarLogado = async (userId) => {
  const { error } = await supabase
    .from('bibliotecario')
    .update({ esta_logado: true })
    .eq('id_pessoa', userId);
  if (error) throw error;
};

/**
 * Marca esta_logado = false para bibliotecários.
 * Silencia erros — chamado em contextos onde o usuário pode já ter sido
 * deslogado (fechamento de aba, timeout, etc).
 */
export const marcarDeslogado = async (userId) => {
  try {
    await supabase
      .from('bibliotecario')
      .update({ esta_logado: false })
      .eq('id_pessoa', userId);
  } catch (err) {
    console.warn('Erro ao marcar bibliotecário como deslogado:', err.message);
  }
};

// ─── SYNC OAUTH ──────────────────────────────────────────────────────────────

/**
 * Sincronização exclusiva para OAuth (Google, etc).
 * Usuários de cadastro manual já são inseridos pelo register().
 */
export const syncOrCreateUser = async (user) => {
  const isOAuth = user.app_metadata?.provider !== 'email';
  if (!isOAuth) return;

  const { data: existing, error: fetchError } = await supabase
    .from('pessoa')
    .select('id_pessoa')
    .eq('id_pessoa', user.id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return;

  const email = user.email.toLowerCase();
  const eInstitucional = DOMINIOS_INSTITUCIONAIS.some(dom => email.endsWith(dom));
  const papel = eInstitucional ? 'bibliotecario' : 'cliente';
  const status = eInstitucional ? 'Ativo' : 'Pendente';
  const nome =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    email.split('@')[0];

  const { error: dbError } = await supabase
    .from('pessoa')
    .insert([{ id_pessoa: user.id, nome, email, papel, status }]);
  if (dbError) throw dbError;

  const { error: relError } = await supabase
    .from(papel)
    .insert([{ id_pessoa: user.id }]);
  if (relError) throw relError;
};

// ─── AUTH FUNCTIONS ──────────────────────────────────────────────────────────

export const register = async (userData) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });
  if (authError) throw authError;

  if (authData.user) {
    const cpfFinal = userData.cpf?.trim() === '' ? null : userData.cpf;
    const eInstitucional = DOMINIOS_INSTITUCIONAIS.some(dom =>
      userData.email.toLowerCase().endsWith(dom)
    );
    const statusInicial =
      userData.papel === 'bibliotecario' && eInstitucional ? 'Ativo' : 'Pendente';

    const { error: dbError } = await supabase
      .from('pessoa')
      .insert([{
        id_pessoa: authData.user.id,
        nome: userData.nome,
        email: userData.email,
        cpf: cpfFinal,
        papel: userData.papel,
        status: statusInicial,
      }]);
    if (dbError) throw dbError;

    const { error: relError } = await supabase
      .from(userData.papel)
      .insert([{ id_pessoa: authData.user.id }]);
    if (relError) throw relError;
  }

  return authData;
};

/**
 * Login com email/senha.
 * Valida status e regra de bibliotecário único ANTES de deixar entrar.
 * Se a validação falhar, faz logout imediato para não deixar sessão aberta.
 */
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  try {
    const profile = await getProfile(data.user.id);
    await validarAcesso(profile);

    if (profile.papel === 'bibliotecario') {
      await marcarLogado(data.user.id);
    }

    return { ...data, profile };
  } catch (validationError) {
    // Validade falhou: desfaz a sessão antes de propagar o erro
    await supabase.auth.signOut();
    throw validationError;
  }
};

export const logout = async (userId, papel) => {
  if (papel === 'bibliotecario' && userId) {
    await marcarDeslogado(userId);
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
  return data;
};