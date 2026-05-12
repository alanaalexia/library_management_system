import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ user, children }) => {
  // 1. Se o AuthProvider ainda está carregando, não fazemos nada
  // (O loading principal do App.jsx já cuida disso, mas é uma segurança extra)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Se o usuário existe, apenas entregamos o conteúdo (o Dashboard)
  // A lógica de qual Home mostrar (bibliotecário ou aluno) já está no seu App.jsx
  return children;
};

export default ProtectedRoute;