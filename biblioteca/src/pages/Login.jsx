import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { GoogleIcon, MetaIcon, AppleIcon } from "../assets/icons/AuthIcons";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, handleOAuth, loading, error, success } = useAuth();

  const [formData, setFormData] = useState({
    email: "", password: "", nome: "", cpf: "", papel: "cliente"
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111112] font-sans p-4">
      <div className="w-full max-w-[400px] bg-[#1c1c1e] rounded-2xl border border-[#2a2a2e] p-8 shadow-2xl">
        <header className="text-center mb-6">
          <span className="text-2xl font-semibold text-[#f5f5f5] tracking-tight">Bibliotheca</span>
          <span className="text-2xl font-bold text-blue-500">+</span>
        </header>

        {success ? (
          <SuccessFeedback onBack={() => setMode("login")} />
        ) : (
          <>
            <nav className="flex bg-[#2a2a2e] rounded-xl p-1 mb-5">
              <button 
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-[#3a3a3e] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => setMode("login")}
              >
                Entrar
              </button>
              <button 
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'cadastro' ? 'bg-[#3a3a3e] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                onClick={() => setMode("cadastro")}
              >
                Cadastrar
              </button>
            </nav>

            <form onSubmit={(e) => { e.preventDefault(); mode === "login" ? login(formData.email, formData.password) : register(formData); }} className="flex flex-col gap-3">
              {mode === "cadastro" && (
                <>
                  <input name="nome" className="w-full p-2.5 bg-[#2a2a2e] border border-[#3a3a3e] rounded-xl text-[#f5f5f5] text-sm focus:border-blue-500 outline-none transition-colors" placeholder="Nome completo" onChange={handleChange} required />
                  <input name="cpf" className="w-full p-2.5 bg-[#2a2a2e] border border-[#3a3a3e] rounded-xl text-[#f5f5f5] text-sm focus:border-blue-500 outline-none transition-colors" placeholder="CPF (opcional)" onChange={handleChange} maxLength={14} />
                  <div className="flex gap-2">
                    {["cliente", "bibliotecario"].map((p) => (
                      <button key={p} type="button" 
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${formData.papel === p ? 'bg-blue-900/30 border-blue-500 text-blue-400' : 'bg-[#2a2a2e] border-[#3a3a3e] text-gray-500'}`}
                        onClick={() => setFormData({ ...formData, papel: p })}
                      >
                        {p === "cliente" ? "Aluno" : "Bibliotecário"}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <input name="email" type="email" className="w-full p-2.5 bg-[#2a2a2e] border border-[#3a3a3e] rounded-xl text-[#f5f5f5] text-sm focus:border-blue-500 outline-none transition-colors" placeholder="E-mail" onChange={handleChange} required />
              
              <div className="relative">
                <input name="password" type={showPassword ? "text" : "password"} className="w-full p-2.5 pr-10 bg-[#2a2a2e] border border-[#3a3a3e] rounded-xl text-[#f5f5f5] text-sm focus:border-blue-500 outline-none transition-colors" placeholder="Senha" onChange={handleChange} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  <EyeIcon open={showPassword} />
                </button>
              </div>

              {error && <p className="text-xs text-red-400 text-center mt-1">{error}</p>}

              <button type="submit" disabled={loading} className="w-full mt-2 p-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
              </button>
            </form>

            {mode === "login" && <OAuthSection onOAuth={handleOAuth} />}
          </>
        )}
      </div>
    </div>
  );
}

// Componentes Auxiliares com Tailwind
const OAuthSection = ({ onOAuth }) => (
  <div className="mt-6">
    <div className="flex items-center gap-3 mb-6">
      <div className="flex-1 h-[1px] bg-[#2a2a2e]"></div>
      <span className="text-[10px] uppercase tracking-widest text-gray-600 font-bold">ou entrar com</span>
      <div className="flex-1 h-[1px] bg-[#2a2a2e]"></div>
    </div>
    <div className="flex flex-col gap-2">
      <button onClick={() => onOAuth("google")} className="flex items-center justify-center gap-3 w-full p-2.5 bg-[#2a2a2e] border border-[#3a3a3e] rounded-xl text-gray-300 text-sm font-medium hover:bg-[#323236] transition-colors"><GoogleIcon /> Google</button>
      <button onClick={() => onOAuth("meta")} className="flex items-center justify-center gap-3 w-full p-2.5 bg-[#2a2a2e] border border-[#3a3a3e] rounded-xl text-gray-300 text-sm font-medium hover:bg-[#323236] transition-colors"><MetaIcon /> Meta</button>
      <button onClick={() => onOAuth("apple")} className="flex items-center justify-center gap-3 w-full p-2.5 bg-white rounded-xl text-black text-sm font-medium hover:bg-gray-200 transition-colors"><AppleIcon /> Apple</button>
    </div>
  </div>
);

const SuccessFeedback = ({ onBack }) => (
  <div className="text-center py-4">
    <div className="w-12 h-12 rounded-full bg-green-900/30 text-green-500 flex items-center justify-center text-xl mx-auto mb-4 border border-green-500/50">✓</div>
    <h3 className="text-lg font-semibold text-white mb-2">Cadastro enviado!</h3>
    <p className="text-sm text-gray-500 mb-6">Aguarde a aprovação do sistema.</p>
    <button onClick={onBack} className="px-6 py-2 bg-[#2a2a2e] border border-[#3a3a3e] rounded-xl text-sm text-gray-300 hover:bg-[#323236]">Voltar</button>
  </div>
);

const EyeIcon = ({ open }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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