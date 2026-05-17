/**
 * ActionCard — botão de ação principal das páginas Home.
 * Reutilizado em StudentHome e LibrarianHome.
 *
 * Props:
 *  - title (string): texto do botão
 *  - onClick (fn): ação de navegação
 */
export const ActionCard = ({ title, onClick }) => (
  <button
    onClick={onClick}
    className="px-10 py-3 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold rounded-md transition-colors duration-150 text-base shadow-md w-48"
  >
    {title}
  </button>
);
