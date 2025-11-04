import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Variáveis de ambiente do Supabase não configuradas')
  // Não lançar erro, apenas continuar com null para evitar quebra total
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')