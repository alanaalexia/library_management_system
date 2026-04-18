// Remove tudo que não é número e aplica a máscara 000.000.000-00
export const formatCPF = (value) => {
  return value
    .replace(/\D/g, '') // Remove caracteres não numéricos
    .replace(/(\d{3})(\d)/, '$1.$2') // Ponto após o 3º dígito
    .replace(/(\d{3})(\d)/, '$1.$2') // Ponto após o 6º dígito
    .replace(/(\d{3})(\d{1,2})/, '$1-$2') // Traço após o 9º dígito
    .replace(/(-\d{2})\d+?$/, '$1'); // Limita a 11 números
};