import React, { useState, useEffect } from "react";
import { supabase } from "../../services/supabaseClient";
import GridGestao from "../../components/GridGestao";
import { Botao } from "../../components/Botoes";
import StudentHeader from "./StudentHeader";

const COLUNAS_ACERVO = ["isbn", "titulo", "autor", "editora", "idioma", "status"];

export default function StudentBooks() {
  const [dados, setDados] = useState([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ tipo: "", texto: "" });

  const carregarAcervo = async () => {
    try {
      const { data, error } = await supabase
        .from("livro")
        .select("*")
        .order("titulo", { ascending: true });
      if (error) throw error;
      setDados(data || []);
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    carregarAcervo();
  }, []);

  const handleReservar = async () => {
    if (selectedRowIndex === null) {
      setMsg({ tipo: "erro", texto: "Selecione um livro na lista primeiro." });
      return;
    }

    const livroSelecionado = dados[selectedRowIndex];

    if (livroSelecionado.status !== "disponível") {
      setMsg({ tipo: "erro", texto: "Este livro não está disponível para reserva." });
      return;
    }

    setLoading(true);
    setMsg({ tipo: "", texto: "" });

    try {
      const { error } = await supabase
        .from("livro")
        .update({ status: "reservado" })
        .eq("isbn", livroSelecionado.isbn);

      if (error) throw error;

      setMsg({ tipo: "sucesso", texto: `Livro "${livroSelecionado.titulo}" reservado com sucesso!` });
      setSelectedRowIndex(null);
      await carregarAcervo();
    } catch (error) {
      setMsg({ tipo: "erro", texto: `Erro ao efetuar reserva: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white w-full">
      {/* Cabeçalho superior de controle do estudante */}
      <StudentHeader />

      {/* Área interna de conteúdo técnico */}
      <div className="flex-1 flex flex-col p-6 relative overflow-hidden">
        <header className="mb-4">
          <h1 className="text-2xl font-bold">Consulta de Acervo</h1>
          <p className="text-sm text-slate-400">Clique em qualquer local de uma linha para selecionar o livro desejado.</p>
        </header>

        {msg.texto && (
          <div className={`mb-4 p-3 border rounded-lg text-sm font-semibold ${
            msg.tipo === "erro" ? "bg-red-500/20 border-red-500 text-red-400" : "bg-green-500/20 border-green-500 text-green-400"
          }`}>
            {msg.tipo === "erro" ? "⚠️ " : "✓ "}{msg.texto}
          </div>
        )}

        <div className="flex-1 overflow-hidden mb-20">
          <GridGestao 
            data={dados}
            columns={COLUNAS_ACERVO}
            onCellChange={() => {}}
            isReadOnly={true}
            selectedRowIndex={selectedRowIndex}
            onRowSelect={setSelectedRowIndex}
          />
        </div>

        <div className="absolute bottom-6 left-6 z-30">
          <Botao corFundo="#16a34a" onClick={handleReservar} disabled={loading || selectedRowIndex === null}>
            {loading ? "Processando..." : "Reservar Livro"}
          </Botao>
        </div>
      </div>
    </div>
  );
}