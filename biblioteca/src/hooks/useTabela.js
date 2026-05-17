// src/hooks/useTabela.js
import { useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";

export function useTabela(nomeTabela, colunas) {
  const [dados, setDados] = useState([]);

  const carregarDados = async () => {
    const { data, error } = await supabase.from(nomeTabela).select("*");
    if (error) {
      console.error(`Erro ao carregar ${nomeTabela}:`, error.message);
      return;
    }
    
    // Gera 1 linha vazia baseada no array de colunas enviado
    const vazias = Array(1).fill(
      colunas.reduce((acc, col) => ({ ...acc, [col]: "" }), {})
    );
    
    setDados([...(data || []), ...vazias]);
  };

  useEffect(() => {
    carregarDados();
  }, [nomeTabela]);

  return { dados, setDados, carregarDados };
}