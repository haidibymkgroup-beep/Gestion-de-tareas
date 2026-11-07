// Variables de entorno públicas del frontend.
// IMPORTANTE: aquí solo van valores que pueden ser públicos (URL y clave anónima
// de Supabase). Las claves secretas (OpenAI, Anthropic, VAPID privada) viven
// únicamente en las Edge Functions.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/** true si el proyecto tiene configurado Supabase. */
export const configurado = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
