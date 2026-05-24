import React, { useState, useMemo } from "react";

/**
 * BaseTable
 *
 * Props existentes (mantidas):
 *  - data, columns, onCellChange, isReadOnly, selectedRowIndex, onRowSelect
 *  - comboboxConfig, columnLabels, allowNewRow
 *
 * Props novas:
 *  - extraColumns: array de configurações de colunas extras com botões
 *    [
 *      {
 *        label: "Emprestar",           // nome do cabeçalho
 *        position: "right",            // "right" ou índice numérico (futuro)
 *        buttonLabel: "Emprestar",     // texto do botão
 *        buttonColor: "#2563eb",       // cor do botão (hex ou tailwind bg)
 *        showWhen: { key, value },     // ex: { key: "status", value: "Reservado" }
 *        onClick: (row) => {},         // callback com a linha clicada
 *      }
 *    ]
 */
export default function BaseTable({
  data,
  columns,
  onCellChange,
  isReadOnly,
  selectedRowIndex,
  onRowSelect,
  comboboxConfig = {},
  columnLabels = {},
  allowNewRow = true,
  extraColumns = [],
  readOnlyColumns = [], // colunas sempre somente leitura
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });

  const getOptions = (col) => comboboxConfig[col]?.options || null;
  const getDefault = (col) => comboboxConfig[col]?.default ?? "";

  const handleSort = (column) => {
    let direction = "asc";
    let key = column;
    if (sortConfig.key === column) {
      if (sortConfig.direction === "asc") direction = "desc";
      else if (sortConfig.direction === "desc") { direction = null; key = null; }
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let dataWithIndex = data.map((row, index) => ({ ...row, _originalIndex: index }));

    const hasEmptyLastRow = data.length > 0 && columns.every(col => {
      const val = data[data.length - 1][col];
      const def = getDefault(col);
      return !val || val.toString().trim() === "" || val === def;
    });

    let emptyLastRow = null;
    if (hasEmptyLastRow) {
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

    if (emptyLastRow && !isReadOnly && allowNewRow) {
      dataWithIndex.push(emptyLastRow);
    }

    return dataWithIndex;
  }, [data, columns, searchTerm, sortConfig, isReadOnly, comboboxConfig, allowNewRow]);

  const renderCell = (col, row, originalIndex) => {
    const options = getOptions(col);
    const isLocked = col.includes("id_") || col.includes("_em");
    const isReadOnlyCol = readOnlyColumns.includes(col);
    const value = row[col] ?? getDefault(col);
    const isLastRow = originalIndex === data.length - 1;

    const outrasColunas = columns.filter(c => c !== col && !getOptions(c));
    const temConteudo = outrasColunas.some(c => row[c] && row[c].toString().trim() !== "");
    const mostrarCombobox = !isLastRow || temConteudo || selectedRowIndex === originalIndex;

    if (options && !isReadOnly && !isLocked && !isReadOnlyCol && mostrarCombobox) {
      return (
        <select
          value={value}
          onChange={(e) => onCellChange(originalIndex, col, e.target.value)}
          className="w-full h-full bg-transparent px-3 outline-none text-sm text-center text-white focus:bg-blue-900/30 cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-slate-800 text-white">{opt}</option>
          ))}
        </select>
      );
    }

    // Para células sem combobox na linha nova: esconde se vazio e não selecionado

    return (
      <input
        readOnly={isReadOnly || isLocked || isReadOnlyCol}
        value={options && !mostrarCombobox ? "" : value}
        onChange={(e) => onCellChange(originalIndex, col, e.target.value)}
        className={`w-full h-full bg-transparent px-3 outline-none text-sm text-center
          ${isReadOnly ? "cursor-default" : "focus:bg-blue-900/30"}
          ${isLocked ? "text-slate-500 bg-slate-800/20" : ""}
          ${isReadOnlyCol ? "text-white cursor-default" : ""}
        `}
      />
    );
  };

  // Verifica se o botão de uma extraColumn deve aparecer para uma linha
  const shouldShowButton = (extraCol, row) => {
    if (!extraCol.showWhen) return true;
    const { key, value } = extraCol.showWhen;
    // value pode ser string ou array de strings
    return Array.isArray(value) ? value.includes(row[key]) : row[key] === value;
  };

  return (
    <div className="flex flex-col h-full gap-4" onClick={() => onRowSelect && onRowSelect(null)}>
      <div className="w-full flex justify-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="text"
          placeholder="Pesquisar nesta tabela..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md px-4 py-2 text-sm bg-slate-900/50 text-white placeholder-slate-400 border border-white/10 rounded-lg outline-none focus:border-blue-500 transition-colors"
        />
      </div>

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
                      <span>{columnLabels[col] || col}</span>
                      <span className="text-[11px] text-blue-300 font-mono tracking-tighter">
                        {isSorted && sortConfig.direction === "asc" && "▲"}
                        {isSorted && sortConfig.direction === "desc" && "▼"}
                        {!isSorted && "↑↓"}
                      </span>
                    </div>
                  </th>
                );
              })}

              {/* Cabeçalhos das colunas extras */}
              {extraColumns.map((extraCol, i) => (
                <th
                  key={`extra-header-${i}`}
                  className="p-3 border-r border-blue-800 text-white font-semibold text-center"
                >
                  {extraCol.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {processedData.map((row, rowIndex) => {
              const originalIndex = row._originalIndex;
              const isSelected = selectedRowIndex === originalIndex;
              const isLastRowInOriginal = originalIndex === data.length - 1;
              const isRowEmpty = columns.every(col => {
                const val = row[col];
                const def = getDefault(col);
                return !val || val.toString().trim() === "" || val === def;
              });
              const showIcon = !(isLastRowInOriginal && isRowEmpty && !isSelected);

              return (
                <tr
                  key={rowIndex}
                  className={`h-10 transition-colors cursor-pointer ${
                    isSelected ? "bg-blue-600/30 ring-2 ring-blue-500 ring-inset" : "hover:bg-white/5"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isReadOnly && onRowSelect) onRowSelect(originalIndex);
                  }}
                >
                  <td
                    className="p-0 border-r border-white/5 text-center align-middle"
                    onClick={(e) => {
                      if (!isReadOnly) e.stopPropagation();
                      if (onRowSelect) onRowSelect(originalIndex);
                    }}
                  >
                    {showIcon && (
                      <div className="flex flex-col gap-[4px] justify-center items-center">
                        {[...Array(3)].map((_, i) => (
                          <span key={i} className="w-[3px] h-[3px] rounded-full bg-slate-400 block"></span>
                        ))}
                      </div>
                    )}
                  </td>

                  {columns.map((col) => (
                    <td key={col} className="p-0 border-r border-white/5">
                      {renderCell(col, row, originalIndex)}
                    </td>
                  ))}

                  {/* Células das colunas extras */}
                  {extraColumns.map((extraCol, i) => (
                    <td
                      key={`extra-cell-${i}`}
                      className="p-0 border-r border-white/5 text-center align-middle"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {shouldShowButton(extraCol, row) && showIcon && (
                        <button
                          style={{ backgroundColor: extraCol.buttonColor || "#2563eb" }}
                          onClick={() => extraCol.onClick(row)}
                          className="mx-auto my-1 px-3 py-1 rounded text-white text-xs font-semibold hover:opacity-80 active:opacity-60 transition-opacity"
                        >
                          {extraCol.buttonLabel}
                        </button>
                      )}
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