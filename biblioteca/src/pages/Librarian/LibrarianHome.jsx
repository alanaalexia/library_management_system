import { ActionCard } from '../../components/dashboard/ActionCard';
import { StatItem } from '../../components/dashboard/StatItem';
import { TopBar } from '../../components/dashboard/TopBar';

/**
 * TODO: substituir `stats` e `notificationCount` por dados reais da API.
 * Estrutura esperada futuramente:
 *
 * stats: {
 *   pendingConfirmation: number,   — alunos aguardando aprovação de cadastro
 *   overdue: number,               — alunos com livros em atraso
 *   suspended: number,             — alunos suspensos
 * }
 * notificationCount: number        — notificações não visualizadas
 */
const MOCK_STATS = {
  pendingConfirmation: 0,
  overdue: 0,
  suspended: 0,
};
const MOCK_NOTIFICATION_COUNT = 0;

const LibrarianHome = ({ userProfile }) => {
  const stats = MOCK_STATS;
  const notificationCount = MOCK_NOTIFICATION_COUNT;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative"
      style={{
        backgroundImage: `url('/bookshelf-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/60" />

      {/* Com sino de notificações */}
      <TopBar showNotifications notificationCount={notificationCount} />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-4">
        <div>
          <p className="text-white text-xl font-normal">
            Seja bem vindo(a) ao Bibliotheca+,
          </p>
          <p className="text-white text-xl">
            bibliotecário(a) <span className="font-bold">{userProfile?.nome || 'Usuário'}</span>.
          </p>
        </div>

        <div className="flex flex-col gap-3 items-center">
          <ActionCard title="Acervo" onClick={() => console.log('Ir para Acervo')} />
          <ActionCard title="Usuários" onClick={() => console.log('Ir para Usuários')} />
        </div>

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
