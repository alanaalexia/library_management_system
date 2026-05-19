import { createContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import {
  register as registerService,
  logout as logoutService,
  login as loginService,
  syncOrCreateUser,
  marcarDeslogado,
  signInWithGoogle,
} from "../services/authService";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // ── Busca perfil do banco (só para OAuth — cadastro manual é tratado
    //    pelo login() em authService que já valida e retorna o profile) ──
    const fetchProfile = async (sessionUser) => {
      try {
        await syncOrCreateUser(sessionUser);
        const { data, error } = await supabase
          .from('pessoa')
          .select('*')
          .eq('id_pessoa', sessionUser.id)
          .maybeSingle();
        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Erro ao carregar perfil:', err.message);
        return null;
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth event]', event, 'session:', session);
        console.debug('[Auth event]', event);

        // SIGNED_UP: disparado pelo signUp() com autoconfirm desligado.
        // Com autoconfirm LIGADO no Supabase, este evento NÃO existe —
        // ele vira SIGNED_IN direto. Mas com autoconfirm DESLIGADO,
        // o Supabase ainda faz login automático e dispara SIGNED_IN logo
        // após o signUp quando não há confirmação de email.
        //
        // O problema: register() ainda está inserindo na tabela pessoa
        // quando SIGNED_IN chega. A solução é: se o evento é SIGNED_IN
        // mas o perfil não existe ainda na tabela pessoa, aguardamos
        // um momento e tentamos novamente.
        if (event === 'SIGNED_IN' && session?.user) {
          // Solta o callback imediatamente e processa depois
          setTimeout(async () => {
            try {
              let profile = null;
              for (let attempt = 0; attempt < 3; attempt++) {
                console.log(`[SIGNED_IN] tentativa ${attempt + 1}`);
                const { data } = await supabase
                  .from('pessoa')
                  .select('*')
                  .eq('id_pessoa', session.user.id)
                  .maybeSingle();

                console.log('[SIGNED_IN] data:', data);
                if (data) { profile = data; break; }
                if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 800));
              }

              if (profile) {
                await syncOrCreateUser(session.user);
                setUser({ ...session.user, ...profile });
              } else {
                console.error('Perfil não encontrado após cadastro.');
                setUser(null);
              }
            } catch (err) {
              console.error('[SIGNED_IN] erro:', err);
              setUser(null);
            } finally {
              setLoading(false);
            }
          }, 0);
          return;
        }

          if (event === 'INITIAL_SESSION') {
            setTimeout(async () => {
              try {
                if (session?.user) {
                  const profile = await fetchProfile(session.user);
                  setUser(profile ? { ...session.user, ...profile } : null);
                } else {
                  setUser(null);
                }
              } catch (err) {
                console.error('Erro crítico no INITIAL_SESSION:', err);
                setUser(null);
              } finally {
                setLoading(false);
              }
            }, 0);
            return;
          }

        if (event === 'TOKEN_REFRESHED') {
          // Apenas atualiza o token, não rebusca perfil
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          return;
        }

        // Qualquer outro evento
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Fecha aba / recarrega página: marca bibliotecário como deslogado ──
  useEffect(() => {
    const handleUnload = () => {
      if (user?.papel === 'bibliotecario') {
        // sendBeacon é síncrono e funciona mesmo durante unload
        // Como não temos endpoint próprio, usamos a função diretamente
        marcarDeslogado(user.id_pessoa);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [user]);

  // ─── ACTIONS ─────────────────────────────────────────────────────────────

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      // O loginService valida o acesso e retorna o perfil estruturado
      const { profile, user: authUser } = await loginService(email, password);
      
      // Força a atualização imediata dos estados locais para evitar a condição de corrida
      setUser({ ...authUser, ...profile });
      setLoading(false);
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
      // Com autoconfirm desligado + Supabase fazendo login automático,
      // o onAuthStateChange (SIGNED_IN) vai disparar e tentar buscar
      // o perfil com retry. Mas queremos mostrar a tela de sucesso,
      // não ir para o dashboard. Por isso sinalizamos success=true
      // e o Login.jsx exibe o feedback — o App.jsx só navega quando
      // user?.papel estiver definido.
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
      await logoutService(user?.id_pessoa, user?.papel);
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
