import { createBrowserClient as createClientSSR } from '@supabase/ssr'

export function createBrowserClient() {
  return createClientSSR(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
