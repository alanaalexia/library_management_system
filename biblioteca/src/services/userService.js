import { supabase } from './supabaseClient';

export const testarConexao = async () => {
  const { data, error } = await supabase.from('pessoa').select('*').limit(1);

  if (error) {
    console.error('Erro ao conectar ao Supabase:', error.message);
  } else {
    console.log('Conexão realizada com sucesso! Dados:', data);
  }
};