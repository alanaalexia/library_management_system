import React from 'react';

export const Botao = ({ 
  children, 
  onClick, 
  corFundo = '#007bff', 
  corTexto = '#ffffff', 
  style,
  ...props 
}) => {
  const estiloPadrao = {
    backgroundColor: corFundo,
    color: corTexto,
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: 'opacity 0.2s',
    ...style
  };

  return (
    <button 
      onClick={onClick} 
      style={estiloPadrao} 
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      {...props}
    >
      {children}
    </button>
  );
};