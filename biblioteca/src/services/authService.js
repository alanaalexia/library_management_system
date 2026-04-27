import { supabase } from './supabaseClient';

// Lista de domínios que permitem ativação direta para bibliotecários
const DOMINIOS_INSTITUCIONAIS = ["@biblioteca.com", "@instituicao.edu"];

// --- FUNÇÃO DE AUXÍLIO PARA SINCRONIZAÇÃO OAUTH ---
export const syncOrCreateUser = async (user) => {
  // 1. Verifica se o usuário já existe na tabela 'pessoa'
  const { data: existingPerson, error: fetchError } = await supabase
    .from('pessoa')
    .select('*')
    .eq('id_pessoa', user.id)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 significa "não encontrado"
    throw fetchError;
  }

  // 2. Se o usuário NÃO existe na tabela pessoa, vamos criá-lo
  if (!existingPerson) {
    const email = user.email.toLowerCase();
    
    // Validação de Domínio
    const eInstitucional = DOMINIOS_INSTITUCIONAIS.some(dom => email.endsWith(dom));
    
    // Regra: Institucional = bibliotecario/ativo | Outros = cliente/pendente
    const papel = eInstitucional ? 'bibliotecario' : 'cliente';
    const status = eInstitucional ? 'ativo' : 'pendente';

    // 3. Insere na tabela 'pessoa'
    const { error: dbError } = await supabase
      .from('pessoa')
      .insert([
        {
          id_pessoa: user.id,
          nome: user.user_metadata.full_name || 'Usuário Google', // Pega o nome do Google
          email: email,
          papel: papel,
          status: status
        },
      ]);

    if (dbError) throw dbError;

    // 4. Insere na tabela específica (bibliotecario ou cliente)
    const { error: relError } = await supabase
      .from(papel)
      .insert([{ id_pessoa: user.id }]);

    if (relError) throw relError;
  }
};

export const register = async (userData) => {
  // 1. Criar o usuário no Supabase Auth (Autenticação)
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
  });

  if (authError) throw authError;

  if (authData.user) {
    // Tratamento de CPF: Converte string vazia para null para evitar erro de UNIQUE constraint
    const cpfFinal = userData.cpf?.trim() === "" ? null : userData.cpf;

    // Lógica de ativação automática baseada no domínio institucional
    const eInstitucional = DOMINIOS_INSTITUCIONAIS.some(dom => 
      userData.email.toLowerCase().endsWith(dom)
    );

    const statusInicial = (userData.papel === 'bibliotecario' && eInstitucional) 
      ? 'ativo' 
      : 'pendente'; 

    // 2. Inserção na tabela base 'pessoa' (Dados de perfil comum)
    const { error: dbError } = await supabase
      .from('pessoa')
      .insert([
        {
          id_pessoa: authData.user.id,
          nome: userData.nome,
          email: userData.email,
          cpf: cpfFinal,
          papel: userData.papel,
          status: statusInicial
        },
      ]);

    if (dbError) throw dbError;
    
    // 3. Inserção na tabela específica vinculada (bibliotecario ou cliente)
    // Usamos o valor de 'papel' vindo do formulário para determinar a tabela alvo
    const { error: relError } = await supabase
      .from(userData.papel) 
      .insert([{ id_pessoa: authData.user.id }]);
    
    // Verificação de erro corrigida (utilizando a variável correta relError)
    if (relError) throw relError; 
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

// Função de login social para entrar com google
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // Garante que o usuário volte para a página inicial ou dashboard após logar
      redirectTo: window.location.origin, 
    },
  });
  if (error) throw error;
  return data;
};