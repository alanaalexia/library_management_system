import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth' // Importe aqui!
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider> {/* O AuthProvider abraça o App inteiro aqui */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
)