import { supabase } from './supabaseClient';

export const register = async (userData) => {
  // 1. Cria o usuário no Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });

  if (authError) throw authError;

  // 2. Se o usuário foi criado, insere os dados extras na tabela 'pessoa'
  if (authData.user) {
    const { error: dbError } = await supabase
      .from('pessoa')
      .insert([
        {
          id: authData.user.id, // Vincula o ID da autenticação com a tabela
          nome: userData.nome,
          cpf: userData.cpf,
          role: userData.papel,
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