import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PortalIndex() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/portal/dashboard')
  } else {
    redirect('/portal/login')
  }
}
