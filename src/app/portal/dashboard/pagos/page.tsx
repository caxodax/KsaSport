import { createClient } from '@/lib/supabase/server'
import { getServiceSupabase } from '@/lib/supabase'
import PaymentForm from './PaymentForm'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function PagosPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/portal/login')
  }

  const adminSupabase = getServiceSupabase()
  
  // Obtener la categoría del atleta
  const { data: athlete } = await adminSupabase
    .from('athletes')
    .select('teams(category)')
    .eq('user_id', session.user.id)
    .single()

  // @ts-ignore
  const categoryName = athlete?.teams?.category

  // Obtener productos activos
  const { data: products } = await adminSupabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Filtrar productos: 
  // 1. Si categories es null o array vacío -> Es Global (aplica a todas)
  // 2. Si categories incluye el categoryName del atleta -> Aplica a este atleta
  const filteredProducts = products?.filter(p => {
    if (!p.categories || p.categories.length === 0) return true
    if (categoryName && p.categories.includes(categoryName)) return true
    return false
  })

  return <PaymentForm products={filteredProducts || []} />
}
