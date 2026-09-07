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
    .select('id, status, paid_until, teams(category)')
    .eq('user_id', session.user.id)
    .single()

  if (!athlete) {
    redirect('/portal/link-profile')
  }

  if (athlete.status === 'Inactivo') {
    redirect('/portal/dashboard')
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

  // 1. Obtener productos activos
  const { data: activeProducts } = await adminSupabase
    .from('products')
    .select('*')
    .eq('is_active', true)

  // 2. Obtener productos vencidos adeudados (Inactivos, pero que su end_date es mayor a paid_until)
  let expiredOwedProducts: any[] = []
  if (paidUntil) {
    const { data: expired } = await adminSupabase
      .from('products')
      .select('*')
      .eq('is_active', false)
      .ilike('name', '%mensualidad%')
      .gt('end_date', new Date(paidUntil).toISOString())
      .lte('start_date', new Date().toISOString())
      
    if (expired) {
      expiredOwedProducts = expired
    }
  } else {
    // Si no tiene paid_until, debe todas las mensualidades anteriores inactivas
    const { data: expired } = await adminSupabase
      .from('products')
      .select('*')
      .eq('is_active', false)
      .ilike('name', '%mensualidad%')
      .lte('start_date', new Date().toISOString())
      
    if (expired) {
      expiredOwedProducts = expired
    }
  }

  const allProducts = [...(activeProducts || []), ...expiredOwedProducts]

  // Obtener todos los pagos aprobados/completados del atleta
  const { data: payments } = await adminSupabase
    .from('payments')
    .select('product_id, amount')
    .eq('athlete_id', athlete.id)
    .in('status', ['Completado', 'Pendiente'])

  // Obtener opt-ins del atleta
  const { data: athleteOptIns } = await adminSupabase
    .from('athlete_product_opt_ins')
    .select('product_id')
    .eq('athlete_id', athlete.id)

  const optedInIds = new Set(athleteOptIns?.map(o => o.product_id) || [])

  // Obtener exoneraciones
  const { data: athleteExemptions } = await adminSupabase
    .from('athlete_exemptions')
    .select('product_id')
    .eq('athlete_id', athlete.id)

  const exemptIds = new Set(athleteExemptions?.map(e => e.product_id) || [])

  // Filtrar productos
  const filteredProducts = allProducts.filter(p => {
    if (exemptIds.has(p.id)) return false
    if (p.requires_opt_in && !optedInIds.has(p.id)) return false
    
    if (!p.categories || p.categories.length === 0) return true
    if (categoryName && p.categories.includes(categoryName)) return true
    return false
  }).map(p => {
    const basePrice = Number(p.price)

    // Calcular cuánto ha pagado de este producto específico
    const productPayments = payments?.filter(pay => pay.product_id === p.id) || []
    const amountPaid = productPayments.reduce((sum, pay) => sum + Number(pay.amount), 0)
    
    const amountPending = Math.max(0, basePrice - amountPaid)

    return {
      ...p,
      price: basePrice,
      original_price: Number(p.price),
      months_owed: 1, // Ya no multiplicamos, cada producto es un mes distinto
      amount_paid: amountPaid,
      amount_pending: amountPending
    }
  }).filter(p => p.amount_pending > 0 || (p.is_active && p.name.toLowerCase().includes('mensualidad')))

  // Permitir la mensualidad siempre porque es recurrente, aunque su "amount_pending" llegue a 0.

  return <PaymentForm 
    products={filteredProducts || []} 
    isLate={isLate} 
    penaltyAmount={settings?.penalty_amount || 0}
    gracePeriodDays={settings?.grace_period_days || 5}
  />
}
