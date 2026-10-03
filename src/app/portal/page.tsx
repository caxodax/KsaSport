import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PortalIndex() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/portal/dashboard')
  } else {
    redirect('/login')
  }
}
