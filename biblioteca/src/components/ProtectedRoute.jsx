import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

const ProtectedRoute = ({ user, requiredRole, children }) => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("ProtectedRoute: useEffect disparado, usuário:", user);

    const fetchUserRole = async () => {
      if (!user || !user.id) {
        console.log("ProtectedRoute: Usuário não identificado, encerrando loading.");
        setLoading(false);
        return;
      }

      try {
        console.log("ProtectedRoute: Buscando papel no banco...");
        const { data, error } = await supabase
          .from("pessoa")
          .select("papel")
          .eq("id_pessoa", user.id)
          .single();

        if (error) {
          console.error("ProtectedRoute: Erro na consulta:", error);
        } else {
          console.log("ProtectedRoute: Papel retornado:", data?.papel);
          setRole(data?.papel);
        }
      } catch (err) {
        console.error("ProtectedRoute: Erro crítico:", err);
      } finally {
        console.log("ProtectedRoute: Finalizando loading.");
        setLoading(false);
      }
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
    console.log(`ProtectedRoute: Acesso negado. Requerido: ${requiredRole}, Atual: ${role}`);
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;