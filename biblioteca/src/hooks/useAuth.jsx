import { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import { 
  login as loginService, 
  register as registerService, 
  logout as logoutService,
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
    const getProfile = async (sessionUser) => {
      try {
        await syncOrCreateUser(sessionUser);
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const profile = await getProfile(session.user);
        setUser({ ...session.user, ...profile });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

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
      await loginService(email, password);
      // onAuthStateChange cuida de setar o user automaticamente
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
      if (provider === 'google') await signInWithGoogle();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await logoutService();
      // onAuthStateChange cuida de setar user para null automaticamente
    } catch (err) {
      setError(err.message);
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
    handleOAuth,
    logout,
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
