import { useState } from "react";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard"; // Supondo que você tenha essa tela

function App() {
  const [user, setUser] = useState(null);

  // Se não há usuário, mostra Login. Se há, mostra o sistema.
  return (
    <main>
      {user ? <Dashboard /> : <Login onLoginSuccess={setUser} />}
    </main>
  );
}

export default App;