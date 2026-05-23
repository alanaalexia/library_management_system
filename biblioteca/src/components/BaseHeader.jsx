import React from "react";
import { Link } from "react-router-dom";
import { Bell, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function BaseHeader({ navigationLinks = [], notificationCount = 0 }) {
  const { logout } = useAuth();

  return (
    <header className="flex items-center justify-between w-full h-16 px-6 bg-slate-900 border-b border-white/10 sticky top-0 z-50">
      {/* Identidade visual da aplicação (Esquerda) */}
      <div className="flex items-center gap-2 select-none flex-1">
        <img src="/guaxinim.svg" alt="Logo" className="w-8 h-8 object-contain" />
        <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent font-sans">
          Biblioteca+
        </span>
      </div>

      {/* Bloco de navegação (Centro) */}
      <nav className="flex items-center justify-center gap-6 flex-1">
        {navigationLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* Ações dinâmicas (Direita) */}
      <div className="flex items-center justify-end gap-5 flex-1">
        {/* <button className="relative text-slate-300 hover:text-white transition-colors" aria-label="Notificações">
          <Bell size={22} />
          {notificationCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button> */}

        <button
          onClick={logout}
          className="text-red-400 hover:text-red-300 transition-colors"
          aria-label="Sair"
        >
          <LogOut size={22} />
        </button>
      </div>
    </header>
  );
}