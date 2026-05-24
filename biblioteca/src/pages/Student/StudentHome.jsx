import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionCard } from '../../components/dashboard/ActionCard';
import { AlertItem } from '../../components/dashboard/AlertItem';
import StudentHeader from './StudentHeader';
import { supabase } from '../../services/supabaseClient';

const StudentHome = ({ userProfile }) => {
  const navigate = useNavigate();
  const [loading, setLoading]         = useState(true);
  const [atrasados, setAtrasados]     = useState(0);
  const [emprestados, setEmprestados] = useState(0);
  const [reservados, setReservados]   = useState(0);
  const [alerts, setAlerts]           = useState([]);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: cliente } = await supabase
          .from('cliente')
          .select('id_cliente')
          .eq('id_pessoa', user.id)
          .maybeSingle();

        if (!cliente) return;

        const clienteId = cliente.id_cliente;

        await supabase.rpc('marcar_emprestimos_atrasados');

        const { data: emprestimos } = await supabase
          .from('emprestimo')
          .select('id_emprestimo, status, prazo_devolucao, livro(titulo)')
          .eq('id_cliente', clienteId)
          .in('status', ['ativo', 'atrasado']);

        const { data: reservas } = await supabase
          .from('reserva')
          .select('id_reserva, prazo_validade, livro(titulo)')
          .eq('id_cliente', clienteId)
          .eq('status', 'ativa');

        const listaEmprestimos = emprestimos || [];
        const listaReservas    = reservas    || [];

        setAtrasados(listaEmprestimos.filter(e => e.status === 'atrasado').length);
        setEmprestados(listaEmprestimos.filter(e => e.status === 'ativo').length);
        setReservados(listaReservas.length);

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const alertasList = listaEmprestimos
          .filter(e => e.status === 'ativo')
          .map(e => {
            const prazo = new Date(e.prazo_devolucao);
            prazo.setHours(0, 0, 0, 0);
            const diasRestantes = Math.ceil((prazo - hoje) / (1000 * 60 * 60 * 24));
            return { daysLeft: diasRestantes, bookTitle: e.livro?.titulo ?? 'Livro' };
          })
          .filter(a => a.daysLeft <= 5)
          .sort((a, b) => a.daysLeft - b.daysLeft);

        setAlerts(alertasList);
      } catch (error) {
        console.error('Erro ao carregar dados do aluno:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, []);

  const palavra = (n, singular, pluralStr) => n === 1 ? singular : pluralStr;

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
          <ActionCard title="Meus Livros" onClick={() => navigate('/meus-livros')} />
        </div>

        <div className="bg-black/50 border border-white/10 rounded-md px-6 py-4 text-left min-w-[260px]">

          {/* Atrasados */}
          <div className="flex items-center gap-2 py-1 text-sm mb-1">
            <span className="font-semibold text-red-400">
              {loading ? '—' : atrasados}
            </span>
            {!loading && (
              <span className="text-white/90">
                {palavra(atrasados, 'livro atrasado.', 'livros atrasados.')}
              </span>
            )}
          </div>

          {/* Emprestados */}
          <div className="flex items-center gap-2 py-1 text-sm mb-1">
            <span className="font-semibold text-blue-400">
              {loading ? '—' : emprestados}
            </span>
            {!loading && (
              <span className="text-white/90">
                {palavra(emprestados, 'livro emprestado.', 'livros emprestados.')}
              </span>
            )}
          </div>

          {/* Reservados */}
          <div className="flex items-center gap-2 py-1 text-sm mb-2">
            <span className="font-semibold text-yellow-400">
              {loading ? '—' : reservados}
            </span>
            {!loading && (
              <span className="text-white/90">
                {palavra(reservados, 'livro reservado.', 'livros reservados.')}
              </span>
            )}
          </div>

          {/* Alertas de prazo */}
          {!loading && alerts.length === 0 ? (
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