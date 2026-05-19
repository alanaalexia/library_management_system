import React from "react";

export default function GridGestao({ 
  data, 
  columns, 
  onCellChange, 
  isReadOnly, 
  selectedRowIndex, 
  onRowSelect 
}) {
  // Filtra as linhas para remover a última se ela estiver vazia E o grid for apenas leitura
  const visibleData = data.filter((row, rowIndex) => {
    const isLastRow = rowIndex === data.length - 1;
    const isRowEmpty = columns.every(col => !row[col] || row[col].toString().trim() === "");
    
    if (isReadOnly && isLastRow && isRowEmpty) {
      return false; // Oculta a linha no modo de leitura
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto border border-white/10 rounded-lg bg-slate-900/30 shadow-inner">
      <table className="w-full border-separate border-spacing-0">
        <thead className="sticky top-0 z-20 bg-blue-700">
          <tr className="text-xs text-center uppercase tracking-wider font-sans">
            {/* Coluna sem título para seleção */}
            <th className="p-3 border-r border-blue-800 text-white font-semibold w-12 text-center"></th>
            {columns.map((col) => (
              <th key={col} className="p-3 border-r border-blue-800 text-white font-semibold text-center">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {visibleData.map((row, rowIndex) => {
            const isSelected = selectedRowIndex === rowIndex;
            // A verificação do ícone agora é baseada no array original 'data' para manter a correspondência com o estado
            const isLastRowInOriginal = rowIndex === data.length - 1;
            const isRowEmpty = columns.every(col => !row[col] || row[col].toString().trim() === "");
            const showIcon = !(isLastRowInOriginal && isRowEmpty && !isSelected);

            return (
              <tr 
                key={rowIndex} 
                className={`h-10 transition-colors cursor-pointer ${
                  isSelected ? "bg-blue-600/30 ring-2 ring-blue-500 ring-inset" : "hover:bg-white/5"
                }`}
                onClick={() => {
                  if (isReadOnly && onRowSelect) {
                    onRowSelect(rowIndex);
                  }
                }}
              >
                {/* Célula com o ícone condicional de 3 linhas paralelas horizontais */}
                <td 
                  className="p-0 border-r border-white/5 text-center align-middle"
                  onClick={(e) => {
                    if (!isReadOnly) {
                      e.stopPropagation();
                    }
                    if (onRowSelect) onRowSelect(rowIndex);
                  }}
                >
                  {showIcon && (
                    <div className="flex flex-col gap-0.5 justify-center items-center h-full w-full py-2">
                      <span className="w-4 h-0.5 bg-slate-400 block"></span>
                      <span className="w-4 h-0.5 bg-slate-400 block"></span>
                      <span className="w-4 h-0.5 bg-slate-400 block"></span>
                    </div>
                  )}
                </td>
                
                {columns.map((col) => (
                  <td key={col} className="p-0 border-r border-white/5">
                    <input
                      readOnly={isReadOnly || col.includes("id_") || col.includes("_em")}
                      value={row[col] || ""}
                      onChange={(e) => onCellChange(rowIndex, col, e.target.value)}
                      className={`w-full h-full bg-transparent px-3 outline-none text-sm
                        ${isReadOnly ? "cursor-default" : "focus:bg-blue-900/30"}
                        ${(col.includes("id_") || col.includes("_em")) ? "text-slate-500 bg-slate-800/20" : ""}
                      `}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}