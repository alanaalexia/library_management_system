/**
 * AlertItem — exibe um aviso de prazo para o aluno.
 * Usado em StudentHome para alertas de devolução de livros.
 *
 * Props:
 *  - daysLeft (number): dias restantes (negativo = atrasado)
 *  - bookTitle (string): título do livro
 *  - loading (bool): exibe placeholder enquanto dados carregam
 *
 * TODO: alimentar com dados reais da API de empréstimos do aluno.
 */
export const AlertItem = ({ daysLeft, bookTitle, loading = false }) => {
  const isOverdue = daysLeft < 0;
  const label = isOverdue
    ? `${daysLeft} Dia(s) para a entrega de ${bookTitle}.`
    : `${daysLeft} Dia(s) restantes para entregar ${bookTitle}.`;

  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      <span className="font-semibold text-red-400">
        {loading ? '—' : daysLeft}
      </span>
      <span className="text-white/90">
        {loading ? 'Carregando avisos...' : `Dia(s) para a entrega de ${bookTitle}.`}
      </span>
    </div>
  );
};
