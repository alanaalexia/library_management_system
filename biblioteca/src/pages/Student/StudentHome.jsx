import { ActionCard } from '../../components/dashboard/ActionCard';
import { AlertItem } from '../../components/dashboard/AlertItem';

/**
 * TODO: substituir `overdueBooks` e `alerts` por dados reais da API.
 * Estrutura esperada futuramente:
 *
 * overdueBooks: number        — total de livros em atraso do aluno
 * alerts: Array<{
 *   bookTitle: string,
 *   daysLeft: number          — negativo = atrasado
 * }>
 */
const MOCK_OVERDUE_BOOKS = 1;
const MOCK_ALERTS = [
  { bookTitle: 'Bíblia', daysLeft: -1 },
];

const StudentHome = ({ userProfile }) => {
  const overdueBooks = MOCK_OVERDUE_BOOKS;
  const alerts = MOCK_ALERTS;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{
        backgroundImage: `url('/bookshelf-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Top-right icons */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button className="text-white/80 hover:text-white text-xl">👥</button>
        <button className="text-white/80 hover:text-white text-xl">👤</button>
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-4">
        {/* Welcome */}
        <div>
          <p className="text-white text-xl font-normal">
            Seja bem vindo(a) ao Bibliotheca+,
          </p>
          <p className="text-white text-xl">
            aluno(a) <span className="font-bold">{userProfile?.nome || 'Estudante'}</span>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 items-center">
          <ActionCard title="Acervo" onClick={() => console.log('Ir para Acervo')} />
          <ActionCard title="Empréstimos" onClick={() => console.log('Ir para Empréstimos')} />
        </div>

        {/* Alerts */}
        <div className="bg-black/50 border border-white/10 rounded-md px-6 py-4 text-left min-w-[260px]">
          <div className="flex items-center gap-2 py-1 text-sm mb-1">
            <span className="font-semibold text-red-400">{overdueBooks}</span>
            <span className="text-white/90">Livro(s) em atraso.</span>
          </div>
          {alerts.map((alert, index) => (
            <AlertItem
              key={index}
              daysLeft={alert.daysLeft}
              bookTitle={alert.bookTitle}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentHome;
