import React from "react";
import { useAuth } from "../../hooks/useAuth";
import BaseHeader from "../../components/BaseHeader";

export default function LibrarianHeader() {
  const { logout } = useAuth();

  const rotasBibliotecario = [
    { label: "Home", path: "/dashboard" },
    { label: "Acervo", path: "/acervo" },
    { label: "Usuários", path: "/usuarios" } // Encaminha para rota vazia se não mapeada
  ];

  return <BaseHeader navigationLinks={rotasBibliotecario} onLogout={logout} />;
}