import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import GridGestao from "../../components/GridGestao"; 
import { Botao } from "../../components/Botoes";
import LibrarianHeader from "./LibrarianHeader";

const COLUNAS_ACERVO = ["isbn", "titulo", "autor", "editora", "idioma", "status"];

export default function LibrarianBooks() {
  const [dados, setDados] = useState([]);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erroValidacao, setErroValidacao] = useState(null);
  const [sucessoMsg, setSucessoMsg] = useState(null);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [isbnDeletados, setIsbnDeletados] = useState([]);

  const criarLinhaVazia = () => 
    COLUNAS_ACERVO.reduce((acc, col) => ({ ...acc, [col]: "" }), {});

  const carregarLivros = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("livro")
        .select("*")
        .order("titulo", { ascending: true });
      if (error) throw error;
      setDados([...(data || []), criarLinhaVazia()]);
    } catch (error) {
      setErroValidacao("Não foi possível carregar os livros do banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLivros();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modoEdicao || selectedRowIndex === null) return;
      if (document.activeElement.tagName === "INPUT") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedRowIndex === dados.length - 1) return;

        const linhaParaRemover = dados[selectedRowIndex];
        if (linhaParaRemover && linhaParaRemover.isbn) {
          setIsbnDeletados((prev) => [...prev, linhaParaRemover.isbn]);
        }

        const novosDados = dados.filter((_, idx) => idx !== selectedRowIndex);
        setDados(novosDados);
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
        (val) => val !== undefined && val !== null && String(val).trim() !== ""
      );
      if (temConteudo) {
        novosDados.push(criarLinhaVazia());
      }
    }
    setDados(novosDados);
  };

  const salvarAlteracoes = async () => {
    setErroValidacao(null);
    setSucessoMsg(null);

    const linhasParaValidar = dados.filter((row) =>
      Object.values(row).some((val) => val !== undefined && val !== null && String(val).trim() !== "")
    );

    setLoading(true);
    try {
      if (isbnDeletados.length > 0) {
        const { error: deleteError } = await supabase
          .from("livro")
          .delete()
          .in("isbn", isbnDeletados);
        if (deleteError) throw deleteError;
      }

      if (linhasParaValidar.length > 0) {
        const linhasExistentes = linhasParaValidar.filter(({ id_livro }) =>
          id_livro && String(id_livro).trim() !== ""
        );
        const linhasNovas = linhasParaValidar
          .filter(({ id_livro }) => !id_livro || String(id_livro).trim() === "")
          .map(({ id_livro, cadastrado_em, atualizado_em, ...resto }) => resto); // remove campos gerados pelo banco

        if (linhasExistentes.length > 0) {
          const { error } = await supabase
            .from("livro")
            .upsert(linhasExistentes, { onConflict: "isbn" });
          if (error) throw error;
        }

        if (linhasNovas.length > 0) {
          const { error } = await supabase
            .from("livro")
            .insert(linhasNovas);
          if (error) throw error;
        }
      }

      setSucessoMsg("Acervo atualizado com sucesso!");
      setIsbnDeletados([]);
      setSelectedRowIndex(null);
      setModoEdicao(false);
      await carregarLivros();
    } catch (error) {
      setErroValidacao(`Erro ao salvar no banco de dados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    setErroValidacao(null);
    setSucessoMsg(null);
    setModoEdicao(false);
    setSelectedRowIndex(null);
    setIsbnDeletados([]);
    carregarLivros();
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white w-full">
      {/* Cabeçalho superior de controle */}
      <LibrarianHeader />

      {/* Área interna de conteúdo técnico */}
      <div className="flex-1 flex flex-col p-6 relative overflow-hidden">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">Gerenciamento do Acervo (LibrarianBooks)</h1>
          <p className="text-sm text-slate-400">Clique no ícone de 3 linhas para selecionar e aperte Delete/Backspace para apagar localmente.</p>
        </header>

        {erroValidacao && <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">⚠️ {erroValidacao}</div>}
        {sucessoMsg && <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm">✓ {sucessoMsg}</div>}

        <div className="flex-1 overflow-hidden mb-20">
          <GridGestao 
            data={dados} 
            columns={COLUNAS_ACERVO} 
            onCellChange={handleCellChange}
            isReadOnly={!modoEdicao} 
            selectedRowIndex={selectedRowIndex}
            onRowSelect={setSelectedRowIndex}
          />
        </div>

        <div className="absolute bottom-6 left-6 flex gap-4 z-30">
          {!modoEdicao ? (
            <Botao corFundo="#2563eb" onClick={() => setModoEdicao(true)}>Editar Planilha</Botao>
          ) : (
            <>
              <Botao corFundo="#16a34a" onClick={salvarAlteracoes} disabled={loading}>
                {loading ? "Salvando..." : "Atualizar Banco"}
              </Botao>
              <Botao corFundo="#475569" onClick={handleCancelar} disabled={loading}>Cancelar</Botao>
            </>
          )}
        </div>
      </div>
    </div>
  );
}