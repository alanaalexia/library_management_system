import { supabase } from './supabaseClient';

const DOMINIOS_INSTITUCIONAIS = ["@biblioteca.com", "@instituicao.edu"];

// Todos os valores de status em minúsculo, alinhados com o novo schema
const MENSAGENS_STATUS = {
  'pendente':  'Seu cadastro está aguardando aprovação do bibliotecário.',
  'rejeitado': 'Seu cadastro foi rejeitado pelo bibliotecário. Entre em contato para mais informações.',
  'banido':    'Sua conta foi banida. Entre em contato com um bibliotecário.',
};

const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('pessoa')
    .select('*')
    .eq('id_pessoa', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

// Verifica suspensão via data_suspensao em estudante (não mais via pessoa.status)
const getEstudanteSuspenso = async (idPessoa) => {
  const { data, error } = await supabase
    .from('estudante')
    .select('data_suspensao')
    .eq('id_pessoa', idPessoa)
    .maybeSingle();
  if (error) throw error;
  if (!data?.data_suspensao) return false;
  return new Date(data.data_suspensao) > new Date();
};

// Função única de validação — elimina a duplicata validarAcessoPublico
const validarAcesso = async (profile) => {
  if (!profile) throw new Error('Perfil não encontrado. Entre em contato com o bibliotecário.');

  if (profile.status !== 'ativo') {
    throw new Error(
      MENSAGENS_STATUS[profile.status] ?? 'Acesso não autorizado. Entre em contato com o bibliotecário.'
    );
  }

  // Suspensão calculada pela data, não pelo status
  if (profile.papel === 'estudante') {
    const suspenso = await getEstudanteSuspenso(profile.id_pessoa);
    if (suspenso) {
      const { data } = await supabase
        .from('estudante')
        .select('data_suspensao')
        .eq('id_pessoa', profile.id_pessoa)
        .single();
      const ate = new Date(data.data_suspensao).toLocaleDateString('pt-BR');
      throw new Error(`Sua conta está suspensa até ${ate} devido à não devolução de livros.`);
    }
  }

  // Apenas um bibliotecário logado por vez
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

export const marcarLogadoBibliotecario = async (profile) => {
  if (profile.papel !== 'bibliotecario') return;

  const { error } = await supabase
    .from('bibliotecario')
    .update({ esta_logado: true })
    .eq('id_pessoa', profile.id_pessoa);

  if (error) throw error;
};

export const marcarDeslogado = async (userId) => {
  try {
    const { error } = await supabase
      .from('bibliotecario')
      .update({ esta_logado: false })
      .eq('id_pessoa', userId);
    if (error) throw error;
  } catch (err) {
    console.warn('Erro ao marcar bibliotecário como deslogado:', err.message);
  }
};

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
  const papel  = eInstitucional ? 'bibliotecario' : 'estudante';
  const status = eInstitucional ? 'ativo' : 'pendente';
  const nome =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    email.split('@')[0];

  const { error: dbError } = await supabase
    .from('pessoa')
    .insert([{ id_pessoa: user.id, nome, email, papel, status }]);
  if (dbError) throw dbError;

  // Insere na tabela específica do papel
  const { error: relError } = await supabase
    .from(papel)
    .insert([{ id_pessoa: user.id }]);
  if (relError) throw relError;
};

export const register = async (userData) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email:    userData.email,
    password: userData.password,
  });
  if (authError) throw authError;

  if (authData.user) {
    const cpfFinal = userData.cpf?.trim() === '' ? null : userData.cpf;
    const eInstitucional = DOMINIOS_INSTITUCIONAIS.some(dom =>
      userData.email.toLowerCase().endsWith(dom)
    );

    // Bibliotecário com domínio institucional já entra como ativo
    const statusInicial =
      userData.papel === 'bibliotecario' && eInstitucional ? 'ativo' : 'pendente';

    const { error: dbError } = await supabase
      .from('pessoa')
      .insert([{
        id_pessoa: authData.user.id,
        nome:      userData.nome,
        email:     userData.email,
        cpf:       cpfFinal,
        papel:     userData.papel,
        status:    statusInicial,
      }]);
    if (dbError) throw dbError;

    // Insere na tabela específica do papel (estudante, bibliotecario ou admin)
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