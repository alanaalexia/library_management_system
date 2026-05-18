import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionCard } from '../../components/dashboard/ActionCard';
import { StatItem } from '../../components/dashboard/StatItem';
import { TopBar } from '../../components/dashboard/TopBar';
import { getDadosBibliotecarioHome } from '../../services/bibliotecarioService';

const LibrarianHome = ({ userProfile }) => {
  const [stats, setStats] = useState({
    pendingConfirmation: 0,
    overdue: 0,
    suspended: 0,
  });
  const [notificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        const dados = await getDadosBibliotecarioHome();
        setStats({
          pendingConfirmation: dados.pendingConfirmation,
          overdue: dados.overdue,
          suspended: dados.suspended,
        });
      } catch (error) {
        console.error('Erro ao carregar dados do bibliotecário:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

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

      {/* Barra superior com o sino de notificações e botão de logout */}
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

        {/* Botões de Ação Principais */}
        <div className="flex flex-col gap-3 items-center">
          <ActionCard title="Acervo" onClick={() => navigate('/acervo')} />
          <ActionCard title="Usuários" onClick={() => console.log('Ir para Usuários')} />
        </div>

        {/* Painel de Estatísticas Modulares */}
        <div className="bg-black/50 border border-white/10 rounded-md px-6 py-4 text-left min-w-[260px]">
          <StatItem
            count={stats.pendingConfirmation}
            label="Estudantes a serem confirmados."
            loading={loading}
          />
          <StatItem
            count={stats.overdue}
            label="Estudantes em atraso."
            loading={loading}
          />
          <StatItem
            count={stats.suspended}
            label="Estudantes suspensos."
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default LibrarianHome;
