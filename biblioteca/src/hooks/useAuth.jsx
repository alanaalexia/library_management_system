import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

// Separado do AuthContext.jsx para satisfazer o Fast Refresh do Vite:
// um arquivo não pode exportar simultaneamente um componente (AuthProvider)
// e um hook (useAuth) — o HMR fica instável.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
