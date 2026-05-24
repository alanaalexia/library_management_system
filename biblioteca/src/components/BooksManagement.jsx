import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "../hooks/useAuth";
import BaseTable from "./BaseTable";
import { Botao } from "./Botoes";
import ReserveBook from "./ReserveBook";

const COLUNAS_ACERVO = ["isbn", "titulo", "autor", "editora", "idioma", "status"];
const LABELS_ACERVO = {
  isbn: "ISBN",
  titulo: "Título",
  autor: "Autor",
  editora: "Editora",
  idioma: "Idioma",
  status: "Status",
};
const COMBOBOX_ACERVO = {};

export default function BooksManagement({ mode }) {
  const isLibrarian = mode === "librarian";
  const { user } = useAuth();

  const [dados, setDados]                       = useState([]);
  const [modoEdicao, setModoEdicao]             = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [msg, setMsg]                           = useState({ tipo: "", texto: "" });
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [isbnDeletados, setIsbnDeletados]       = useState([]);
  const [modalReserva, setModalReserva]         = useState(false);
  const [clienteId, setClienteId]               = useState(null);

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const criarLinhaVazia = () =>
    COLUNAS_ACERVO.reduce((acc, col) => ({
      ...acc,
      [col]: col === "status" ? "Disponível" : "",
    }), {});

  // ─── Carregar livros ───────────────────────────────────────────────────────

  const carregarLivros = useCallback(async (editando = false) => {
    setLoading(true);
    try {
      await supabase.rpc('expirar_reservas_vencidas');

      const { data, error } = await supabase
        .from("livro")
        .select("*")
        .order("titulo", { ascending: true });
      if (error) throw error;
      const base = data || [];

      // Linha nova no início, só no modo edição
      setDados(isLibrarian && editando ? [criarLinhaVazia(), ...base] : base);
    } catch {
      setMsg({ tipo: "erro", texto: "Não foi possível carregar os livros." });
    } finally {
      setLoading(false);
    }
  }, [isLibrarian]);

  useEffect(() => { carregarLivros(); }, [carregarLivros]);

  // ─── Buscar id_cliente do estudante logado ─────────────────────────────────

  useEffect(() => {
    if (isLibrarian || !user?.id_pessoa) return;
    const buscarClienteId = async () => {
      const { data } = await supabase
        .from("cliente")
        .select("id_cliente")
        .eq("id_pessoa", user.id_pessoa)
        .maybeSingle();
      if (data) setClienteId(data.id_cliente);
    };
    buscarClienteId();
  }, [isLibrarian, user?.id_pessoa]);

  // ─── Entrar no modo edição ─────────────────────────────────────────────────

  const handleEntrarEdicao = async () => {
    setModoEdicao(true);
    await carregarLivros(true); // carrega com linha vazia no início
  };

  // ─── Tecla Delete (modo edição bibliotecário) ──────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modoEdicao || selectedRowIndex === null) return;
      const tag = document.activeElement.tagName;
      if (tag === "INPUT" || tag === "SELECT") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedRowIndex === 0 && !dados[0]?.id_livro) return; // protege linha nova
        const linha = dados[selectedRowIndex];
        if (linha?.isbn) setIsbnDeletados(prev => [...prev, linha.isbn]);
        setDados(prev => prev.filter((_, idx) => idx !== selectedRowIndex));
        setSelectedRowIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRowIndex, dados, modoEdicao]);

  // ─── Edição de célula ──────────────────────────────────────────────────────

  const handleCellChange = (rowIndex, columnName, value) => {
    const novosDados = [...dados];
    novosDados[rowIndex] = { ...novosDados[rowIndex], [columnName]: value };
    setDados(novosDados);
  };

  // ─── Salvar (bibliotecário) ────────────────────────────────────────────────

  const salvarAlteracoes = async () => {
    setMsg({ tipo: "", texto: "" });

    const linhasParaValidar = dados.filter(row =>
      Object.entries(row).some(([col, val]) =>
        col !== "status" &&
        val !== undefined &&
        val !== null &&
        String(val).trim() !== ""
      )
    );

    // Validação: ISBN obrigatório em todas as linhas com conteúdo
    const semIsbn = linhasParaValidar.filter(
      row => !row.isbn || String(row.isbn).trim() === ""
    );
    if (semIsbn.length > 0) {
      setMsg({ tipo: "erro", texto: "Todas as linhas precisam ter o ISBN preenchido." });
      return;
    }

    setLoading(true);
    try {
      if (isbnDeletados.length > 0) {
        const { error } = await supabase.from("livro").delete().in("isbn", isbnDeletados);
        if (error) throw error;
      }

      const linhasExistentes = linhasParaValidar.filter(
        ({ id_livro }) => id_livro && String(id_livro).trim() !== ""
      );
      const linhasNovas = linhasParaValidar
        .filter(({ id_livro }) => !id_livro || String(id_livro).trim() === "")
        .map(({ id_livro, cadastrado_em, atualizado_em, ...resto }) => resto);

      for (const linha of linhasExistentes) {
        const { id_livro, cadastrado_em, atualizado_em, ...campos } = linha;
        const { error } = await supabase
          .from("livro")
          .update(campos)
          .eq("id_livro", id_livro);
        if (error) throw error;
      }

      if (linhasNovas.length > 0) {
        const { error } = await supabase.from("livro").insert(linhasNovas);
        if (error) throw error;
      }

      setMsg({ tipo: "sucesso", texto: "Acervo atualizado com sucesso!" });
      setIsbnDeletados([]);
      setSelectedRowIndex(null);
      setModoEdicao(false);
      await carregarLivros(false);
    } catch (error) {
      setMsg({ tipo: "erro", texto: `Erro ao salvar: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    setMsg({ tipo: "", texto: "" });
    setModoEdicao(false);
    setSelectedRowIndex(null);
    setIsbnDeletados([]);
    carregarLivros(false);
  };

  // ─── Reserva (estudante) ───────────────────────────────────────────────────

  const handleAbrirReserva = () => {
    if (selectedRowIndex === null) {
      setMsg({ tipo: "erro", texto: "Selecione um livro primeiro." });
      return;
    }
    setMsg({ tipo: "", texto: "" });
    setModalReserva(true);
  };

  const handleFecharReserva = () => setModalReserva(false);

  const handleReservaConfirmada = async () => {
    setModalReserva(false);
    setSelectedRowIndex(null);
    setMsg({ tipo: "sucesso", texto: "Livro reservado com sucesso! QRcode enviado para seu email." });
    await carregarLivros(false);
  };

  // ─── Emprestar (bibliotecário) ─────────────────────────────────────────────

  const handleEmpresitar = async (row) => {
    setMsg({ tipo: "", texto: "" });
    try {
      const { data: reserva, error: erroReserva } = await supabase
        .from("reserva")
        .select("id_reserva, id_cliente")
        .eq("id_livro", row.id_livro)
        .eq("status", "ativa")
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (erroReserva) throw erroReserva;
      if (!reserva) {
        setMsg({ tipo: "erro", texto: "Nenhuma reserva ativa encontrada para este livro." });
        return;
      }

      const prazo = new Date();
      prazo.setDate(prazo.getDate() + 30);
      const prazoDevolucao = prazo.toISOString().split("T")[0];

      const { error: erroEmprestimo } = await supabase
        .from("emprestimo")
        .insert({
          id_reserva:      reserva.id_reserva,
          id_cliente:      reserva.id_cliente,
          id_livro:        row.id_livro,
          prazo_devolucao: prazoDevolucao,
          status:          "ativo",
        });

      if (erroEmprestimo) throw erroEmprestimo;

      const { error: erroAtualizaReserva } = await supabase
        .from("reserva")
        .update({ status: "convertida" })
        .eq("id_reserva", reserva.id_reserva);

      if (erroAtualizaReserva) throw erroAtualizaReserva;

      setMsg({ tipo: "sucesso", texto: `Empréstimo de "${row.titulo}" criado com prazo de 30 dias.` });
      await carregarLivros(modoEdicao);
    } catch (error) {
      setMsg({ tipo: "erro", texto: `Erro ao emprestar: ${error.message}` });
    }
  };

  // ─── Retornar livro (bibliotecário) ───────────────────────────────────────

  const handleRetornar = async (row) => {
    setMsg({ tipo: "", texto: "" });
    try {
      const { data: emprestimo, error: erroEmprestimo } = await supabase
        .from("emprestimo")
        .select("id_emprestimo")
        .eq("id_livro", row.id_livro)
        .eq("status", "ativo")
        .maybeSingle();

      if (erroEmprestimo) throw erroEmprestimo;
      if (!emprestimo) {
        setMsg({ tipo: "erro", texto: "Nenhum empréstimo ativo encontrado para este livro." });
        return;
      }

      const { error: erroAtualiza } = await supabase
        .from("emprestimo")
        .update({
          status:        "devolvido",
          data_retorno:  new Date().toISOString().split("T")[0],
          atualizado_em: new Date().toISOString(),
        })
        .eq("id_emprestimo", emprestimo.id_emprestimo);

      if (erroAtualiza) throw erroAtualiza;

      setMsg({ tipo: "sucesso", texto: `"${row.titulo}" devolvido com sucesso.` });
      await carregarLivros(modoEdicao);
    } catch (error) {
      setMsg({ tipo: "erro", texto: `Erro ao retornar livro: ${error.message}` });
    }
  };

  // ─── Colunas extras (apenas bibliotecário) ────────────────────────────────

  const extraColumns = isLibrarian ? [
    {
      label:       "Emprestar",
      buttonLabel: "Emprestar",
      buttonColor: "#0e7490",
      showWhen:    { key: "status", value: "Reservado" },
      onClick:     handleEmpresitar,
    },
    {
      label:       "Retornar",
      buttonLabel: "Retornar",
      buttonColor: "#b45309",
      showWhen:    { key: "status", value: "Emprestado" },
      onClick:     handleRetornar,
    },
  ] : [];

  // ─── Render ────────────────────────────────────────────────────────────────

  const livroSelecionado = selectedRowIndex !== null ? dados[selectedRowIndex] : null;

  return (
    <div className="flex-1 flex flex-col p-6 relative overflow-hidden">

      {msg.texto && (
        <div className={`mb-4 p-3 border rounded-lg text-sm font-semibold ${
          msg.tipo === "erro"
            ? "bg-red-500/20 border-red-500 text-red-400"
            : "bg-green-500/20 border-green-500 text-green-400"
        }`}>
          {msg.tipo === "erro" ? "⚠️ " : "✓ "}{msg.texto}
        </div>
      )}

      <div className="flex-1 overflow-hidden mb-20">
        <BaseTable
          data={dados}
          columns={COLUNAS_ACERVO}
          onCellChange={isLibrarian ? handleCellChange : () => {}}
          isReadOnly={!isLibrarian || !modoEdicao}
          selectedRowIndex={selectedRowIndex}
          onRowSelect={setSelectedRowIndex}
          comboboxConfig={COMBOBOX_ACERVO}
          columnLabels={LABELS_ACERVO}
          allowNewRow={false}
          readOnlyColumns={isLibrarian ? ["status"] : []}
          extraColumns={extraColumns}
        />
      </div>

      <div className="absolute bottom-6 left-6 flex gap-4 z-30">
        {isLibrarian && (
          !modoEdicao ? (
            <Botao corFundo="#2563eb" onClick={handleEntrarEdicao}>
              Editar Planilha
            </Botao>
          ) : (
            <>
              <Botao corFundo="#16a34a" onClick={salvarAlteracoes} disabled={loading}>
                {loading ? "Salvando..." : "Atualizar Banco"}
              </Botao>
              <Botao corFundo="#475569" onClick={handleCancelar} disabled={loading}>
                Cancelar
              </Botao>
            </>
          )
        )}

        {!isLibrarian && (
          <Botao
            corFundo="#16a34a"
            onClick={handleAbrirReserva}
            disabled={loading || selectedRowIndex === null}
          >
            {loading ? "Processando..." : "Reservar Livro"}
          </Botao>
        )}
      </div>

      {/* Modal de reserva */}
      {modalReserva && livroSelecionado && clienteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md p-6">
            <ReserveBook
              livro={livroSelecionado}
              clienteId={clienteId}
              onClose={handleFecharReserva}
              onSuccess={handleReservaConfirmada}
            />
          </div>
        </div>
      )}
    </div>
  );
}