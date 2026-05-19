import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";

export default function BaseHeader({ navigationLinks, onLogout }) {
  const location = useLocation();

  return (
    <header className="w-full h-16 bg-slate-900 border-b border-white/10 flex items-center justify-between px-6 text-white sticky top-0 z-50">
      {/* Esquerda: Logo e Nome */}
      <div className="flex items-center gap-3">
        {/* Renderização do arquivo guaxinim.svg localizado na pasta public */}
        <img 
          src="/guaxinim.svg" 
          alt="Logo Guaxinim" 
          className="w-8 h-8 object-contain"
        />
        <span className="font-bold text-lg tracking-wide text-blue-400">Biblioteca+</span>
      </div>

      {/* Centro: Navegação Dinâmica */}
      <nav className="flex items-center gap-8">
        {navigationLinks.map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link
              key={link.label}
              to={link.path || "#"}
              className={`text-sm font-medium transition-colors duration-200 ${
                isActive 
                  ? "text-blue-500 font-semibold" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Direita: Notificações e Encerramento de Sessão */}
      <div className="flex items-center gap-5">
        <button className="text-slate-400 hover:text-white transition-colors cursor-pointer">
          <Bell className="w-5 h-5" />
        </button>
        <button 
          onClick={onLogout}
          className="text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}