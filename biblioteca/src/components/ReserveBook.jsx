import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { enviarQRCode } from '../services/qrcodeService';

/**
 * ReserveBook
 *
 * Props:
 *  - livro      {object}   objeto do livro selecionado (id_livro, titulo, autor, isbn, status)
 *  - clienteId  {string}   id_cliente do estudante logado
 *  - onClose    {function} fecha o modal
 *  - onSuccess  {function} callback chamado após reserva bem-sucedida
 */
export default function ReserveBook({ livro, clienteId, onClose, onSuccess }) {
  const [loading, setLoading]       = useState(false);
  const [erro, setErro]             = useState(null);
  const [sucesso, setSucesso]       = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [emailErro, setEmailErro]   = useState(false);

  /**
   * Monta YYYY-MM-DD usando a data LOCAL do usuário (sem conversão UTC).
   * Evita desvio de fuso (ex: Brasília UTC-3 virava um dia antes).
   */
  function calcularPrazoValidade() {
    const data = new Date();
    data.setDate(data.getDate() + 5);
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  async function handleReservar() {
    setErro(null);

    if (livro.status !== 'Disponível') {
      setErro(
        livro.status === 'Reservado'
          ? 'Este livro já está reservado por outro leitor.'
          : 'Este livro está emprestado no momento e não pode ser reservado.'
      );
      return;
    }

    setLoading(true);

    try {
      // 1. Verifica reserva duplicada
      const { data: reservaExistente, error: erroVerificacao } = await supabase
        .from('reserva')
        .select('id_reserva')
        .eq('id_cliente', clienteId)
        .eq('id_livro', livro.id_livro)
        .in('status', ['pendente', 'ativa'])
        .maybeSingle();

      if (erroVerificacao) throw erroVerificacao;
      if (reservaExistente) {
        setErro('Você já possui uma reserva ativa para este livro.');
        return;
      }

      // 2. Elegibilidade + contagem de reservas (em paralelo)
      const [
        { data: clienteData, error: erroCliente },
        { count: totalReservas, error: erroContagem },
      ] = await Promise.all([
        supabase
          .from('cliente')
          .select('esta_banido, data_suspensao, pessoa(nome, email, status)')
          .eq('id_cliente', clienteId)
          .single(),
        supabase
          .from('reserva')
          .select('*', { count: 'exact', head: true })
          .eq('id_cliente', clienteId)
          .in('status', ['pendente', 'ativa']),
      ]);

      if (erroCliente)  throw erroCliente;
      if (erroContagem) throw erroContagem;

      if (clienteData.esta_banido) {
        setErro('Sua conta está banida. Entre em contato com a biblioteca.');
        return;
      }

      if (clienteData.data_suspensao) {
        const suspensao = new Date(clienteData.data_suspensao);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        if (suspensao >= hoje) {
          setErro(`Sua conta está suspensa até ${suspensao.toLocaleDateString('pt-BR')}. Não é possível realizar reservas.`);
          return;
        }
      }

      if (totalReservas >= 2) {
        setErro('Você já possui 2 reservas ativas. Devolva ou aguarde o vencimento de uma antes de reservar outro livro.');
        return;
      }

      const prazo_validade = calcularPrazoValidade();

      // 3. Cria a reserva
      const { data: novaReserva, error: erroReserva } = await supabase
        .from('reserva')
        .insert({
          id_cliente:     clienteId,
          id_livro:       livro.id_livro,
          prazo_validade,
          status:         'ativa',
        })
        .select('id_reserva')
        .single();

      if (erroReserva) throw erroReserva;

      // 4. Atualiza livro para 'Reservado'
      const { error: erroLivro } = await supabase
        .from('livro')
        .update({ status: 'Reservado', atualizado_em: new Date().toISOString() })
        .eq('id_livro', livro.id_livro);

      if (erroLivro) throw erroLivro;

      // 5. Mostra sucesso imediatamente — email é disparado em paralelo
      setSucesso(true);
      onSuccess?.();

      // 6. Envia QR code — falha não bloqueia o fluxo, mas atualiza o estado do email
      enviarQRCode({
        id_cliente:    clienteId,
        id_reserva:    novaReserva.id_reserva,
        email:         clienteData.pessoa.email,
        nome:          clienteData.pessoa.nome,
        titulo:        livro.titulo,
        isbn:          livro.isbn,
        prazo_validade,
      })
        .then(() => setEmailEnviado(true))
        .catch((err) => {
          console.error('[ReserveBook] Falha ao enviar QR code:', err);
          setEmailErro(true);
        });

    } catch (err) {
      console.error('Erro ao reservar livro:', err);
      setErro('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // ─── Tela de sucesso ───────────────────────────────────────────────────────

  if (sucesso) {
    return (
      <div className="reserve-book">
        <div className="text-center py-4">
          <div className="text-green-400 text-5xl mb-4">✓</div>
          <h3 className="text-white font-semibold text-lg mb-2">Reserva confirmada!</h3>
          <p className="text-slate-400 text-sm mb-4">
            <span className="text-white font-medium">{livro.titulo}</span> foi reservado com sucesso.
          </p>

          {/* Status do envio do QR code */}
          {!emailEnviado && !emailErro && (
            <div className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 mb-6 text-left">
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <span className="inline-block w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                Enviando QR code para o seu email…
              </p>
            </div>
          )}

          {emailEnviado && (
            <div className="bg-slate-800 border border-green-500/40 rounded-lg px-4 py-3 mb-6 text-left">
              <p className="text-green-400 text-sm font-medium mb-1">📩 QR code enviado!</p>
              <p className="text-slate-400 text-xs">
                Verifique sua caixa de entrada e apresente o QR code na biblioteca para retirar o livro.
              </p>
            </div>
          )}

          {emailErro && (
            <div className="bg-slate-800 border border-yellow-500/40 rounded-lg px-4 py-3 mb-6 text-left">
              <p className="text-yellow-400 text-sm font-medium mb-1">⚠️ Falha ao enviar o QR code</p>
              <p className="text-slate-400 text-xs">
                Sua reserva foi criada, mas o email não foi enviado. Use "Reenviar QR code" na tela Meus Livros.
              </p>
            </div>
          )}

          <button
            className="w-full py-2 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // ─── Formulário de reserva ─────────────────────────────────────────────────

  return (
    <div className="reserve-book">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold text-lg">Reservar livro</h3>
        <button
          className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
          onClick={onClose}
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <div className="bg-slate-800 rounded-lg p-4 mb-5">
        <p className="text-white font-medium">{livro.titulo}</p>
        <p className="text-slate-400 text-sm mt-1">{livro.autor}</p>
        <span className={`inline-block mt-2 text-xs font-semibold px-2 py-0.5 rounded-full ${
          livro.status === 'Disponível'
            ? 'bg-green-500/20 text-green-400'
            : livro.status === 'Reservado'
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'bg-red-500/20 text-red-400'
        }`}>
          {livro.status}
        </span>
      </div>

      {livro.status === 'Disponível' && (
        <p className="text-slate-400 text-xs mb-4">
          📅 Após a reserva você receberá um QR code por email válido por <strong className="text-white">5 dias</strong>.
        </p>
      )}

      {livro.status !== 'Disponível' && (
        <p className="text-yellow-400 text-sm mb-4">
          ⚠️ {livro.status === 'Reservado'
            ? 'Este livro já está reservado por outro leitor.'
            : 'Este livro está emprestado no momento.'}
        </p>
      )}

      {erro && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
          ⚠️ {erro}
        </p>
      )}

      <div className="flex gap-3">
        <button
          className="flex-1 py-2 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          className="flex-1 py-2 px-4 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleReservar}
          disabled={loading || livro.status !== 'Disponível'}
        >
          {loading ? 'Reservando…' : 'Confirmar reserva'}
        </button>
      </div>
    </div>
  );
}
