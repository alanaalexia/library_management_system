import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login.jsx";
import LibrarianHome from "./pages/Librarian/LibrarianHome.jsx";
import StudentHome from "./pages/Student/StudentHome.jsx";
import LibrarianBooks from "./pages/Librarian/LibrarianBooks.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  const { user, loading, success } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <span className="text-white text-lg">Carregando...</span>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Rota de Login com Redirecionamento Automático para Usuários Ativos */}
        <Route
          path="/login"
            // Se tem user ativo com papel definido, vai para dashboard.
            // Se tem user mas está pendente ou sem papel, fica no login
            // (o Login.jsx mostrará o feedback de aprovação via success).
          element={
            user && user.papel && user.status === 'ativo'
              ? <Navigate to="/dashboard" replace />
              : <Login />
          }
        />

        {/* Dashboard com Controle de Papéis (Bibliotecário ou Estudante) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user && user.status === 'ativo' ? user : null}>
              {!user?.papel ? (
                <div className="h-screen flex items-center justify-center bg-black">
                  <span className="text-white text-lg">Carregando perfil...</span>
                </div>
              ) : user.papel === 'bibliotecario' ? (
                <LibrarianHome userProfile={user} />
              ) : (
                <StudentHome userProfile={user} />
              )}
            </ProtectedRoute>
          }
        />

        {/* Nova Rota do Acervo Integrada ao LibrarianBooks */}
        <Route
          path="/acervo"
          element={
            <ProtectedRoute user={user && user.status === 'ativo' ? user : null}>
              <LibrarianBooks />
            </ProtectedRoute>
          }
        />

        {/* Rotas de Fallback e Redirecionamento Padrão */}
        <Route
          path="/"
          element={
            <Navigate
              to={user && user.papel && user.status === 'ativo' ? '/dashboard' : '/login'}
              replace
            />
          }
        />
        <Route
          path="*"
          element={
            <Navigate
              to={user && user.papel && user.status === 'ativo' ? '/dashboard' : '/login'}
              replace
            />
          }
        />
      </Routes>
    </Router>
  );
}