import { ActionCard } from '../../components/dashboard/ActionCard';
import { StatItem } from '../../components/dashboard/StatItem';

const StudentHome = ({ userProfile }) => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-3xl font-light text-gray-800">
          Seja bem vindo(a) ao <span className="font-bold text-blue-600">Bibliotheca+</span>,
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700">
          aluno(a) {userProfile?.nome || 'Estudante'}.
        </h2>
      </header>

      <div className="flex gap-8 mb-12">
        <ActionCard title="Acervo" icon="🔍" onClick={() => console.log('Ir para Acervo')} />
        <ActionCard title="Empréstimos" icon="📖" onClick={() => console.log('Ir para Empréstimos')} />
      </div>

      <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-gray-500 mb-4 font-medium uppercase text-sm tracking-widest">Avisos</h3>
        <StatItem count={1} label="Livro(s) em atraso." color="text-red-600" />
        <div className="mt-2 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100">
          ⚠️ <span className="font-bold">-1 Dia(s)</span> para a entrega de Bíblia.
        </div>
      </section>
    </div>
  );
};

export default StudentHome;