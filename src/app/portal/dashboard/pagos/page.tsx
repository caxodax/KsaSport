import { createClient } from '@/lib/supabase/server'
import { getServiceSupabase } from '@/lib/supabase'
import PaymentForm from './PaymentForm'
import { redirect } from 'next/navigation'
import { getTodayRates } from '@/lib/exchangeRate'

export const revalidate = 0

export default async function PagosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const adminSupabase = getServiceSupabase()
  
  // Obtener la categoría y solvencia del atleta
  const { data: athlete } = await adminSupabase
    .from('athletes')
    .select('id, status, paid_until, teams(category)')
    .eq('user_id', user.id)
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

  let effectiveGracePeriod = settings?.grace_period_days ?? 5
  let effectivePenaltyAmount = settings?.penalty_amount ?? 10.00

  // Si el atleta pertenece a una categoría, verificar si tiene regla personalizada
  if (categoryName) {
    const { data: catData } = await adminSupabase
      .from('categories')
      .select('*')
      .ilike('name', categoryName.trim())
      .single()

    if (catData?.grace_period_days !== null && catData?.grace_period_days !== undefined) {
      effectiveGracePeriod = Number(catData.grace_period_days)
    }
    if (catData?.penalty_amount !== null && catData?.penalty_amount !== undefined) {
      effectivePenaltyAmount = Number(catData.penalty_amount)
    }
  }

  let isLate = false
  let monthsOwed = 1 // Por defecto, se debe 1 mes

  if (paidUntil) {
    // Extraer año y mes sin desfase de zona horaria
    const parts = paidUntil.split('T')[0].split('-').map(Number);
    const pYear = parts[0];
    const pMonth = parts[1]; // 1-12 (mes solvente)
    
    if (!isNaN(pYear) && !isNaN(pMonth)) {
      // El mes a pagar es el siguiente al solvente (1-indexed).
      // En JS Date(año, mes_index_0_based, dia, hora...):
      // Para mes_index, pasar pMonth equivale a (pMonth - 1) + 1.
      const limitDate = new Date(pYear, pMonth, effectiveGracePeriod, 23, 59, 59, 999);
      const today = new Date();
      
      // Solo está moroso si hoy es estrictamente mayor que la fecha límite
      if (today > limitDate) {
        isLate = true;
      }

      // Calcular cuántos meses se deben si la fecha de solvencia ya pasó
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const calculatedMonths = (currentYear - pYear) * 12 + (currentMonth - pMonth);
      if (calculatedMonths >= 1) {
        monthsOwed = calculatedMonths;
      }
    }
  }

  // 1. Obtener productos activos
  const { data: activeProducts } = await adminSupabase
    .from('products')
    .select('*')
    .eq('is_active', true)

  // 2. Obtener productos vencidos adeudados (Inactivos, pero que su end_date es mayor a paid_until)
  let expiredOwedProducts: any[] = []
  const todayStr = new Date().toISOString().split('T')[0]
  if (paidUntil) {
    const cleanPaidUntil = paidUntil.split('T')[0]
    const { data: expired } = await adminSupabase
      .from('products')
      .select('*')
      .eq('is_active', false)
      .ilike('name', '%mensualidad%')
      .gt('end_date', cleanPaidUntil)
      .lte('start_date', todayStr)
      
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
      .lte('start_date', todayStr)
      
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
      rate_type: p.rate_type || 'USD',
      months_owed: 1, // Ya no multiplicamos, cada producto es un mes distinto
      amount_paid: amountPaid,
      amount_pending: amountPending
    }
  }).filter(p => p.amount_pending > 0 || (p.is_active && p.name.toLowerCase().includes('mensualidad')))

  // Obtener tasa oficial del día desde BD
  const rates = await getTodayRates()

  return <PaymentForm 
    products={filteredProducts || []} 
    isLate={isLate} 
    penaltyAmount={effectivePenaltyAmount}
    gracePeriodDays={effectiveGracePeriod}
    rates={rates}
  />
}
