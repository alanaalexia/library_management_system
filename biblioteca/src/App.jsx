// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login.jsx";
import LibrarianHome from "./pages/Librarian/LibrarianHome.jsx";
import StudentHome from "./pages/Student/StudentHome.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center">Carregando...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />

        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute user={user}>
              {/* se for bibliotecario, mostra uma, se não, outra */}
              {user?.papel === "bibliotecario" ? (
                <LibrarianHome userProfile={user} />
              ) : (
                <StudentHome userProfile={user} />
              )}
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}