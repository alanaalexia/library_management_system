import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionCard } from '../../components/dashboard/ActionCard';
import LibrarianHeader from './LibrarianHeader';
import { supabase } from '../../services/supabaseClient';

const LibrarianHome = ({ userProfile }) => {
  const navigate = useNavigate();
  const [pendingStudents, setPendingStudents] = useState(0);
  const [overdueLoans, setOverdueLoans] = useState(0);
  const [restrictedStudents, setRestrictedStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDadosPainel = async () => {
      try {
        setLoading(true);

        // Contagem de estudantes Pendentes de confirmação
        const { count: pendingCount, error: errorPending } = await supabase
          .from('pessoa')
          .select('*', { count: 'exact', head: true })
          .eq('papel', 'cliente')
          .eq('status', 'Pendente');

        // Contagem de estudantes com empréstimos atrasados
        const { data: atrasados, error: errorOverdue } = await supabase
          .from('emprestimo')
          .select('id_cliente')
          .eq('status', 'atrasado');

        // Contagem de estudantes suspensos OU banidos
        const { count: restrictedCount, error: errorRestricted } = await supabase
          .from('pessoa')
          .select('*', { count: 'exact', head: true })
          .eq('papel', 'cliente')
          .in('status', ['Suspenso', 'Banido']);

        if (!errorPending) setPendingStudents(pendingCount || 0);
        if (!errorOverdue) {
          const unicos = new Set((atrasados || []).map(e => e.id_cliente));
          setOverdueLoans(unicos.size);
        }
        if (!errorRestricted) setRestrictedStudents(restrictedCount || 0);

      } catch (error) {
        console.error('Erro ao carregar métricas do painel:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDadosPainel();
  }, []);

  const plural = (n, singular, plural) => n === 1 ? singular : plural;

  return (
    <div
      className="min-h-screen flex flex-col relative w-full"
      style={{
        backgroundImage: `url('/bookshelf-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <LibrarianHeader />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 text-center px-4 py-8">
        <div>
          <p className="text-white text-xl font-normal">
            Seja bem vindo(a) ao Bibliotheca+,
          </p>
          <p className="text-white text-xl">
            bibliotecário(a) <span className="font-bold">{userProfile?.nome || 'Administrador'}</span>.
          </p>
        </div>

        <div className="flex flex-col gap-3 items-center">
          <ActionCard title="Acervo" onClick={() => navigate('/acervo')} />
          <ActionCard title="Usuários" onClick={() => navigate('/usuarios')} />
        </div>

        <div className="bg-black/50 border border-white/10 rounded-md px-6 py-4 text-left min-w-[280px]">
          <div className="flex items-center gap-2 py-1 text-sm mb-1">
            <span className="font-semibold text-yellow-400">
              {loading ? '—' : pendingStudents}
            </span>
            <span className="text-white/90">
              {loading ? '—' : plural(pendingStudents,
                'Estudante pendente de confirmação.',
                'Estudantes pendentes de confirmação.'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 py-1 text-sm mb-1">
            <span className="font-semibold text-red-400">
              {loading ? '—' : overdueLoans}
            </span>
            <span className="text-white/90">
              {loading ? '—' : plural(overdueLoans,
                'Estudante com devolução em atraso.',
                'Estudantes com devoluções em atraso.'
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 py-1 text-sm">
            <span className="font-semibold text-slate-400">
              {loading ? '—' : restrictedStudents}
            </span>
            <span className="text-white/90">
              {loading ? '—' : plural(restrictedStudents,
                'Estudante suspenso ou banido.',
                'Estudantes suspensos ou banidos.'
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibrarianHome;
