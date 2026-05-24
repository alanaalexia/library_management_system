import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login.jsx";
import LibrarianHome from "./pages/Librarian/LibrarianHome.jsx";
import StudentHome from "./pages/Student/StudentHome.jsx";
import LibrarianBooks from "./pages/Librarian/LibrarianBooks.jsx";
import StudentBooks from "./pages/Student/StudentBooks.jsx";
import StudentMyBooks from "./pages/Student/StudentMyBooks.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import LibrarianStudents from "./pages/Librarian/LibrarianStudents.jsx";

export default function App() {
  const { user, loading } = useAuth();
  console.log('[App] loading:', loading, 'user:', user);

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
        <Route
          path="/login"
          element={
            user && user.papel && user.status === 'Ativo'
              ? <Navigate to="/dashboard" replace />
              : <Login />
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user && user.status === 'Ativo' ? user : null}>
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

        <Route
          path="/acervo"
          element={
            <ProtectedRoute user={user && user.status === 'Ativo' ? user : null}>
              {user?.papel === 'bibliotecario' ? (
                <LibrarianBooks />
              ) : (
                <StudentBooks />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/meus-livros"
          element={
            <ProtectedRoute user={user && user.status === 'Ativo' ? user : null} requiredRole="cliente">
              <StudentMyBooks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/usuarios"
          element={
            <ProtectedRoute user={user && user.status === 'Ativo' ? user : null} requiredRole="bibliotecario">
              <LibrarianStudents />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <Navigate
              to={user && user.papel && user.status === 'Ativo' ? '/dashboard' : '/login'}
              replace
            />
          }
        />
        <Route
          path="*"
          element={
            <Navigate
              to={user && user.papel && user.status === 'Ativo' ? '/dashboard' : '/login'}
              replace
            />
          }
        />
      </Routes>
    </Router>
  );
}