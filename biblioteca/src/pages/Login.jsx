import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { GoogleIcon, MetaIcon, AppleIcon } from "../assets/icons/AuthIcons";
import { formatCPF } from "../utils/formatters";

// --- COMPONENTES AUXILIARES (Definidos antes para evitar ReferenceError) ---

const EyeIcon = ({ open }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {open ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    )}
  </svg>
);

const SocialButton = ({ onClick, icon, isWhite }) => (
  <button 
    type="button"
    onClick={onClick} 
    className={`flex items-center justify-center p-3 rounded-2xl border border-white/5 transition-all hover:border-white/20 hover:bg-white/5 active:scale-90 ${isWhite ? 'bg-white' : 'bg-white/5'}`}
  >
    {icon}
  </button>
);

const OAuthSection = ({ onOAuth }) => (
  <div className="mt-10">
    <div className="relative flex items-center justify-center mb-8">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
      <span className="relative px-4 bg-slate-900 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Acesso Rápido</span>
    </div>
    <div className="grid grid-cols-3 gap-4">
      <SocialButton onClick={() => onOAuth("google")} icon={<GoogleIcon />} />
      <SocialButton onClick={() => onOAuth("meta")} icon={<MetaIcon />} />
      <SocialButton onClick={() => onOAuth("apple")} icon={<AppleIcon />} isWhite />
    </div>
  </div>
);

const SuccessFeedback = ({ onBack }) => (
  <div className="text-center py-6 animate-in zoom-in duration-300">
    <div className="w-20 h-20 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center text-3xl mx-auto mb-6 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
      ✓
    </div>
    <h3 className="text-2xl font-bold text-white mb-2">Sucesso!</h3>
    <p className="text-slate-400 text-sm mb-8">Seu cadastro foi enviado para análise do bibliotecário.</p>
    <button type="button" onClick={onBack} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl transition-all">
      Entrar na conta
    </button>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function Login() {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  
  // Pegando as funções do useAuth
  const { login, register, handleOAuth, loading, error, success } = useAuth();

  const [formData, setFormData] = useState({
    email: "", 
    password: "", 
    nome: "", 
    cpf: "", 
    papel: "cliente"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = name === "cpf" ? formatCPF(value) : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === "login") {
      login(formData.email, formData.password);
    } else {
      register(formData);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black font-sans p-6">
      <div className="w-full max-w-[420px] bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-4">
            <img src="/guaxinim.svg" alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Biblioteca<span className="text-blue-500">+</span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            {mode === "login" ? "Que bom te ver de novo!" : "Crie sua conta na plataforma"}
          </p>
        </header>

        {success ? (
          <SuccessFeedback onBack={() => setMode("login")} />
        ) : (
          <>
            <nav className="flex bg-black/40 rounded-2xl p-1.5 mb-8 border border-white/5">
              <button 
                type="button"
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'login' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => setMode("login")}
              >
                Entrar
              </button>
              <button 
                type="button"
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'cadastro' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => setMode("cadastro")}
              >
                Cadastrar
              </button>
            </nav>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "cadastro" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  <input 
                    name="nome" 
                    className="input-field" 
                    placeholder="Nome completo" 
                    onChange={handleChange} 
                    value={formData.nome}
                    required 
                  />
                  <input 
                    name="cpf" 
                    className="input-field" 
                    placeholder="CPF (opcional)" 
                    onChange={handleChange} 
                    value={formData.cpf}
                    maxLength={14} 
                  />
                  <div className="flex gap-3 p-1 bg-black/20 rounded-2xl border border-white/5">
                    {["cliente", "bibliotecario"].map((p) => (
                      <button key={p} type="button" 
                        className={`flex-1 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all ${formData.papel === p ? 'bg-white/10 text-blue-400 border border-blue-500/20' : 'text-slate-600'}`}
                        onClick={() => setFormData({ ...formData, papel: p })}
                      >
                        {p === "cliente" ? "Sou Aluno" : "Sou Bibliotecário"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input 
                name="email" 
                type="email" 
                className="input-field" 
                placeholder="E-mail" 
                onChange={handleChange} 
                value={formData.email}
                required 
              />
              
              <div className="relative group">
                <input 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  className="input-field pr-12" 
                  placeholder="Senha" 
                  onChange={handleChange} 
                  value={formData.password}
                  required 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-500 transition-colors">
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              {error && <p className="text-[11px] font-bold text-red-400 text-center uppercase tracking-wide">{error}</p>}

              <button type="submit" disabled={loading} className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20 transition-all active:scale-95 disabled:opacity-50">
                {loading ? "Processando..." : mode === "login" ? "Entrar Agora" : "Finalizar Cadastro"}
              </button>
            </form>

            {mode === "login" && <OAuthSection onOAuth={handleOAuth} />}
          </>
        )}
      </div>
    </div>
  );
}