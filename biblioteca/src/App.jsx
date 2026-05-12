import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Acervo from "./pages/Acervo"; 
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="loading-screen">Carregando...</div>;

  return (
    <Router>
      <Routes>
        {/* Rota de Login ainda existe, mas não é obrigatória para acessar as outras */}
        <Route path="/login" element={<Login />} />
        
        {/* Rota do Dashboard agora é pública e acessível sem login */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Rota do Acervo (exemplo de como adicionar se quiser vê-la sem logar) */}
        <Route path="/acervo" element={<Acervo />} />

        {/* Redireciona qualquer link inexistente diretamente para o Dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}