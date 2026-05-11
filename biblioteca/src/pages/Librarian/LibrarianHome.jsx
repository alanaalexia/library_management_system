import { ActionCard } from '../../components/dashboard/ActionCard';
import { StatItem } from '../../components/dashboard/StatItem';

const LibrarianHome = ({ userProfile }) => {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-3xl font-light text-gray-800">
          Seja bem vindo(a) ao <span className="font-bold text-blue-600">Bibliotheca+</span>,
        </h1>
        <h2 className="text-2xl font-semibold text-gray-700">
          bibliotecário(a) {userProfile?.nome || 'Usuário'}.
        </h2>
      </header>

      <div className="flex gap-8 mb-12">
        <ActionCard title="Acervo" icon="📚" onClick={() => console.log('Ir para Acervo')} />
        <ActionCard title="Usuários" icon="👥" onClick={() => console.log('Ir para Usuários')} />
      </div>

      <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <StatItem count={0} label="Estudantes a serem confirmados." />
        <StatItem count={0} label="Estudantes em atraso." color="text-red-500" />
        <StatItem count={0} label="Estudantes suspensos." color="text-orange-500" />
      </section>
    </div>
  );
};

export default LibrarianHome;