import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/reset-password';

  // Determinar la base URL canónica
  const isLocalEnv = process.env.NODE_ENV === 'development' || origin.includes('localhost');
  const canonicalOrigin = isLocalEnv ? origin : 'https://www.kasasportsagency.com';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${canonicalOrigin}${next}`);
    }
    console.error('Error intercambiando código de autenticación en servidor:', error);
    // Si falló el intercambio en servidor (por ejemplo, verifier no encontrado), redirigir pasando el código para que el cliente intente el intercambio
    return NextResponse.redirect(`${canonicalOrigin}${next}?code=${encodeURIComponent(code)}`);
  }

  // Si no vino código o es flujo de hash/recovery, redirigir a reset-password para que el cliente capture el token
  return NextResponse.redirect(`${canonicalOrigin}${next}`);
}
