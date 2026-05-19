import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionCard } from '../../components/dashboard/ActionCard';
import { AlertItem } from '../../components/dashboard/AlertItem';
import StudentHeader from './StudentHeader';
import { getDadosAlunoHome } from '../../services/emprestimoService';
import { supabase } from '../../services/supabaseClient';

const StudentHome = ({ userProfile }) => {
  const navigate = useNavigate();
  const [overdueBooks, setOverdueBooks] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [booksInPossession, setBooksInPossession] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error('Usuário não autenticado');
          return;
        }

        const { data: cliente } = await supabase
          .from('cliente')
          .select('id_cliente')
          .eq('id_pessoa', user.id)
          .maybeSingle();

        if (!cliente) {
          console.error('Cliente não encontrado');
          return;
        }

        const dados = await getDadosAlunoHome(cliente.id_cliente);
        setOverdueBooks(dados.overdueBooks);
        setAlerts(dados.alerts);
        setBooksInPossession(dados.booksInPossession);
      } catch (error) {
        console.error('Erro ao carregar dados do aluno:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
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
      <div className="absolute inset-0 bg-black/60" />

      {/* Cabeçalho do estudante parametrizado com navegação e logout */}
      <StudentHeader />

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-6 text-center px-4 py-8">
        <div>
          <p className="text-white text-xl font-normal">
            Seja bem vindo(a) ao Bibliotheca+,
          </p>
          <p className="text-white text-xl">
            aluno(a) <span className="font-bold">{userProfile?.nome || 'Estudante'}</span>.
          </p>
        </div>

        <div className="flex flex-col gap-3 items-center">
          <ActionCard title="Acervo" onClick={() => navigate('/acervo')} />
          <ActionCard title="Empréstimos" onClick={() => navigate('/meus-livros')} />
        </div>

        <div className="bg-black/50 border border-white/10 rounded-md px-6 py-4 text-left min-w-[260px]">
          <div className="flex items-center gap-2 py-1 text-sm mb-1">
            <span className="font-semibold text-red-400">
              {loading ? '—' : overdueBooks}
            </span>
            <span className="text-white/90">Livro(s) em atraso.</span>
          </div>
          <div className="flex items-center gap-2 py-1 text-sm mb-2">
            <span className="font-semibold text-blue-400">
              {loading ? '—' : booksInPossession}
            </span>
            <span className="text-white/90">Livro(s) em posse.</span>
          </div>
          {alerts.length === 0 && !loading ? (
            <p className="text-white/70 text-sm py-2">Nenhum aviso de devolução.</p>
          ) : (
            alerts.map((alert, index) => (
              <AlertItem
                key={index}
                daysLeft={alert.daysLeft}
                bookTitle={alert.bookTitle}
                loading={loading}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentHome;