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
    .select('id, paid_until, teams(category)')
    .eq('user_id', session.user.id)
    .single()

  if (!athlete) {
    redirect('/portal/link-profile')
  }

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
  let monthsOwed = 1 // Por defecto, se debe 1 mes

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

    // Calcular cuántos meses se deben si la fecha de solvencia ya pasó
    const yearDiff = today.getFullYear() - paidDate.getFullYear()
    const monthDiff = today.getMonth() - paidDate.getMonth()
    
    const calculatedMonths = (yearDiff * 12) + monthDiff
    if (calculatedMonths >= 1) {
      monthsOwed = calculatedMonths
    }
  }

  // Obtener productos activos
  const { data: products } = await adminSupabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Obtener todos los pagos aprobados/completados del atleta
  const { data: payments } = await adminSupabase
    .from('payments')
    .select('product_id, amount')
    .eq('athlete_id', athlete.id)
    .in('status', ['Completado', 'Pendiente']) // Incluimos pendientes para no permitirles volver a pagar si ya reportaron

  // Filtrar productos: 
  // 1. Si categories es null o array vacío -> Es Global (aplica a todas)
  // 2. Si categories incluye el categoryName del atleta -> Aplica a este atleta
  const filteredProducts = products?.filter(p => {
    if (!p.categories || p.categories.length === 0) return true
    if (categoryName && p.categories.includes(categoryName)) return true
    return false
  }).map(p => {
    // Ajustar precio si es mensualidad y debe múltiples meses
    const isMensualidad = p.name.toLowerCase().includes('mensualidad')
    let basePrice = Number(p.price)
    
    if (isMensualidad && monthsOwed > 1) {
      basePrice = basePrice * monthsOwed
    }

    // Calcular cuánto ha pagado de este producto
    const productPayments = payments?.filter(pay => pay.product_id === p.id) || []
    const amountPaid = productPayments.reduce((sum, pay) => sum + Number(pay.amount), 0)
    
    // Si es mensualidad, restamos los abonos del total acumulado. Si no, del precio original.
    const amountPending = Math.max(0, basePrice - amountPaid)

    // Agregar info extra para PaymentForm
    return {
      ...p,
      price: basePrice, // El precio base se actualiza al acumulado
      original_price: Number(p.price), // Guardamos el original por si acaso
      months_owed: isMensualidad ? monthsOwed : 1,
      amount_paid: amountPaid,
      amount_pending: amountPending
    }
  }).filter(p => p.amount_pending > 0 || p.name.toLowerCase().includes('mensualidad'))

  // Permitir la mensualidad siempre porque es recurrente, aunque su "amount_pending" llegue a 0.

  return <PaymentForm 
    products={filteredProducts || []} 
    isLate={isLate} 
    penaltyAmount={settings?.penalty_amount || 0} 
  />
}
