import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import { enviarEmail } from "../../services/emailService";
import BaseTable from "../../components/BaseTable";
import { Botao } from "../../components/Botoes";
import LibrarianHeader from "./LibrarianHeader";

const COLUNAS = ["nome", "email", "status"];

const LABELS = {
  nome:   "NOME",
  email:  "E-MAIL",
  status: "STATUS",
};

const COMBOBOX = {
  status: {
    options: ["Pendente", "Ativo", "Rejeitado", "Banido"],
    default: "Pendente",
  },
};

export default function LibrarianStudents() {
  const [dados, setDados]                       = useState([]);
  const [dadosOriginais, setDadosOriginais]     = useState([]);
  const [modoEdicao, setModoEdicao]             = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [msg, setMsg]                           = useState({ tipo: "", texto: "" });
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [idsDeletados, setIdsDeletados]         = useState([]);

  const criarLinhaVazia = () =>
    COLUNAS.reduce((acc, col) => ({
      ...acc,
      [col]: COMBOBOX[col]?.default ?? "",
    }), {});

  const carregarEstudantes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pessoa")
        .select("id_pessoa, nome, email, status")
        .eq("papel", "cliente")
        .order("nome", { ascending: true });
      if (error) throw error;
      const linhas = [...(data || []), criarLinhaVazia()];
      setDados(linhas);
      setDadosOriginais(data || []);
    } catch {
      setMsg({ tipo: "erro", texto: "Não foi possível carregar os estudantes." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { carregarEstudantes(); }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!modoEdicao || selectedRowIndex === null) return;
      if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT") return;
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedRowIndex === dados.length - 1) return;
        const linha = dados[selectedRowIndex];
        if (linha?.id_pessoa) setIdsDeletados(prev => [...prev, linha.id_pessoa]);
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
      const temConteudo = Object.entries(novosDados[rowIndex]).some(
        ([col, val]) => val !== undefined && val !== null &&
          String(val).trim() !== "" &&
          val !== (COMBOBOX[col]?.default ?? "")
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
        val !== (COMBOBOX[col]?.default ?? "")
      )
    );
    setLoading(true);
    try {
      if (idsDeletados.length > 0) {
        const { error } = await supabase
          .from("pessoa")
          .delete()
          .in("id_pessoa", idsDeletados);
        if (error) throw error;
      }

      const linhasExistentes = linhasParaValidar.filter(({ id_pessoa }) =>
        id_pessoa && String(id_pessoa).trim() !== ""
      );
      const linhasNovas = linhasParaValidar
        .filter(({ id_pessoa }) => !id_pessoa || String(id_pessoa).trim() === "")
        .map(({ id_pessoa, criado_em, atualizado_em, ...resto }) => ({
          ...resto,
          papel: "cliente",
          status: resto.status || "Pendente",
        }));

      for (const linha of linhasExistentes) {
        const { id_pessoa, criado_em, atualizado_em, ...campos } = linha;
        const { error } = await supabase
          .from("pessoa")
          .update(campos)
          .eq("id_pessoa", id_pessoa);
        if (error) throw error;

        const original = dadosOriginais.find(d => d.id_pessoa === id_pessoa);
        const foiAtivadoAgora = original?.status !== 'Ativo' && campos.status === 'Ativo';

        if (foiAtivadoAgora) {
          try {
            await enviarEmail('cadastro_aprovado', linha.email, { nome: linha.nome });
          } catch (emailErr) {
            console.warn(`[LibrarianStudents] Falha ao enviar email para ${linha.email}:`, emailErr.message);
          }
        }
      }

      if (linhasNovas.length > 0) {
        const { error } = await supabase.from("pessoa").insert(linhasNovas);
        if (error) throw error;
      }

      setMsg({ tipo: "sucesso", texto: "Estudantes atualizados com sucesso!" });
      setIdsDeletados([]);
      setSelectedRowIndex(null);
      setModoEdicao(false);
      await carregarEstudantes();
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
    setIdsDeletados([]);
    carregarEstudantes();
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white w-full">
      <LibrarianHeader />

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
            columns={COLUNAS}
            onCellChange={handleCellChange}
            isReadOnly={!modoEdicao}
            selectedRowIndex={selectedRowIndex}
            onRowSelect={setSelectedRowIndex}
            comboboxConfig={COMBOBOX}
            columnLabels={LABELS}
            allowNewRow={false}
            readOnlyCells={(row, col) => col === "status" && row.status === "Suspenso"}
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