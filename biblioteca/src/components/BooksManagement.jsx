import React, { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import BaseTable from "./BaseTable";
import { Botao } from "./Botoes";

const COLUNAS_ACERVO = ["isbn", "titulo", "autor", "editora", "idioma", "status"];
const LABELS_ACERVO = {
  isbn: "ISBN",
  titulo: "Título",
  autor: "Autor",
  editora: "Editora",
  idioma: "Idioma",
  status: "Status",
};

const COMBOBOX_ACERVO = {
  status: {
    options: ["Disponível", "Reservado", "Emprestado"],
    default: "Disponível",
  },
};

export default function BooksManagement({ mode }) {
  const isLibrarian = mode === "librarian";

  const [dados, setDados] = useState([]);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ tipo: "", texto: "" });
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [isbnDeletados, setIsbnDeletados] = useState([]);

  const criarLinhaVazia = () =>
    COLUNAS_ACERVO.reduce((acc, col) => ({
      ...acc,
      [col]: COMBOBOX_ACERVO[col]?.default ?? "",
    }), {});

  const carregarLivros = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("livro")
        .select("*")
        .order("titulo", { ascending: true });
      if (error) throw error;
      const base = data || [];
      setDados(isLibrarian ? [...base, criarLinhaVazia()] : base);
    } catch {
      setMsg({ tipo: "erro", texto: "Não foi possível carregar os livros." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarLivros(); }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modoEdicao || selectedRowIndex === null) return;
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedRowIndex === dados.length - 1) return;
        const linha = dados[selectedRowIndex];
        if (linha?.isbn) setIsbnDeletados(prev => [...prev, linha.isbn]);
        setDados(dados.filter((_, idx) => idx !== selectedRowIndex));
        setSelectedRowIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRowIndex, dados, modoEdicao]);

  const handleCellChange = (rowIndex, columnName, value) => {
    const novosDados = [...dados];
    novosDados[rowIndex] = { ...novosDados[rowIndex], [columnName]: value };
    if (rowIndex === dados.length - 1) {
      const temConteudo = Object.values(novosDados[rowIndex]).some(
        val => val !== undefined && val !== null && String(val).trim() !== "" && val !== (COMBOBOX_ACERVO[columnName]?.default ?? "")
      );
      if (temConteudo) novosDados.push(criarLinhaVazia());
    }
    setDados(novosDados);
  };

  const salvarAlteracoes = async () => {
  setMsg({ tipo: "", texto: "" });
  const linhasParaValidar = dados.filter(row =>
    Object.entries(row).some(([col, val]) =>
      val !== undefined && val !== null &&
      String(val).trim() !== "" &&
      val !== (COMBOBOX_ACERVO[col]?.default ?? "")
    )
  );
  setLoading(true);
  try {
    if (isbnDeletados.length > 0) {
      const { error } = await supabase.from("livro").delete().in("isbn", isbnDeletados);
      if (error) throw error;
    }

    const linhasExistentes = linhasParaValidar.filter(({ id_livro }) =>
      id_livro && String(id_livro).trim() !== ""
    );
    const linhasNovas = linhasParaValidar
      .filter(({ id_livro }) => !id_livro || String(id_livro).trim() === "")
      .map(({ id_livro, cadastrado_em, atualizado_em, ...resto }) => resto);

    // Livros existentes: UPDATE direto pelo id_livro (permite mudar ISBN)
    for (const linha of linhasExistentes) {
      const { id_livro, cadastrado_em, atualizado_em, ...campos } = linha;
      const { error } = await supabase
        .from("livro")
        .update(campos)
        .eq("id_livro", id_livro);
      if (error) throw error;
    }

    // Livros novos: INSERT
    if (linhasNovas.length > 0) {
      const { error } = await supabase.from("livro").insert(linhasNovas);
      if (error) throw error;
    }

    setMsg({ tipo: "sucesso", texto: "Acervo atualizado com sucesso!" });
    setIsbnDeletados([]);
    setSelectedRowIndex(null);
    setModoEdicao(false);
    await carregarLivros();
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
    carregarLivros();
  };

  const handleReservar = async () => {
    if (selectedRowIndex === null) {
      setMsg({ tipo: "erro", texto: "Selecione um livro primeiro." });
      return;
    }
    const livro = dados[selectedRowIndex];
    if (livro.status !== "Disponível") {
      setMsg({ tipo: "erro", texto: "Este livro não está disponível para reserva." });
      return;
    }
    setLoading(true);
    setMsg({ tipo: "", texto: "" });
    try {
      const { error } = await supabase.from("livro").update({ status: "reservado" }).eq("isbn", livro.isbn);
      if (error) throw error;
      setMsg({ tipo: "sucesso", texto: `Livro "${livro.titulo}" reservado com sucesso!` });
      setSelectedRowIndex(null);
      await carregarLivros();
    } catch (error) {
      setMsg({ tipo: "erro", texto: `Erro ao reservar: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

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
          allowNewRow={true}
        />
      </div>

      <div className="absolute bottom-6 left-6 flex gap-4 z-30">
        {isLibrarian && (
          !modoEdicao ? (
            <Botao corFundo="#2563eb" onClick={() => setModoEdicao(true)}>Editar Planilha</Botao>
          ) : (
            <>
              <Botao corFundo="#16a34a" onClick={salvarAlteracoes} disabled={loading}>
                {loading ? "Salvando..." : "Atualizar Banco"}
              </Botao>
              <Botao corFundo="#475569" onClick={handleCancelar} disabled={loading}>Cancelar</Botao>
            </>
          )
        )}

        {!isLibrarian && (
          <Botao corFundo="#16a34a" onClick={handleReservar} disabled={loading || selectedRowIndex === null}>
            {loading ? "Processando..." : "Reservar Livro"}
          </Botao>
        )}
      </div>
    </div>
  );
}