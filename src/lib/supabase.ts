import { createClient } from '@supabase/supabase-js';

// Verificamos que las variables existan para evitar errores en producción
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Cliente público de Supabase.
 * Úsalo para operaciones en el cliente y validaciones generales con RLS.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Cliente de Supabase con privilegios administrativos (Service Role).
 * IMPORTANTE: ¡Sólo úsalo en Server Actions o Rutas de API seguras!
 * Nunca lo expongas al cliente.
 */
export const getServiceSupabase = () => {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing env.SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
};
