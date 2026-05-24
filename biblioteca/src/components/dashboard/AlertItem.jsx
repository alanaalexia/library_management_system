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

  const isOverdue = daysLeft < 0;
  const dias = Math.abs(daysLeft);
  const diaLabel = dias === 1 ? 'dia' : 'dias';

  const label = isOverdue
    ? `${dias} ${diaLabel} de atraso em "${bookTitle}".`
    : daysLeft === 0
    ? `"${bookTitle}" deve ser devolvido hoje!`
    : `${dias} ${diaLabel} restante${dias === 1 ? '' : 's'} para devolver "${bookTitle}".`;

  const color = isOverdue || daysLeft === 0 ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="flex items-start gap-2 py-1 text-sm">
      <span className={`font-semibold ${color} shrink-0`}>
        {isOverdue ? `+${dias}` : daysLeft === 0 ? '!' : dias}
      </span>
      <span className="text-white/90">{label}</span>
    </div>
  );
};