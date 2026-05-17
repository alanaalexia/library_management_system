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
          // Tenta buscar o perfil — pode ser que register() ainda não
          // terminou de inserir. Tentamos até 3 vezes com intervalo.
          let profile = null;
          for (let attempt = 0; attempt < 3; attempt++) {
            const { data } = await supabase
              .from('pessoa')
              .select('*')
              .eq('id_pessoa', session.user.id)
              .maybeSingle();

            if (data) {
              profile = data;
              break;
            }

            // Perfil ainda não existe — aguarda e tenta novamente
            if (attempt < 2) {
              await new Promise(resolve => setTimeout(resolve, 800));
            }
          }

          if (profile) {
            // Só seta o user se o status for ativo
            // (login() em authService já faz a validação e desloga se necessário,
            //  mas OAuth pode chegar aqui sem passar pelo login())
            await syncOrCreateUser(session.user);
            setUser({ ...session.user, ...profile });
          } else {
            // Perfil não encontrado após 3 tentativas (não deveria acontecer)
            console.error('Perfil não encontrado após cadastro.');
            setUser(null);
          }

          setLoading(false);
          return;
        }

        if (event === 'INITIAL_SESSION') {
          if (session?.user) {
            const profile = await fetchProfile(session.user);
            setUser(profile ? { ...session.user, ...profile } : null);
          } else {
            setUser(null);
          }
          setLoading(false);
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
      // loginService valida status e regra de bibliotecário único
      // e retorna o profile junto — sem depender do onAuthStateChange
      const { profile, ...authData } = await loginService(email, password);
      // onAuthStateChange (SIGNED_IN) também vai disparar e setar o user,
      // mas como loginService já validou, não há risco de inconsistência
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
