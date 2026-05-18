import { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import GridGestao from "../../components/GridGestao"; 
import { Botao } from "../../components/Botoes";

const COLUNAS_ACERVO = ["isbn", "titulo", "autor", "editora", "idioma", "status"];

export default function LibrarianBooks() {
  const [dados, setDados] = useState([]);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erroValidacao, setErroValidacao] = useState(null);
  const [sucessoMsg, setSucessoMsg] = useState(null);

  // Função para gerar uma linha limpa no formato das colunas
  const criarLinhaVazia = () => 
    COLUNAS_ACERVO.reduce((acc, col) => ({ ...acc, [col]: "" }), {});

  // 1. Carrega os livros do banco de dados ao iniciar
  const carregarLivros = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("livro")
        .select("*")
        .order("titulo", { ascending: true });

      if (error) throw error;

      // Alimenta o estado com os dados do banco + 1 linha vazia no final (padrão Excel)
      setDados([...(data || []), criarLinhaVazia()]);
    } catch (error) {
      console.error("Erro ao carregar acervo:", error.message);
      setErroValidacao("Não foi possível carregar os livros do banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarLivros();
  }, []);

  // 2. Controla a alteração de células com o comportamento dinâmico do Excel
  const handleCellChange = (rowIndex, columnName, value) => {
    const novosDados = [...dados];
    novosDados[rowIndex] = { ...novosDados[rowIndex], [columnName]: value };

    // Se o usuário estiver digitando na ÚLTIMA fileira da tabela
    if (rowIndex === dados.length - 1) {
      // Verifica se há pelo menos alguma coluna preenchida na última fileira
      const temConteudo = Object.values(novosDados[rowIndex]).some(
        (val) => val !== undefined && val !== null && String(val).trim() !== ""
      );

      // Se passou a ter conteúdo, adiciona uma nova linha em branco imediatamente abaixo
      if (temConteudo) {
        novosDados.push(criarLinhaVazia());
      }
    }

    setDados(novosDados);
  };

  // 3. Validação rigorosa e persistência dos dados no Supabase
  const salvarAlteracoes = async () => {
    setErroValidacao(null);
    setSucessoMsg(null);

    // Filtra as linhas: ignora fileiras que ficaram completamente vazias no final
    const linhasParaValidar = dados.filter((row) =>
      Object.values(row).some((val) => val !== undefined && val !== null && String(val).trim() !== "")
    );

    if (linhasParaValidar.length === 0) {
      setErroValidacao("Nenhuma alteração ou dado novo para salvar.");
      return;
    }

    // Validação campo a campo de cada linha
    for (let i = 0; i < linhasParaValidar.length; i++) {
      const linha = linhasParaValidar[i];
      const numeroLinhaExibida = i + 1;

      if (!linha.isbn || String(linha.isbn).trim() === "") {
        setErroValidacao(`Erro na Linha ${numeroLinhaExibida}: O campo 'ISBN' é obrigatório.`);
        return;
      }
      if (!linha.titulo || String(linha.titulo).trim() === "") {
        setErroValidacao(`Erro na Linha ${numeroLinhaExibida}: O campo 'Título' é obrigatório.`);
        return;
      }
      if (!linha.autor || String(linha.autor).trim() === "") {
        setErroValidacao(`Erro na Linha ${numeroLinhaExibida}: O campo 'Autor' é obrigatório.`);
        return;
      }
      if (!linha.editora || String(linha.editora).trim() === "") {
        setErroValidacao(`Erro na Linha ${numeroLinhaExibida}: O campo 'Editora' é obrigatório.`);
        return;
      }
      if (!linha.idioma || String(linha.idioma).trim() === "") {
        setErroValidacao(`Erro na Linha ${numeroLinhaExibida}: O campo 'Idioma' é obrigatório.`);
        return;
      }
      if (!linha.status || String(linha.status).trim() === "") {
        setErroValidacao(`Erro na Linha ${numeroLinhaExibida}: O campo 'Status' é obrigatório.`);
        return;
      }
    }

    // Se passou por todas as validações, realiza o Upsert no Supabase
    setLoading(true);
    try {
      const { error } = await supabase
        .from("livro")
        .upsert(linhasParaValidar, { onConflict: "isbn" }); // Usa o ISBN como chave primária de conflito

      if (error) throw error;

      setSucessoMsg("Acervo atualizado com sucesso!");
      setModoEdicao(false);
      // Recarrega do banco para limpar linhas fantasmas e reestruturar a tabela
      await carregarLivros();
    } catch (error) {
      console.error("Erro ao salvar dados:", error.message);
      setErroValidacao(`Erro ao salvar no banco de dados: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = () => {
    setErroValidacao(null);
    setSucessoMsg(null);
    setModoEdicao(false);
    carregarLivros(); // Reseta para os dados originais do banco
  };

  return (
    <div className="h-screen flex flex-col p-6 bg-slate-950 relative text-white">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">Gerenciamento do Acervo (LibrarianBooks)</h1>
        <p className="text-sm text-slate-400">No modo planilha ativa: Use a última linha para novos cadastros.</p>
      </header>

      {/* Feedbacks de Erro e Sucesso */}
      {erroValidacao && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 font-semibold text-sm animate-pulse">
          ⚠️ {erroValidacao}
        </div>
      )}
      {sucessoMsg && (
        <div className="mb-4 p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400 font-semibold text-sm">
          ✓ {sucessoMsg}
        </div>
      )}

      {/* Grid de Gestão */}
      {loading && dados.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-slate-400">Carregando acervo...</div>
      ) : (
        <GridGestao 
          data={dados} 
          columns={COLUNAS_ACERVO} 
          onCellChange={handleCellChange}
          isReadOnly={!modoEdicao} 
        />
      )}

      {/* Barra Inferior de Ações */}
      <div className="absolute bottom-6 left-6 flex gap-4 z-30">
        {!modoEdicao ? (
          <Botao corFundo="#2563eb" onClick={() => setModoEdicao(true)}>
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
        )}
      </div>
    </div>
  );
}