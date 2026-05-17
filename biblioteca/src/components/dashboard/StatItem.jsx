/**
 * StatItem — exibe uma contagem com rótulo.
 * Usado em LibrarianHome para totais de estudantes
 * (a confirmar, em atraso, suspensos).
 *
 * Props:
 *  - count (number): valor vindo da API (0 enquanto não implementado)
 *  - label (string): descrição da contagem
 *  - loading (bool): exibe placeholder enquanto dados carregam
 */
export const StatItem = ({ count, label, loading = false }) => {
  const hasAlert = count > 0;

  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      <span className={`font-semibold ${hasAlert ? 'text-red-400' : 'text-white'}`}>
        {loading ? '—' : count}
      </span>
      <span className="text-white/90">{label}</span>
    </div>
  );
};
