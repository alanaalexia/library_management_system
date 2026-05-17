import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login.jsx";
import LibrarianHome from "./pages/Librarian/LibrarianHome.jsx";
import StudentHome from "./pages/Student/StudentHome.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  const { user, loading } = useAuth();

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
          element={!user ? <Login /> : <Navigate to="/dashboard" replace />}
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              {/* Aguarda o papel estar disponível no perfil antes de renderizar.
                  Sem isso, um bibliotecário recém-logado pode ver StudentHome
                  por um instante enquanto o perfil ainda não chegou. */}
              {!user?.papel ? (
                <div className="h-screen flex items-center justify-center bg-black">
                  <span className="text-white text-lg">Carregando perfil...</span>
                </div>
              ) : user.papel === "bibliotecario" ? (
                <LibrarianHome userProfile={user} />
              ) : (
                <StudentHome userProfile={user} />
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </Router>
  );
}
