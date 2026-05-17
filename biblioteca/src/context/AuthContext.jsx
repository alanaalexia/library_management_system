import { createContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import {
  login as loginService,
  register as registerService,
  logout as logoutService,
  syncOrCreateUser,
  signInWithGoogle,
} from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const getProfile = async (sessionUser) => {
      try {
        // syncOrCreateUser só age em usuários OAuth (não-email)
        await syncOrCreateUser(sessionUser);

        const { data, error } = await supabase
          .from('pessoa')
          .select('*')
          .eq('id_pessoa', sessionUser.id)
          .maybeSingle();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Erro ao carregar perfil:", err.message);
        return null;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.debug('[Auth event]', event);

        // SIGNED_UP: vem do signUp() no cadastro manual.
        // Não buscamos perfil aqui porque o register() ainda está
        // inserindo na tabela pessoa (race condition → 409).
        // O loading fica false mas user permanece null até o login explícito.
        if (event === 'SIGNED_UP') {
          setLoading(false);
          return;
        }

        // SIGNED_OUT: limpa o user
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          return;
        }

        // INITIAL_SESSION: sessão restaurada no F5 (pode ter session ou não)
        // SIGNED_IN: login bem-sucedido (email/senha ou OAuth)
        // TOKEN_REFRESHED: token renovado em background
        if (
          event === 'INITIAL_SESSION' ||
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED'
        ) {
          if (session?.user) {
            const profile = await getProfile(session.user);
            setUser({ ...session.user, ...profile });
          } else {
            // INITIAL_SESSION sem sessão = usuário não logado
            setUser(null);
          }
          setLoading(false);
          return;
        }

        // Qualquer outro evento: apenas para o loading
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await loginService(email, password);
      // onAuthStateChange (SIGNED_IN) cuida de setar o user
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
    setLoading(true);
    try {
      await logoutService();
      // onAuthStateChange (SIGNED_OUT) cuida de setar user para null
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
    handleOAuth,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
