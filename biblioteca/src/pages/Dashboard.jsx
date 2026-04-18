import ProtectedRoute from "../components/ProtectedRoute";

function Dashboard({ user }) {
  return (
    <ProtectedRoute user={user} requiredRole="bibliotecario">
      <h1>Bem-vindo ao Painel de Controle</h1>
      <p>Este conteúdo só é visível para usuários com o papel de "bibliotecario".</p>
    </ProtectedRoute>
  );
}

export default Dashboard;