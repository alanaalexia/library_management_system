import { supabase } from './supabaseClient';

/**
 * Envia um email via Edge Function.
 *
 * @param {string} tipo     - Chave do template definido na Edge Function.
 *                            Valores disponíveis: 'cadastro_aprovado'
 *                            (adicionar novos templates na Edge Function conforme necessário)
 * @param {string} para     - Endereço de email do destinatário.
 * @param {Object} dados    - Variáveis que o template usa (ex: { nome: 'João' }).
 *
 * @example
 * await enviarEmail('cadastro_aprovado', 'joao@email.com', { nome: 'João' });
 */
export const enviarEmail = async (tipo, para, dados = {}) => {
  const { data, error } = await supabase.functions.invoke('enviar-email', {
    body: { tipo, para, dados },
  });

  if (error) {
    console.error(`[emailService] Erro ao enviar email do tipo "${tipo}":`, error);
    throw new Error(`Falha ao enviar email: ${error.message}`);
  }

  console.log(`[emailService] Email "${tipo}" enviado para ${para}:`, data);
  return data;
};
