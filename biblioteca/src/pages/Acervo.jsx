import { useState } from "react";
import GridGestao from "../components/GridGestao";
import { Botao } from "../components/Botoes";
import { useTabela } from "../hooks/useTabela";

const COLUNAS_ACERVO = ["isbn", "titulo", "autor", "editora", "idioma", "status"];

export default function PaginaAcervo() {
  const { dados, handleCellChange, salvarAlteracoes, apagarRegistros } = useTabela("livro", COLUNAS_ACERVO);
  const isBibliotecario = true; // Placeholder para lógica de auth (ex: useAuth)

  // Estado para controlar se a tabela está editável
  const [modoEdicao, setModoEdicao] = useState(false);
  const [livroSelecionado, setLivroSelecionado] = useState(null);

  // Ações
  const handleAtualizar = () => {
    salvarAlteracoes(); // Assume que useTabela provê esta função
    setModoEdicao(false);
  };

  const handleReservar = () => {
    if (livroSelecionado) console.log("Reservando", livroSelecionado);
  };

  return (
    <div className="h-screen flex flex-col p-6 bg-slate-950 relative">
      <GridGestao 
        data={dados} 
        columns={COLUNAS_ACERVO} 
        onCellChange={handleCellChange}
        isReadOnly={!isBibliotecario || !modoEdicao} // Modo edição necessário p/ bibliotecário alterar
        onRowSelect={setLivroSelecionado} // Prop fictícia: assume que GridGestao avisa qual linha foi clicada
      />

      {/* Container de Botões - Posicionamento Baseado no Figma (Canto Inferior Esquerdo) */}
      <div className="absolute bottom-6 left-6 flex gap-4">
        {isBibliotecario ? (
          <>
            <Botao corFundo="#007bff" onClick={() => setModoEdicao(!modoEdicao)}>
              {modoEdicao ? 'Cancelar Edição' : 'Editar'}
            </Botao>
            
            {modoEdicao && (
               <Botao corFundo="#ffc107" corTexto="#000" onClick={handleAtualizar}>
                 Atualizar
               </Botao>
            )}

            <Botao corFundo="#dc3545" onClick={apagarRegistros}>
              Apagar
            </Botao>
          </>
        ) : (
          <Botao corFundo="#007bff" onClick={handleReservar} disabled={!livroSelecionado}>
            Reservar
          </Botao>
        )}
      </div>
    </div>
  );
}