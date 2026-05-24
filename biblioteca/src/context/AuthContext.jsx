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

        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            try {
              await syncOrCreateUser(session.user);

              let profile = null;
              for (let attempt = 0; attempt < 3; attempt++) {
                const { data } = await supabase
                  .from('pessoa')
                  .select('*')
                  .eq('id_pessoa', session.user.id)
                  .maybeSingle();

                if (data) { profile = data; break; }
                if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 800));
              }

              if (profile) {
                if (profile.status !== 'Ativo') {
                  await supabase.auth.signOut();
                  setUser(null);
                  const mensagens = {
                    'Pendente':  'Seu cadastro está aguardando aprovação do bibliotecário.',
                    'Rejeitado': 'Seu cadastro foi rejeitado pelo bibliotecário. Entre em contato para mais informações.',
                    'Suspenso':  'Sua conta está suspensa por 30 dias devido à não devolução de livros dentro do prazo.',
                    'Banido':    'Sua conta foi banida. Entre em contato com um bibliotecário.',
                  };
                  setError(mensagens[profile.status] ?? 'Acesso não autorizado. Entre em contato com o bibliotecário.');
                  return;
                }

                if (profile.papel === 'bibliotecario') {
                  const { data: bibLogado } = await supabase
                    .from('bibliotecario')
                    .select('id_pessoa')
                    .eq('esta_logado', true)
                    .neq('id_pessoa', profile.id_pessoa)
                    .maybeSingle();

                  if (bibLogado) {
                    await supabase.auth.signOut();
                    setUser(null);
                    setError('Já existe um bibliotecário ativo no sistema. Aguarde o logout dele para entrar.');
                    return;
                  }

                  const { error: updateError } = await supabase
                    .from('bibliotecario')
                    .update({ esta_logado: true })
                    .eq('id_pessoa', profile.id_pessoa);

                  if (updateError) {
                    console.error('❌ [SIGNED_IN] ERRO na atualização:', updateError);
                    await supabase.auth.signOut();
                    setUser(null);
                    setError('Erro ao processar login do bibliotecário. Tente novamente.');
                    return;
                  }
                }

                setUser({ ...session.user, ...profile });
                setError(null);
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

                // FIX: comparação com 'Ativo' (capital) — correto conforme schema
                if (profile && profile.status === 'Ativo') {
                  if (profile.papel === 'bibliotecario') {
                    const { error: updateError } = await supabase
                      .from('bibliotecario')
                      .update({ esta_logado: true })
                      .eq('id_pessoa', profile.id_pessoa);

                    if (updateError) {
                      console.error('❌ [INITIAL_SESSION] Erro ao marcar bibliotecário:', updateError);
                    }
                  }
                  setUser({ ...session.user, ...profile });
                } else {
                  if (session) await supabase.auth.signOut();
                  setUser(null);
                }
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
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_OUT') {
          setUser(null);
          setLoading(false);
          return;
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleUnload = () => {
      if (user?.papel === 'bibliotecario') {
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
      // FIX: authService.login agora retorna { user, session, profile } explicitamente
      const { user: authUser, profile } = await loginService(email, password);
      setUser({ ...authUser, ...profile });
    } catch (err) {
      setError(err.message);
    } finally {
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
      await logoutService(user?.id_pessoa, user?.papel);
    } catch (err) {
      setError(err.message);
    } finally {
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
