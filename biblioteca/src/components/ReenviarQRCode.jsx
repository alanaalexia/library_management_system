import { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { enviarQRCode } from '../services/qrcodeService';

/**
 * ReenviarQRCode
 *
 * Botão + lógica de reenvio do QR code para uma reserva ativa.
 * Adicione este componente onde as reservas do estudante são listadas
 * em StudentBooks.jsx.
 *
 * Props:
 *  - reserva  {object}  objeto da reserva { id_reserva, id_livro, prazo_validade }
 *  - clienteId {string} id_cliente do estudante logado
 */
export default function ReenviarQRCode({ reserva, clienteId }) {
  const [loading, setLoading]   = useState(false);
  const [feedback, setFeedback] = useState(null); // 'sucesso' | 'erro'

  async function handleReenviar() {
    setLoading(true);
    setFeedback(null);

    try {
      // Busca dados do livro e do cliente em paralelo
      const [{ data: livroData, error: erroLivro }, { data: clienteData, error: erroCliente }] =
        await Promise.all([
          supabase
            .from('livro')
            .select('titulo, isbn')
            .eq('id_livro', reserva.id_livro)
            .single(),
          supabase
            .from('cliente')
            .select('pessoa(nome, email)')
            .eq('id_cliente', clienteId)
            .single(),
        ]);

      if (erroLivro) throw erroLivro;
      if (erroCliente) throw erroCliente;

      await enviarQRCode({
        id_cliente:    clienteId,
        id_reserva:    reserva.id_reserva,
        email:         clienteData.pessoa.email,
        nome:          clienteData.pessoa.nome,
        titulo:        livroData.titulo,
        isbn:          livroData.isbn,
        prazo_validade: reserva.prazo_validade,
      });

      setFeedback('sucesso');
    } catch (err) {
      console.error('Erro ao reenviar QR code:', err);
      setFeedback('erro');
    } finally {
      setLoading(false);
      // Limpa o feedback após 4 segundos
      setTimeout(() => setFeedback(null), 4000);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleReenviar}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-medium text-green-400 hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <span className="inline-block w-3 h-3 border border-green-400 border-t-transparent rounded-full animate-spin" />
            Enviando…
          </>
        ) : (
          <>
            <span>📩</span>
            Reenviar QR code
          </>
        )}
      </button>

      {feedback === 'sucesso' && (
        <span className="text-xs text-green-400">✓ QR code enviado para o seu email!</span>
      )}
      {feedback === 'erro' && (
        <span className="text-xs text-red-400">⚠️ Falha ao enviar. Tente novamente.</span>
      )}
    </div>
  );
}
