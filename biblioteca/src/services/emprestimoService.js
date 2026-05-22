import { supabase } from './supabaseClient';

/**
 * Busca todos os empréstimos do aluno autenticado
 * @param {string} idCliente - ID do cliente (aluno)
 * @returns {Promise<Array>} Lista de empréstimos com detalhes do livro
 */
export const getEmprestimosPorAluno = async (idCliente) => {
  const { data, error } = await supabase
    .from('emprestimo')
    .select(`
      id_emprestimo,
      prazo_devolucao,
      data_retorno,
      status,
      livro:id_livro(titulo)
    `)
    .eq('id_cliente', idCliente);

  if (error) throw error;
  return data || [];
};

/**
 * Calcula a quantidade de livros em atraso para um aluno
 * @param {string} idCliente - ID do cliente (aluno)
 * @returns {Promise<number>} Quantidade de livros em atraso
 */
export const getQuantidadeLivrosAtraso = async (idCliente) => {
  const { data, error } = await supabase
    .from('emprestimo')
    .select('id_emprestimo', { count: 'exact' })
    .eq('id_cliente', idCliente)
    .eq('status', 'atrasado');

  if (error) throw error;
  return data?.length || 0;
};

/**
 * Busca todos os empréstimos Ativos (não devolvidos) do aluno com informações de prazo
 * @param {string} idCliente - ID do cliente (aluno)
 * @returns {Promise<Array>} Lista de empréstimos com título e dias restantes/atrasados
 */
export const getAlertsEmprestimos = async (idCliente) => {
  const { data, error } = await supabase
    .from('emprestimo')
    .select(`
      id_emprestimo,
      prazo_devolucao,
      status,
      livro:id_livro(titulo)
    `)
    .eq('id_cliente', idCliente)
    .in('status', ['Ativo', 'atrasado'])
    .order('prazo_devolucao', { ascending: true });

  if (error) throw error;

  // Calcula dias restantes/atrasados para cada empréstimo
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  return (data || []).map((emp) => {
    const prazoDate = new Date(emp.prazo_devolucao);
    prazoDate.setHours(0, 0, 0, 0);

    const diffTime = prazoDate - hoje;
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      id_emprestimo: emp.id_emprestimo,
      bookTitle: emp.livro?.titulo || 'Livro desconhecido',
      daysLeft,
      status: emp.status,
    };
  });
};

/**
 * Busca a quantidade de livros em posse do aluno (empréstimos Ativos + reservas ativas)
 * @param {string} idCliente - ID do cliente (aluno)
 * @returns {Promise<number>} Quantidade de livros em posse
 */
export const getQuantidadeLivrosEmPosse = async (idCliente) => {
  // Contar empréstimos Ativos
  const { count: emprestimoCount, error: emprestimoError } = await supabase
    .from('emprestimo')
    .select('id_emprestimo', { count: 'exact' })
    .eq('id_cliente', idCliente)
    .eq('status', 'Ativo');

  if (emprestimoError) throw emprestimoError;

  // Contar reservas ativas (se a tabela reserva ainda existir)
  let reservaCount = 0;
  const { count, error: reservaError } = await supabase
    .from('reserva')
    .select('id_reserva', { count: 'exact' })
    .eq('id_cliente', idCliente)
    .eq('status', 'ativa');

  if (!reservaError) {
    reservaCount = count || 0;
  }

  return (emprestimoCount || 0) + reservaCount;
};

/**
 * Busca todos os dados necessários para o dashboard do aluno
 * @param {string} idCliente - ID do cliente (aluno)
 * @returns {Promise<Object>} Objeto com overdueBooks, alerts e booksInPossession
 */
export const getDadosAlunoHome = async (idCliente) => {
  const [overdueBooks, alerts, booksInPossession] = await Promise.all([
    getQuantidadeLivrosAtraso(idCliente),
    getAlertsEmprestimos(idCliente),
    getQuantidadeLivrosEmPosse(idCliente),
  ]);

  return {
    overdueBooks,
    alerts,
    booksInPossession,
  };
};
