import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, configurado } from './env';

// Si faltan las variables de entorno, main.tsx muestra una pantalla de ayuda y
// nunca renderiza componentes que usen este cliente; por eso el cast es seguro.
export const supabase: SupabaseClient = configurado
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : (null as unknown as SupabaseClient);
