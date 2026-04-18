import { createContext, useState, useContext, useEffect } from "react";
import { login as loginService, register as registerService } from "../services/authService";
import { supabase } from "../services/supabaseClient";

// 1. Criamos o contexto (deixamos null para a trava de segurança abaixo)
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Monitora a sessão do usuário
  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      await loginService(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      await registerService(userData);
      setSuccess(true); // Ativa a tela de sucesso no Login.jsx
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      handleOAuth, 
      loading, 
      error, 
      success,
      setSuccess // Adicionei para você poder resetar o estado de sucesso se precisar
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// 2. Hook com trava de segurança
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  // Se o contexto for null, significa que o componente que chamou useAuth
  // está fora do <AuthProvider> no App.jsx
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  
  return context;
};