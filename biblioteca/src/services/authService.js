import { supabase } from './supabaseClient';

export const register = async (userData) => {
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });

  if (authError) throw authError;

  if (authData.user) {
    // AJUSTE AQUI: Se o CPF for apenas espaços ou vazio, vira null
    const cpfFinal = userData.cpf?.trim() === "" ? null : userData.cpf;

    const { error: dbError } = await supabase
      .from('pessoa')
      .insert([
        {
          id_pessoa: authData.user.id,
          nome: userData.nome,
          email: userData.email,
          cpf: cpfFinal, // Agora enviamos null se estiver vazio
          papel: userData.papel,
        },
      ]);

    if (dbError) throw dbError;
  }

  return authData;
};

// Realiza o login com e-mail e senha
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
};

// Realiza o logout da sessão atual
export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};