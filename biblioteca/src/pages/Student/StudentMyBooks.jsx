import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../services/supabaseClient";
import { useAuth } from "../../hooks/useAuth";
import StudentHeader from "./StudentHeader";
import BaseTable from "../../components/BaseTable";

const COLUNAS = ["isbn", "titulo", "autor", "editora", "idioma", "tipo", "status", "prazo"];
const LABELS = {
  isbn:     "ISBN",
  titulo:   "Título",
  autor:    "Autor",
  editora:  "Editora",
  idioma:   "Idioma",
  tipo:     "Tipo",
  status:   "Status",
  prazo:    "Prazo",
};

export default function StudentMyBooks() {
  const { user } = useAuth();
  const [dados, setDados]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState({ tipo: "", texto: "" });

  const carregarMeusLivros = useCallback(async () => {
    if (!user?.id_pessoa) return;
    setLoading(true);
    setMsg({ tipo: "", texto: "" });
    try {
      // Busca id_cliente
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

      const clienteId = clienteData.id_cliente;

      // Busca reservas ativas do cliente
      const { data: reservas, error: erroReservas } = await supabase
        .from("reserva")
        .select(`
          id_reserva,
          status,
          prazo_validade,
          livro (isbn, titulo, autor, editora, idioma)
        `)
        .eq("id_cliente", clienteId)
        .eq("status", "ativa");

      if (erroReservas) throw erroReservas;

      // Busca empréstimos ativos do cliente
      const { data: emprestimos, error: erroEmprestimos } = await supabase
        .from("emprestimo")
        .select(`
          id_emprestimo,
          status,
          prazo_devolucao,
          livro (isbn, titulo, autor, editora, idioma)
        `)
        .eq("id_cliente", clienteId)
        .eq("status", "ativo");

      if (erroEmprestimos) throw erroEmprestimos;

      // Monta linhas da tabela
      const linhasReservas = (reservas || []).map(r => ({
        isbn:    r.livro?.isbn    ?? "",
        titulo:  r.livro?.titulo  ?? "",
        autor:   r.livro?.autor   ?? "",
        editora: r.livro?.editora ?? "",
        idioma:  r.livro?.idioma  ?? "",
        tipo:    "Reserva",
        status:  "Reservado",
        prazo:   r.prazo_validade
          ? new Date(r.prazo_validade).toLocaleDateString("pt-BR")
          : "—",
      }));

      const linhasEmprestimos = (emprestimos || []).map(e => ({
        isbn:    e.livro?.isbn    ?? "",
        titulo:  e.livro?.titulo  ?? "",
        autor:   e.livro?.autor   ?? "",
        editora: e.livro?.editora ?? "",
        idioma:  e.livro?.idioma  ?? "",
        tipo:    "Empréstimo",
        status:  "Emprestado",
        prazo:   e.prazo_devolucao
          ? new Date(e.prazo_devolucao).toLocaleDateString("pt-BR")
          : "—",
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
        )}
      </div>
    </div>
  );
}