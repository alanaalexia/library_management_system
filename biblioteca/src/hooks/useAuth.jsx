import { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { 
  login as loginService, 
  register as registerService, 
  syncOrCreateUser, 
  signInWithGoogle 
} from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // 1. Função para buscar os dados do banco
    const getProfile = async (sessionUser) => {
      try {
        // Sincroniza (garante que existe no banco)
        await syncOrCreateUser(sessionUser);

        // Busca dados extras
        const { data, error } = await supabase
          .from('pessoa')
          .select('*')
          .eq('id_pessoa', sessionUser.id)
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Erro ao carregar perfil:", err.message);
        return null;
      }
    };

    // 2. Ouvinte de mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // IMPORTANTE: Só buscamos o perfil se o evento não for "SIGNED_OUT"
      if (session?.user) {
        const profile = await getProfile(session.user);
        setUser({ ...session.user, ...profile });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // 3. Verificação inicial (rodar uma vez ao abrir a página)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await getProfile(session.user);
        setUser({ ...session.user, ...profile });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const data = await loginService(email, password);
      // O handleSession acima será disparado pelo onAuthStateChange, 
      // então não precisamos setar o user aqui manualmente para evitar conflito.
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await registerService(userData);
      setSuccess(true); 
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setError(null);
    setLoading(true);
    try {
      if (provider === 'google') {
        await signInWithGoogle();
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};