import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

const ProtectedRoute = ({ user, requiredRole, children }) => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data, error } = await supabase
        .from('pessoa')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!error) setRole(data.role);
      setLoading(false);
    };

    fetchUserRole();
  }, [user]);

  if (loading) return <div>Carregando...</div>;

  // Se não estiver logado, redireciona para o login
  if (!user) return <Navigate to="/login" replace />;

  // Se o papel não for o esperado, bloqueia o acesso
  if (role !== requiredRole) return <div>Acesso negado.</div>;

  return children;
};

export default ProtectedRoute;