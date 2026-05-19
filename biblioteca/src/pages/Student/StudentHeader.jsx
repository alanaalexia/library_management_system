import React from "react";
import { useAuth } from "../../hooks/useAuth";
import BaseHeader from "../../components/BaseHeader";

export default function StudentHeader() {
  const { logout } = useAuth();

  const rotasEstudante = [
    { label: "Home", path: "/dashboard" },
    { label: "Acervo", path: "/acervo" },
    { label: "Meus Livros", path: "/meus-livros" }
  ];

  return <BaseHeader navigationLinks={rotasEstudante} onLogout={logout} />;
}