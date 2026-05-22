import { supabase } from './supabaseClient';

// Busca todos os livros cadastrados
export const getLivros = async () => {
  const { data, error } = await supabase
    .from('livro')
    .select('*')
    .order('titulo', { ascending: true });
  if (error) throw error;
  return data;
};

// Lógica para o Usuário (Cliente): Criar uma reserva
export const reservarLivro = async (idLivro, idUsuario) => {
  // Busca o id_cliente vinculado à pessoa
  const { data: cliente } = await supabase
    .from('cliente')
    .select('id_cliente')
    .eq('id_pessoa', idUsuario)
    .single();

  const { error } = await supabase.from('reserva').insert([
    {
      id_cliente: cliente.id_cliente,
      id_livro: idLivro,
      prazo_validade: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 dias
      status: 'Pendente'
    }
  ]);
  if (error) throw error;
};