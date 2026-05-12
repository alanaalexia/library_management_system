import React from "react";

export default function GridGestao({ data, columns, onCellChange, isReadOnly }) {
  return (
    <div className="flex-1 overflow-y-auto border border-white/10 rounded-lg bg-slate-900/30 shadow-inner">
      <table className="w-full border-separate border-spacing-0">
        <thead className="sticky top-0 z-20 bg-blue-700">
          <tr className="text-xs text-left uppercase tracking-wider">
            {columns.map((col) => (
              <th key={col} className="p-3 border-r border-blue-800 text-white font-bold">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-white/5 h-10">
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
          ))}
        </tbody>
      </table>
    </div>
  );
}