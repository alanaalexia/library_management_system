import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Se os valores vierem vazios, o erro acontece aqui
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Erro: Variáveis de ambiente não carregadas. Verifique seu arquivo .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);