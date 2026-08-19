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
  
  // Obtener la categoría y solvencia del atleta
  const { data: athlete } = await adminSupabase
    .from('athletes')
    .select('paid_until, teams(category)')
    .eq('user_id', session.user.id)
    .single()

  // @ts-ignore
  const categoryName = athlete?.teams?.category
  const paidUntil = athlete?.paid_until

  // Obtener configuración global
  const { data: settings } = await adminSupabase
    .from('club_settings')
    .select('grace_period_days, penalty_amount')
    .eq('id', 1)
    .single()

  let isLate = false
  if (paidUntil && settings) {
    // La fecha límite es paid_until + grace_period_days.
    // Ej: paid_until = 2026-08-31. Mes en curso = Septiembre.
    // Límite = 5 de Septiembre.
    const paidDate = new Date(paidUntil)
    // El mes que debe pagar es el siguiente al pagado
    const dueMonth = paidDate.getMonth() + 1 
    const dueYear = paidDate.getFullYear()
    
    const limitDate = new Date(dueYear, dueMonth, settings.grace_period_days)
    const today = new Date()
    
    // Solo está moroso si hoy es estrictamente mayor que la fecha límite
    if (today > limitDate) {
      isLate = true
    }
  }

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

  return <PaymentForm 
    products={filteredProducts || []} 
    isLate={isLate} 
    penaltyAmount={settings?.penalty_amount || 0} 
  />
}
