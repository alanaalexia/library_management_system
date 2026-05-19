import React, { useState, useMemo } from "react";

export default function GridGestao({ 
  data, 
  columns, 
  onCellChange, 
  isReadOnly, 
  selectedRowIndex, 
  onRowSelect 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const handleSort = (column) => {
    let direction = "asc";
    let key = column;

    if (sortConfig.key === column) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
        key = null; // Reseta completamente o estado ao terceiro clique
      }
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let dataWithIndex = data.map((row, index) => ({ ...row, _originalIndex: index }));

    const hasEmptyLastRow = data.length > 0 && columns.every(col => {
      const val = data[data.length - 1][col];
      return !val || val.toString().trim() === "";
    });

    let emptyLastRow = null;
    
    if (hasEmptyLastRow && !isReadOnly) {
      emptyLastRow = dataWithIndex.pop();
    }

    if (searchTerm.trim() !== "") {
      const lowSearch = searchTerm.toLowerCase();
      dataWithIndex = dataWithIndex.filter((row) =>
        columns.some((col) => {
          const val = row[col];
          return val && val.toString().toLowerCase().includes(lowSearch);
        })
      );
    }

    if (sortConfig.key && sortConfig.direction) {
      dataWithIndex.sort((a, b) => {
        const valA = a[sortConfig.key] ? a[sortConfig.key].toString().toLowerCase() : "";
        const valB = b[sortConfig.key] ? b[sortConfig.key].toString().toLowerCase() : "";

        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    if (emptyLastRow && !isReadOnly) {
      dataWithIndex.push(emptyLastRow);
    }

    if (isReadOnly && hasEmptyLastRow) {
      dataWithIndex = dataWithIndex.filter(row => {
        const isRowEmpty = columns.every(col => !row[col] || row[col].toString().trim() === "");
        return !isRowEmpty;
      });
    }

    return dataWithIndex;
  }, [data, columns, searchTerm, sortConfig, isReadOnly]);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Barra de Pesquisa */}
      <div className="w-full">
        <input
          type="text"
          placeholder="Pesquisar nesta tabela..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 text-sm bg-slate-900/50 text-white placeholder-slate-400 border border-white/10 rounded-lg outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Container da Tabela */}
      <div className="flex-1 overflow-y-auto border border-white/10 rounded-lg bg-slate-900/30 shadow-inner">
        <table className="w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-20 bg-blue-700">
            <tr className="text-xs text-center uppercase tracking-wider font-sans select-none">
              <th className="p-3 border-r border-blue-800 text-white font-semibold w-12 text-center"></th>
              {columns.map((col) => {
                const isSorted = sortConfig.key === col && sortConfig.direction !== null;
                return (
                  <th 
                    key={col} 
                    onClick={() => handleSort(col)}
                    className="p-3 border-r border-blue-800 text-white font-semibold text-center cursor-pointer hover:bg-blue-800 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{col}</span>
                      <span className="text-[11px] text-blue-300 font-mono tracking-tighter">
                        {isSorted && sortConfig.direction === "asc" && "▲"}
                        {isSorted && sortConfig.direction === "desc" && "▼"}
                        {!isSorted && "↑↓"}
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {processedData.map((row, rowIndex) => {
              const originalIndex = row._originalIndex;
              const isSelected = selectedRowIndex === originalIndex;
              
              const isLastRowInOriginal = originalIndex === data.length - 1;
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
                      onRowSelect(originalIndex);
                    }
                  }}
                >
                  <td 
                    className="p-0 border-r border-white/5 text-center align-middle"
                    onClick={(e) => {
                      if (!isReadOnly) {
                        e.stopPropagation();
                      }
                      if (onRowSelect) onRowSelect(originalIndex);
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
                        onChange={(e) => onCellChange(originalIndex, col, e.target.value)}
                        className={`w-full h-full bg-transparent px-3 outline-none text-sm text-center
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
    </div>
  );
}