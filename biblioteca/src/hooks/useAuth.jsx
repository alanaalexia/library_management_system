import { createContext, useState, useContext, useEffect } from "react";
import { login as loginService, register as registerService } from "../services/authService";
import { supabase } from "../services/supabaseClient";

// 1. Criação do contexto
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Monitoramento da sessão do usuário no Supabase
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
    setSuccess(false); // Reseta estado de sucesso anterior
    try {
      const data = await loginService(email, password);
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    setSuccess(false); // Garante que a tela de sucesso só apareça se esta tentativa der certo
    try {
      await registerService(userData);
      setSuccess(true); 
    } catch (err) {
      setError(err.message);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  };

  // Objeto de valor centralizado para evitar problemas de renderização
  const value = {
    user,
    loading,
    error,
    success,
    setSuccess,
    login,
    register,
    handleOAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// 2. Hook Customizado com trava de segurança
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  
  return context;
};