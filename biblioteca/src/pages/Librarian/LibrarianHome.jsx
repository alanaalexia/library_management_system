import { ActionCard } from '../../components/dashboard/ActionCard';
import { StatItem } from '../../components/dashboard/StatItem';

/**
 * TODO: substituir `stats` por dados reais da API.
 * Estrutura esperada futuramente:
 *
 * stats: {
 *   pendingConfirmation: number,   — alunos aguardando aprovação de cadastro
 *   overdue: number,               — alunos com livros em atraso
 *   suspended: number,             — alunos suspensos
 * }
 */
const MOCK_STATS = {
  pendingConfirmation: 0,
  overdue: 0,
  suspended: 0,
};

const LibrarianHome = ({ userProfile }) => {
  const stats = MOCK_STATS;

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
            bibliotecário(a) <span className="font-bold">{userProfile?.nome || 'Usuário'}</span>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 items-center">
          <ActionCard title="Acervo" onClick={() => console.log('Ir para Acervo')} />
          <ActionCard title="Usuários" onClick={() => console.log('Ir para Usuários')} />
        </div>

        {/* Stats */}
        <div className="bg-black/50 border border-white/10 rounded-md px-6 py-4 text-left min-w-[260px]">
          <StatItem count={stats.pendingConfirmation} label="Estudantes a serem confirmados." />
          <StatItem count={stats.overdue} label="Estudantes em atraso." />
          <StatItem count={stats.suspended} label="Estudantes suspensos." />
        </div>
      </div>
    </div>
  );
};

export default LibrarianHome;
