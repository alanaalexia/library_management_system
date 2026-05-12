// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login.jsx";
import LibrarianHome from "./pages/Librarian/LibrarianHome.jsx";
import StudentHome from "./pages/Student/StudentHome.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  const { user, loading } = useAuth();

  // 1. Se estiver carregando, mostra o loading
  if (loading) {
    return <div className="h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Se NÃO tem user, Login. Se TEM user, Dashboard */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute user={user}>
              {/* Verificação extra: só renderiza se o papel já existir no objeto user */}
              {user?.papel === "bibliotecario" ? (
                <LibrarianHome userProfile={user} />
              ) : (
                <StudentHome userProfile={user} />
              )}
            </ProtectedRoute>
          } 
        />

        {/* Rota padrão */}
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}