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
 *  - onSuccess  {function} callback chamado após reserva bem-sucedida (ex: atualizar lista)
 */
export default function ReserveBook({ livro, clienteId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro]       = useState(null);
  const [sucesso, setSucesso] = useState(false);

  // Prazo de validade da reserva: 5 dias a partir de hoje
  function calcularPrazoValidade() {
    const data = new Date();
    data.setDate(data.getDate() + 5);
    return data.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  async function handleReservar() {
    setErro(null);

    // 1. Guarda de status — proteção extra além do frontend
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
      // 2. Verifica se o cliente já tem reserva ativa para este livro
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

      // 3. Verifica se o cliente está suspenso ou banido + busca dados para o email
      const { data: clienteData, error: erroCliente } = await supabase
        .from('cliente')
        .select('esta_banido, data_suspensao, pessoa(nome, email, status)')
        .eq('id_cliente', clienteId)
        .single();

      if (erroCliente) throw erroCliente;

      if (clienteData.esta_banido) {
        setErro('Sua conta está banida. Entre em contato com a biblioteca.');
        return;
      }

      if (clienteData.data_suspensao) {
        const suspensao = new Date(clienteData.data_suspensao);
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        if (suspensao >= hoje) {
          const dataFormatada = suspensao.toLocaleDateString('pt-BR');
          setErro(`Sua conta está suspensa até ${dataFormatada}. Não é possível realizar reservas.`);
          return;
        }
      }

      const prazo_validade = calcularPrazoValidade();

      // 4. Cria a reserva com status 'ativa'
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

      // 5. Atualiza o status do livro para 'Reservado'
      const { error: erroLivro } = await supabase
        .from('livro')
        .update({ status: 'Reservado', atualizado_em: new Date().toISOString() })
        .eq('id_livro', livro.id_livro);

      if (erroLivro) throw erroLivro;

      // 6. Gera e envia o QR code por email
      await enviarQRCode({
        id_cliente:    clienteId,
        id_reserva:    novaReserva.id_reserva,
        email:         clienteData.pessoa.email,
        nome:          clienteData.pessoa.nome,
        titulo:        livro.titulo,
        isbn:          livro.isbn,
        prazo_validade,
      });

      // 7. Sucesso
      setSucesso(true);
      onSuccess?.();

    } catch (err) {
      console.error('Erro ao reservar livro:', err);
      setErro('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  // ─── UI ────────────────────────────────────────────────────────────────────

  if (sucesso) {
    return (
      <div className="reserve-book">
        <div className="text-center py-4">
          <div className="text-green-400 text-4xl mb-3">✓</div>
          <h3 className="text-white font-semibold text-lg mb-2">Reserva confirmada!</h3>
          <p className="text-slate-400 text-sm mb-6">
            Sua reserva de <span className="text-white font-medium">{livro.titulo}</span> foi
            realizada. Enviamos um <span className="text-green-400 font-medium">QR code</span> para
            o seu email — apresente-o na biblioteca para retirar o livro.
          </p>
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

  return (
    <div className="reserve-book">
      {/* Cabeçalho */}
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

      {/* Info do livro */}
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

      {/* Aviso validade */}
      {livro.status === 'Disponível' && (
        <p className="text-slate-400 text-xs mb-4">
          📅 Após a reserva você receberá um QR code por email válido por <strong className="text-white">5 dias</strong>.
        </p>
      )}

      {/* Aviso se indisponível */}
      {livro.status !== 'Disponível' && (
        <p className="text-yellow-400 text-sm mb-4">
          ⚠️ {livro.status === 'Reservado'
            ? 'Este livro já está reservado por outro leitor.'
            : 'Este livro está emprestado no momento.'}
        </p>
      )}

      {/* Erro */}
      {erro && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 mb-4">
          ⚠️ {erro}
        </p>
      )}

      {/* Ações */}
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
