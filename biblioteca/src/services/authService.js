import { supabase } from './supabaseClient';

const DOMINIOS_INSTITUCIONAIS = ["@biblioteca.com", "@instituicao.edu"];

// ─── MENSAGENS CENTRALIZADAS ─────────────────────────────────────────────────

const MENSAGENS_STATUS = {
  'Pendente':  'Seu cadastro está aguardando aprovação do bibliotecário.',
  'Rejeitado': 'Seu cadastro foi rejeitado pelo bibliotecário. Entre em contato para mais informações.',
  'Suspenso':  'Sua conta está suspensa por 30 dias devido à não devolução de livros.',
  'Banido':    'Sua conta foi banida. Entre em contato com um bibliotecário.',
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

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
 * Valida acesso completo (login via email/senha).
 * Inclui verificação de bibliotecário único.
 */
const validarAcesso = async (profile) => {
  if (!profile) throw new Error('Perfil não encontrado. Entre em contato com o bibliotecário.');

  if (profile.status !== 'Ativo') {
    throw new Error(MENSAGENS_STATUS[profile.status] ?? 'Acesso não autorizado. Entre em contato com o bibliotecário.');
  }

  if (profile.papel === 'bibliotecario') {
    const { data, error } = await supabase
      .from('bibliotecario')
      .select('id_pessoa')
      .eq('esta_logado', true)
      .neq('id_pessoa', profile.id_pessoa)
      .maybeSingle();
    if (error) throw error;
    if (data) throw new Error('Já existe um bibliotecário ativo no sistema. Aguarde o logout dele para entrar.');
  }
};

/**
 * Valida acesso via OAuth/SIGNED_IN (sem signOut automático — o AuthContext cuida disso).
 * Inclui verificação de bibliotecário único.
 */
export const validarAcessoPublico = async (profile, userId) => {
  if (!profile) throw new Error('Perfil não encontrado. Entre em contato com o bibliotecário.');

  if (profile.status !== 'Ativo') {
    throw new Error(MENSAGENS_STATUS[profile.status] ?? 'Acesso não autorizado. Entre em contato com o bibliotecário.');
  }

  if (profile.papel === 'bibliotecario') {
    const { data, error } = await supabase
      .from('bibliotecario')
      .select('id_pessoa')
      .eq('esta_logado', true)
      .neq('id_pessoa', profile.id_pessoa)
      .maybeSingle();
    if (error) throw error;
    if (data) throw new Error('Já existe um bibliotecário ativo no sistema. Aguarde o logout dele para entrar.');
  }
};

/**
 * Marca esta_logado = true para bibliotecários.
 * Exportado para uso no AuthContext (SIGNED_IN e INITIAL_SESSION).
 */
export const marcarLogadoBibliotecario = async (profile) => {
  if (profile.papel !== 'bibliotecario') return;

  const { error } = await supabase
    .from('bibliotecario')
    .update({ esta_logado: true })
    .eq('id_pessoa', profile.id_pessoa);

  if (error) {
    console.error('❌ Erro ao marcar bibliotecário como logado:', error);
    throw error;
  }

  console.log('✅ Bibliotecário marcado como logado:', profile.id_pessoa);
};

/**
 * Marca esta_logado = false para bibliotecários.
 * Silencia erros — chamado em contextos onde o usuário pode já ter sido deslogado.
 */
export const marcarDeslogado = async (userId) => {
  try {
    const { error } = await supabase
      .from('bibliotecario')
      .update({ esta_logado: false })
      .eq('id_pessoa', userId);
    if (error) throw error;
    console.log('✅ Bibliotecário marcado como deslogado:', userId);
  } catch (err) {
    console.warn('⚠️ Erro ao marcar bibliotecário como deslogado:', err.message);
  }
};

// ─── SYNC OAUTH ──────────────────────────────────────────────────────────────

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

export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  try {
    const profile = await getProfile(data.user.id);
    await validarAcesso(profile);
    await marcarLogadoBibliotecario(profile);
    return { user: data.user, session: data.session, profile };
  } catch (validationError) {
    await supabase.auth.signOut();
    throw validationError;
  }
};

export const logout = async (userId, papel) => {
  if (papel === 'bibliotecario' && userId) await marcarDeslogado(userId);
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Erro ao fazer logout:', error);
    throw error;
  }
  console.log('✅ Logout realizado com sucesso');
};

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
  return data;
};