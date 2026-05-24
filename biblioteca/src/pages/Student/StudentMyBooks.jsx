import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import StudentHeader from "./StudentHeader";
import BaseTable from "../../components/BaseTable";
import ReenviarQRCode from "../../components/ReenviarQRCode";

const COLUNAS = ["isbn", "titulo", "autor", "editora", "idioma", "status", "prazo"];
const LABELS = {
  isbn:    "ISBN",
  titulo:  "Título",
  autor:   "Autor",
  editora: "Editora",
  idioma:  "Idioma",
  status:  "Status",
  prazo:   "Prazo",
};

/**
 * Converte "YYYY-MM-DD" para "DD/MM/YYYY" sem conversão UTC.
 * Evita o desvio de fuso que faz new Date("2026-05-28") virar 27/05 no Brasil.
 */
function formatarData(dataStr) {
  if (!dataStr) return "—";
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function StudentMyBooks() {
  const { user } = useAuth();
  const [dados, setDados]         = useState([]);
  const [reservas, setReservas]   = useState([]); // mantém objetos completos para ações
  const [clienteId, setClienteId] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [msg, setMsg]             = useState({ tipo: "", texto: "" });

  // Modal de cancelamento
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(null);
  const [cancelando, setCancelando]                   = useState(false);

  const carregarMeusLivros = useCallback(async () => {
    if (!user?.id_pessoa) return;
    setLoading(true);
    setMsg({ tipo: "", texto: "" });
    try {
      const { data: clienteData, error: erroCliente } = await supabase
        .from("cliente")
        .select("id_cliente")
        .eq("id_pessoa", user.id_pessoa)
        .maybeSingle();

      if (erroCliente) throw erroCliente;
      if (!clienteData) {
        setMsg({ tipo: "erro", texto: "Perfil de cliente não encontrado." });
        return;
      }

      const id = clienteData.id_cliente;
      setClienteId(id);

      const [
        { data: reservasData, error: erroReservas },
        { data: emprestimosData, error: erroEmprestimos },
      ] = await Promise.all([
        supabase
          .from("reserva")
          .select("id_reserva, id_livro, status, prazo_validade, livro(isbn, titulo, autor, editora, idioma)")
          .eq("id_cliente", id)
          .eq("status", "ativa"),
        supabase
          .from("emprestimo")
          .select("id_emprestimo, status, prazo_devolucao, livro(isbn, titulo, autor, editora, idioma)")
          .eq("id_cliente", id)
          .in("status", ["ativo", "atrasado"]), // ← inclui atrasados
      ]);

      if (erroReservas)    throw erroReservas;
      if (erroEmprestimos) throw erroEmprestimos;

      setReservas(reservasData || []);

      const linhasReservas = (reservasData || []).map(r => ({
        _id_reserva: r.id_reserva,
        _id_livro:   r.id_livro,
        _tipo:       "reserva",
        isbn:        r.livro?.isbn    ?? "",
        titulo:      r.livro?.titulo  ?? "",
        autor:       r.livro?.autor   ?? "",
        editora:     r.livro?.editora ?? "",
        idioma:      r.livro?.idioma  ?? "",
        tipo:        "Reserva",
        status:      "Reservado",
        prazo:       formatarData(r.prazo_validade),
        _prazo_raw:  r.prazo_validade,
      }));

      const linhasEmprestimos = (emprestimosData || []).map(e => ({
        _tipo:   "emprestimo",
        isbn:    e.livro?.isbn    ?? "",
        titulo:  e.livro?.titulo  ?? "",
        autor:   e.livro?.autor   ?? "",
        editora: e.livro?.editora ?? "",
        idioma:  e.livro?.idioma  ?? "",
        tipo:    "Empréstimo",
        status:  e.status === "atrasado" ? "Atrasado" : "Emprestado", // ← exibe Atrasado
        prazo:   formatarData(e.prazo_devolucao),
      }));

      setDados([...linhasEmprestimos, ...linhasReservas]);
    } catch (err) {
      console.error("Erro ao carregar meus livros:", err);
      setMsg({ tipo: "erro", texto: "Não foi possível carregar seus livros." });
    } finally {
      setLoading(false);
    }
  }, [user?.id_pessoa]);

  useEffect(() => { carregarMeusLivros(); }, [carregarMeusLivros]);

  // ─── Cancelar reserva ──────────────────────────────────────────────────────

  async function handleCancelarReserva() {
    if (!confirmandoCancelar) return;
    setCancelando(true);
    try {
      const { error: erroCancelar } = await supabase
        .from("reserva")
        .update({ status: "cancelada" })
        .eq("id_reserva", confirmandoCancelar.id_reserva);

      if (erroCancelar) throw erroCancelar;

      const { error: erroLivro } = await supabase
        .from("livro")
        .update({ status: "Disponível", atualizado_em: new Date().toISOString() })
        .eq("id_livro", confirmandoCancelar.id_livro);

      if (erroLivro) throw erroLivro;

      setConfirmandoCancelar(null);
      setMsg({ tipo: "sucesso", texto: "Reserva cancelada com sucesso." });
      await carregarMeusLivros();
    } catch (err) {
      console.error("Erro ao cancelar reserva:", err);
      setMsg({ tipo: "erro", texto: "Não foi possível cancelar a reserva." });
    } finally {
      setCancelando(false);
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white w-full">
      <StudentHeader />

      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        {msg.texto && (
          <div className={`mb-4 p-3 border rounded-lg text-sm font-semibold ${
            msg.tipo === "erro"
              ? "bg-red-500/20 border-red-500 text-red-400"
              : "bg-green-500/20 border-green-500 text-green-400"
          }`}>
            {msg.tipo === "erro" ? "⚠️ " : "✓ "}{msg.texto}
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-slate-400 text-sm">Carregando seus livros...</span>
          </div>
        ) : dados.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-slate-400 text-sm">Você não possui reservas ou empréstimos ativos.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <BaseTable
              data={dados}
              columns={COLUNAS}
              onCellChange={() => {}}
              isReadOnly={true}
              selectedRowIndex={null}
              onRowSelect={() => {}}
              columnLabels={LABELS}
              allowNewRow={false}
            />

            {/* Ações por reserva */}
            <div className="mt-6 flex flex-col gap-3">
              {dados
                .filter(row => row._tipo === "reserva")
                .map(row => (
                  <div
                    key={row._id_reserva}
                    className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg px-4 py-3"
                  >
                    <span className="text-slate-300 text-sm font-medium truncate max-w-[50%]">
                      {row.titulo}
                    </span>
                    <div className="flex items-center gap-4">
                      {clienteId && (
                        <ReenviarQRCode
                          reserva={{
                            id_reserva:     row._id_reserva,
                            id_livro:       row._id_livro,
                            prazo_validade: row._prazo_raw,
                          }}
                          clienteId={clienteId}
                        />
                      )}
                      <button
                        onClick={() =>
                          setConfirmandoCancelar({
                            id_reserva: row._id_reserva,
                            id_livro:   row._id_livro,
                            titulo:     row.titulo,
                          })
                        }
                        className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors"
                      >
                        🗑 Cancelar reserva
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de confirmação de cancelamento */}
      {confirmandoCancelar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-white font-semibold text-lg mb-2">Cancelar reserva</h3>
            <p className="text-slate-400 text-sm mb-6">
              Tem certeza que deseja cancelar a reserva de{" "}
              <span className="text-white font-medium">{confirmandoCancelar.titulo}</span>?
              O livro voltará a ficar disponível para outros leitores.
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 py-2 px-4 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                onClick={() => setConfirmandoCancelar(null)}
                disabled={cancelando}
              >
                Voltar
              </button>
              <button
                className="flex-1 py-2 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
                onClick={handleCancelarReserva}
                disabled={cancelando}
              >
                {cancelando ? "Cancelando…" : "Confirmar cancelamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}