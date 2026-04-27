import { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
// Centralizamos todos os imports do authService em uma única linha:
import { 
  login as loginService, 
  register as registerService, 
  syncOrCreateUser, 
  signInWithGoogle 
} from "../services/authService";

// 1. Criação do contexto
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Monitoramento da sessão do usuário no Supabase
  useEffect(() => {
    const handleSession = async (session) => {
      if (session?.user) {
        try {
          // Aqui chamamos a sua função de sincronização que está no authService
          await syncOrCreateUser(session.user);
          setUser(session.user);
        } catch (err) {
          console.error("Erro ao sincronizar perfil:", err.message);
          setError("Falha ao configurar seu perfil de acesso.");
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    // 1. Checa a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    // 2. Ouve mudanças (O login do Google dispara isso aqui quando volta para o site)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
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

  // --- HANDLE OAUTH ATUALIZADO ---
  const handleOAuth = async (provider) => {
    setError(null);
    setLoading(true);
    try {
      if (provider === 'google') {
        // Usa a função que você já criou no authService
        await signInWithGoogle();
      } else {
        // Caso queira adicionar Meta/Apple no futuro
        const { error } = await supabase.auth.signInWithOAuth({ 
          provider,
          options: { redirectTo: window.location.origin }
        });
        if (error) throw error;
      }
    } catch (err) {
      setError(err.message);
      setLoading(false); // Só desliga o loading se der erro, pois se der certo ele redireciona
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