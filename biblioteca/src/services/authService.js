import { supabase } from './supabaseClient';

const DOMINIOS_INSTITUCIONAIS = ["@biblioteca.com", "@instituicao.edu"];

// Sincronização exclusiva para OAuth (Google, etc).
// Usuários de cadastro manual (provider = 'email') já são inseridos
// pelo register() — não precisam de sync aqui.
export const syncOrCreateUser = async (user) => {
  const isOAuth = user.app_metadata?.provider !== 'email';
  if (!isOAuth) return;

  const { data: existingPerson, error: fetchError } = await supabase
    .from('pessoa')
    .select('id_pessoa')
    .eq('id_pessoa', user.id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existingPerson) return; // já existe, nada a fazer

  const email = user.email.toLowerCase();
  const eInstitucional = DOMINIOS_INSTITUCIONAIS.some(dom => email.endsWith(dom));
  const papel = eInstitucional ? 'bibliotecario' : 'cliente';
  const status = eInstitucional ? 'ativo' : 'pendente';
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

export const register = async (userData) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });

  if (authError) throw authError;

  if (authData.user) {
    const cpfFinal = userData.cpf?.trim() === "" ? null : userData.cpf;
    const eInstitucional = DOMINIOS_INSTITUCIONAIS.some(dom =>
      userData.email.toLowerCase().endsWith(dom)
    );
    const statusInicial =
      userData.papel === 'bibliotecario' && eInstitucional ? 'ativo' : 'pendente';

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
  return data;
};

export const logout = async () => {
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