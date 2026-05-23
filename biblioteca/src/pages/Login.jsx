import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { GoogleIcon } from "../assets/icons/AuthIcons";
import { formatCPF } from "../utils/formatters";

// --- CONSTANTES ---
const DOMINIOS_INSTITUCIONAIS = ["@biblioteca.com", "@instituicao.edu"];

// --- COMPONENTES AUXILIARES ---

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

const SocialButton = ({ onClick, icon, label }) => (
  <button 
    type="button"
    onClick={onClick} 
    className="flex items-center justify-center gap-4 w-full py-4 px-6 rounded-2xl border border-white/5 bg-white/5 text-slate-300 text-sm font-bold transition-all hover:border-white/20 hover:bg-white/10 active:scale-[0.98]"
  >
    <span className="w-5 h-5 flex items-center justify-center shrink-0">
      {icon}
    </span>
    <span className="flex-1 text-left">{label}</span>
  </button>
);

const OAuthSection = ({ onOAuth }) => (
  <div className="mt-10">
    <div className="relative flex items-center justify-center mb-8">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/5"></div>
      </div>
      <span className="relative px-4 bg-[#020617] text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
        Acesso Rápido
      </span>
    </div>
    <div className="flex flex-col gap-3">
      <SocialButton onClick={() => onOAuth("google")} icon={<GoogleIcon />} label="Entrar com Google" />
    </div>
  </div>
);

const SuccessFeedback = ({ onBack, isAutoActive }) => (
  <div className="flex flex-col items-center text-center py-8">
    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
      <span className="text-4xl text-green-500">✓</span>
    </div>
    <h2 className="text-2xl font-bold text-white mb-2">Sucesso!</h2>
    <p className="text-slate-400 mb-8 max-w-xs">
      {isAutoActive 
        ? "Sua conta está ativa. Você já pode realizar o login." 
        : "Seu cadastro foi enviado para análise do bibliotecário."}
    </p>
    <button
      onClick={onBack}
      className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all"
    >
      Entrar na conta
    </button>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function Login() {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "", 
    password: "", 
    nome: "", 
    cpf: "", 
    papel: "cliente"
  });

  // Persistência da decisão de ativação para a tela de sucesso
  const [wasAutoActivated, setWasAutoActivated] = useState(false);

  const { login, register, handleOAuth, loading, error, success, setSuccess } = useAuth();

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
      // 1. Cálculo da regra de ativação ANTES de disparar o registro
      const eInstitucional = DOMINIOS_INSTITUCIONAIS.some(dom => 
        formData.email.toLowerCase().endsWith(dom)
      );
      const isAuto = formData.papel === 'bibliotecario' && eInstitucional;
      
      // 2. Armazena no estado local persistente
      setWasAutoActivated(isAuto);
      
      // 3. Dispara o registro
      register(formData);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (setSuccess) setSuccess(false); // Reseta estado de sucesso do Hook
  };

  return (



    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-950 to-black font-sans p-6"
      style={{
        backgroundImage: `url('/bookshelf-bg.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-[420px] bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-white/10 p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        
        <header className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 mb-4">
            <img src="/guaxinim.svg" alt="Logo" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent font-sans">
              Bibliotheca+
            </span>
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-medium">
            {mode === "login" ? "Que bom te ver de novo!" : "Crie sua conta na plataforma"}
          </p>
        </header>

        {success ? (
          <SuccessFeedback 
            onBack={() => {
              setMode("login");
              if (setSuccess) setSuccess(false);
            }} 
            isAutoActive={wasAutoActivated} 
          />
        ) : (
          <>
            <nav className="flex bg-black/40 rounded-2xl p-1.5 mb-8 border border-white/5">
              <button 
                type="button"
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'login' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => handleModeChange("login")}
              >
                Entrar
              </button>
              <button 
                type="button"
                className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mode === 'cadastro' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-slate-300'}`}
                onClick={() => handleModeChange("cadastro")}
              >
                Cadastrar
              </button>
            </nav>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "cadastro" && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                  <input name="nome" className="input-field" placeholder="Nome completo" onChange={handleChange} value={formData.nome} required />
                  <input name="cpf" className="input-field" placeholder="CPF (opcional)" onChange={handleChange} value={formData.cpf} maxLength={14} />
                  <div className="flex gap-3 p-1 bg-black/20 rounded-2xl border border-white/5">
                    {["cliente", "bibliotecario"].map((p) => (
                      <button key={p} type="button" 
                        className={`flex-1 py-2.5 rounded-xl text-[10px] uppercase tracking-wider font-black transition-all ${formData.papel === p ? 'bg-white/10 text-blue-400 border border-blue-500/20' : 'text-slate-600'}`}
                        onClick={() => setFormData({ ...formData, papel: p })}
                      >
                        {p === "cliente" ? "Sou Cliente" : "Sou Bibliotecário"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <input name="email" type="email" className="input-field" placeholder="E-mail" onChange={handleChange} value={formData.email} required />
              
              <div className="relative group">
                <input name="password" type={showPassword ? "text" : "password"} className="input-field pr-12" placeholder="Senha" onChange={handleChange} value={formData.password} required />
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