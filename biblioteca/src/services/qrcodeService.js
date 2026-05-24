import { supabase } from './supabaseClient';
import { enviarEmail } from './emailService';

/**
 * Monta o payload JSON que será codificado no QR code.
 * Ao escanear com qualquer câmera, o conteúdo aparece como texto legível.
 */
function montarPayload({ titulo, isbn, prazo_validade, id_reserva }) {
  return JSON.stringify({
    titulo,
    isbn,
    validade: prazo_validade,
    reserva: id_reserva,
  });
}

/**
 * Gera a URL da imagem QR code via Google Charts API.
 * O Gmail (e qualquer cliente de email) aceita sem bloqueio.
 */
function gerarQRCodeUrl(payload) {
  const encoded = encodeURIComponent(payload);
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}&format=png`;
}

/**
 * Registra a notificação de QR code no banco.
 * Falha silenciosa — o QR já foi enviado ao usuário, não deve bloquear o fluxo.
 */
async function registrarNotificacao({ id_cliente, id_reserva, conteudo }) {
  const { error } = await supabase.from('notificacao').insert({
    id_cliente,
    id_reserva,
    conteudo,
    enviado: true,
    data_envio: new Date().toISOString(),
  });

  if (error) {
    console.error('[qrcodeService] Erro ao registrar notificação:', error);
  }
}

/**
 * Formata data de YYYY-MM-DD para DD/MM/YYYY.
 */
function formatarData(dataStr) {
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * Fluxo completo: gera a URL do QR code, envia por email e registra a notificação.
 *
 * @param {object} params
 * @param {string} params.id_cliente     - id do cliente
 * @param {string} params.id_reserva     - id da reserva recém-criada
 * @param {string} params.email          - email do usuário
 * @param {string} params.nome           - nome do usuário
 * @param {string} params.titulo         - título do livro
 * @param {string} params.isbn           - ISBN do livro
 * @param {string} params.prazo_validade - validade no formato YYYY-MM-DD
 */
export async function enviarQRCode({ id_cliente, id_reserva, email, nome, titulo, isbn, prazo_validade }) {
  const payload     = montarPayload({ titulo, isbn, prazo_validade, id_reserva });
  const qrCodeUrl   = gerarQRCodeUrl(payload);

  await enviarEmail('qrcode_reserva', email, {
    nome,
    titulo,
    isbn,
    prazo_validade: formatarData(prazo_validade),
    qrCodeUrl,  // URL externa — funciona em qualquer cliente de email
  });

  await registrarNotificacao({ id_cliente, id_reserva, conteudo: payload });
}