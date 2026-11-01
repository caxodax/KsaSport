import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const token_hash = searchParams.get('token_hash');
  const type = (searchParams.get('type') || 'recovery') as EmailOtpType;
  const next = searchParams.get('next') ?? '/reset-password';

  // Determinar la base URL canónica
  const isLocalEnv = process.env.NODE_ENV === 'development' || origin.includes('localhost');
  const canonicalOrigin = isLocalEnv ? origin : 'https://www.kasasportsagency.com';

  const supabase = await createClient();

  if (token_hash) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(`${canonicalOrigin}${next}`);
    }
    console.error('Error verificando token_hash en callback:', error);
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${canonicalOrigin}${next}`);
    }
    console.error('Error intercambiando código en callback:', error);
    return NextResponse.redirect(`${canonicalOrigin}${next}?code=${encodeURIComponent(code)}`);
  }

  return NextResponse.redirect(`${canonicalOrigin}${next}`);
}
