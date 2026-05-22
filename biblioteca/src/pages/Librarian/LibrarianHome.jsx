import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionCard } from '../../components/dashboard/ActionCard';
import LibrarianHeader from './LibrarianHeader';
import { supabase } from '../../services/supabaseClient';

const LibrarianHome = ({ userProfile }) => {
  const navigate = useNavigate();
  const [pendingStudents, setPendingStudents] = useState(0);
  const [overdueLoans, setOverdueLoans] = useState(0);
  const [suspendedStudents, setSuspendedStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDadosPainel = async () => {
      try {
        setLoading(true);

        // Contagem de novos estudantes Pendentes de confirmação
        const { count: pendingCount, error: errorPending } = await supabase
          .from('pessoa')
          .select('*', { count: 'exact', head: true })
          .eq('papel', 'cliente')
          .eq('status', 'Pendente');

        // Contagem de estudantes suspensos
        const { count: suspendedCount, error: errorSuspended } = await supabase
          .from('pessoa')
          .select('*', { count: 'exact', head: true })
          .eq('papel', 'cliente')
          .eq('status', 'suspenso');

        // Contagem de devoluções em atraso mapeadas no acervo
        const { count: overdueCount, error: errorOverdue } = await supabase
          .from('livro')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'atrasado');

        if (!errorPending) setPendingStudents(pendingCount || 0);
        if (!errorSuspended) setSuspendedStudents(suspendedCount || 0);
        if (!errorOverdue) setOverdueLoans(overdueCount || 0);

      } catch (error) {
        console.error('Erro ao carregar métricas do painel:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosPainel();
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col relative w-full"
      style={{
        backgroundImage: `url('/bookshelf-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Camada de sobreposição escura */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Cabeçalho do bibliotecário parametrizado com navegação e logout */}
      <LibrarianHeader />

      {/* Conteúdo Central */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 text-center px-4 py-8">
        <div>
          <p className="text-white text-xl font-normal">
            Seja bem vindo(a) ao Bibliotheca+,
          </p>
          <p className="text-white text-xl">
            bibliotecário(a) <span className="font-bold">{userProfile?.nome || 'Administrador'}</span>.
          </p>
        </div>

        {/* Cartões de ação rápida */}
        <div className="flex flex-col gap-3 items-center">
          <ActionCard title="Acervo" onClick={() => navigate('/acervo')} />
          <ActionCard title="Usuários" onClick={() => navigate('/usuarios')} />
        </div>

        {/* Painel modular de estatísticas agregadas */}
        <div className="bg-black/50 border border-white/10 rounded-md px-6 py-4 text-left min-w-[280px]">
          <div className="flex items-center gap-2 py-1 text-sm mb-1">
            <span className="font-semibold text-yellow-400">
              {loading ? '—' : pendingStudents}
            </span>
            <span className="text-white/90">Estudante(s) Pendente(s) de confirmação.</span>
          </div>
          
          <div className="flex items-center gap-2 py-1 text-sm mb-1">
            <span className="font-semibold text-red-400">
              {loading ? '—' : overdueLoans}
            </span>
            <span className="text-white/90">Estudante(s) com devoluções em atraso.</span>
          </div>

          <div className="flex items-center gap-2 py-1 text-sm">
            <span className="font-semibold text-slate-400">
              {loading ? '—' : suspendedStudents}
            </span>
            <span className="text-white/90">Estudante(s) suspenso(s).</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibrarianHome;