import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

/**
 * TopBar — barra de ícones no canto superior direito.
 * 
 * Props:
 *  - showNotifications (bool): exibe o sino. Apenas LibrarianHome passa true.
 *  - notificationCount (number): bolinha de contagem no sino.
 *    TODO: alimentar com dados reais da API (notificações não visualizadas).
 */
export const TopBar = ({ showNotifications = false, notificationCount = 0 }) => {
  const { logout } = useAuth();

  return (
    <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
      {showNotifications && (
        <button
          className="relative text-white/70 hover:text-white transition-colors"
          onClick={() => console.log('Abrir notificações')}
          aria-label="Notificações"
        >
          <Bell size={22} />
          {notificationCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>
      )}

      <button
        className="text-white/70 hover:text-white transition-colors"
        onClick={logout}
        aria-label="Sair"
      >
        <LogOut size={22} />
      </button>
    </div>
  );
};
