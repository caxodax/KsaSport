'use server'

import { getServiceSupabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function approvePayment(paymentId: string, athleteId: string, concept: string) {
  const supabase = getServiceSupabase()
  
  // 1. Obtener la data del pago antes de actualizar
  const { data: payment } = await supabase.from('payments').select('amount, product_id').eq('id', paymentId).single()
  
  // 2. Actualizar estatus del pago
  const { error: paymentError } = await supabase
    .from('payments')
    .update({ status: 'Completado' })
    .eq('id', paymentId)

  if (paymentError) return { error: paymentError.message }

  // 3. Si el concepto incluye "Mensualidad", actualizar el estatus de la atleta
  if (concept.toLowerCase().includes('mensualidad') && payment) {
    const { data: athlete } = await supabase.from('athletes').select('paid_until').eq('id', athleteId).single()
    const { data: product } = await supabase.from('products').select('price, end_date').eq('id', payment.product_id).single()
    
    let nextDate: Date;

    if (product?.end_date) {
      // Nueva lógica: si el producto tiene end_date (mes específico), usamos esa fecha
      // Solo actualizamos si el end_date del producto que acaba de pagar es MAYOR al paid_until actual
      const productEndDate = new Date(product.end_date);
      if (!athlete?.paid_until || productEndDate > new Date(athlete.paid_until)) {
        nextDate = productEndDate;
      } else {
        nextDate = new Date(athlete.paid_until);
      }
    } else {
      // Lógica legacy: calcular cuántos meses pagó basado en el precio
      let monthsPaid = 1;
      if (product && Number(product.price) > 0) {
        monthsPaid = Math.floor(Number(payment.amount) / Number(product.price));
        if (monthsPaid < 1) monthsPaid = 1;
      }

      if (athlete?.paid_until) {
        nextDate = new Date(athlete.paid_until)
        nextDate.setMonth(nextDate.getMonth() + monthsPaid)
      } else {
        nextDate = new Date()
        nextDate.setMonth(nextDate.getMonth() + monthsPaid)
        nextDate.setDate(0) 
      }
    }

    const today = new Date();
    // Consideramos solvente si pagó hasta el final del mes actual (o futuro)
    // O si el nextDate al menos cubre el mes actual.
    const isSolventeNow = nextDate.getFullYear() > today.getFullYear() || 
                         (nextDate.getFullYear() === today.getFullYear() && nextDate.getMonth() >= today.getMonth());

    const { error: athleteError } = await supabase
      .from('athletes')
      .update({ 
        status: isSolventeNow ? 'Solvente' : 'Moroso',
        paid_until: nextDate.toISOString().split('T')[0] // Formato YYYY-MM-DD
      })
      .eq('id', athleteId)
      
    if (athleteError) console.error('Error actualizando estatus del atleta', athleteError)
  }

  revalidatePath('/admin/payments')
  revalidatePath('/admin/athletes')
  return { success: true }
}

export async function rejectPayment(paymentId: string) {
  const supabase = getServiceSupabase()
  
  const { error } = await supabase
    .from('payments')
    .update({ status: 'Rechazado' })
    .eq('id', paymentId)

  if (error) return { error: error.message }

  revalidatePath('/admin/payments')
  return { success: true }
}
