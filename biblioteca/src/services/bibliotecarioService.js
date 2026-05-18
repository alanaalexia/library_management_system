import { supabase } from './supabaseClient';

/**
 * Conta quantos estudantes estão com livros em atraso
 * @returns {Promise<number>} Quantidade de clientes com empréstimos atrasados
 */
export const getEstudantesComAtrasados = async () => {
  const { data, error } = await supabase
    .from('emprestimo')
    .select('id_cliente')
    .eq('status', 'atrasado');

  if (error) throw error;

  // Contar clientes únicos
  const clientesUnicos = new Set(data?.map((e) => e.id_cliente) || []);
  return clientesUnicos.size;
};

/**
 * Conta quantos estudantes estão com cadastro pendente de aprovação
 * @returns {Promise<number>} Quantidade de pessoas com papel 'cliente' e status 'pendente'
 */
export const getEstudantesPendentes = async () => {
  const { count, error } = await supabase
    .from('pessoa')
    .select('id_pessoa', { count: 'exact' })
    .eq('papel', 'cliente')
    .eq('status', 'pendente');

  if (error) throw error;
  return count || 0;
};

/**
 * Conta quantos estudantes estão suspensos
 * @returns {Promise<number>} Quantidade de pessoas com papel 'cliente' e status 'suspenso'
 */
export const getEstudantesSuspensos = async () => {
  const { count, error } = await supabase
    .from('pessoa')
    .select('id_pessoa', { count: 'exact' })
    .eq('papel', 'cliente')
    .eq('status', 'suspenso');

  if (error) throw error;
  return count || 0;
};

/**
 * Busca todos os dados necessários para o dashboard do bibliotecário
 * @returns {Promise<Object>} Objeto com stats (pendingConfirmation, overdue, suspended)
 */
export const getDadosBibliotecarioHome = async () => {
  const [pendingConfirmation, overdue, suspended] = await Promise.all([
    getEstudantesPendentes(),
    getEstudantesComAtrasados(),
    getEstudantesSuspensos(),
  ]);

  return {
    pendingConfirmation,
    overdue,
    suspended,
  };
};
