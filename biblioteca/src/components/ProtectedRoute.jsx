import React, { useState, useEffect } from "react";
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
        .from("pessoa")
        .select("papel")
        .eq("id_pessoa", user.id)
        .single();

      if (error) {
        console.error("Erro ao buscar papel do usuário:", error.message);
      } else {
        setRole(data?.papel);
      }

      setLoading(false);
    };

    fetchUserRole();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-slate-300">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && role !== requiredRole) {
    // Se o usuário não tiver o papel exigido pela rota, volta para a raiz
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;