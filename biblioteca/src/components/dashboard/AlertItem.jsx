/**
 * AlertItem — exibe um aviso de prazo para o aluno.
 * Usado em StudentHome para alertas de devolução de livros.
 *
 * Props:
 *  - daysLeft (number): dias restantes (negativo = atrasado)
 *  - bookTitle (string): título do livro
 *  - loading (bool): exibe placeholder enquanto dados carregam
 */
export const AlertItem = ({ daysLeft, bookTitle, loading = false }) => {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-1 text-sm">
        <span className="font-semibold text-red-400">—</span>
        <span className="text-white/90">Carregando avisos...</span>
      </div>
    );
  }

  const daysAdjusted = daysLeft + 1; // compensa desvio de fuso
  const isOverdue = daysAdjusted < 0;
  const dias = Math.abs(daysAdjusted);
  const diaLabel = dias === 1 ? 'dia' : 'dias';

  const label = isOverdue
    ? `de atraso em "${bookTitle}".`
    : daysAdjusted === 0
    ? `"${bookTitle}" deve ser devolvido hoje!`
    : `${diaLabel} restante${dias === 1 ? '' : 's'} para devolver "${bookTitle}".`;

  const color = isOverdue || daysAdjusted === 0 ? 'text-red-400' : 'text-yellow-400';
  const numero = isOverdue ? `+${dias}` : daysAdjusted === 0 ? '!' : dias;

  return (
    <div className="flex items-start gap-2 py-1 text-sm">
      <span className={`font-semibold ${color} shrink-0`}>
        {numero}
      </span>
      <span className="text-white/90">{label}</span>
    </div>
  );
};