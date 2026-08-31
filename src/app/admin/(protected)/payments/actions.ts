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
    // Buscar la fecha actual y la mensualidad base
    const { data: athlete } = await supabase.from('athletes').select('paid_until').eq('id', athleteId).single()
    const { data: product } = await supabase.from('products').select('price').eq('id', payment.product_id).single()
    
    // Calcular cuántos meses pagó (ignorando el residuo de la multa)
    let monthsPaid = 1;
    if (product && Number(product.price) > 0) {
      monthsPaid = Math.floor(Number(payment.amount) / Number(product.price));
      if (monthsPaid < 1) monthsPaid = 1; // Seguridad por si acaso abonó parcial y lo aprobaron manual
    }

    let nextDate: Date;
    if (athlete?.paid_until) {
      // Sumarle N meses a la fecha que ya tenía
      nextDate = new Date(athlete.paid_until)
      nextDate.setMonth(nextDate.getMonth() + monthsPaid)
    } else {
      // Si no tenía fecha, le damos hasta el final de este mes + (N-1) meses
      nextDate = new Date()
      nextDate.setMonth(nextDate.getMonth() + monthsPaid)
      nextDate.setDate(0) // Último día de ese mes
    }

    // Determinar si ahora queda solvente o si sigue moroso
    // Para simplificar, si el nextDate es en el futuro (o mes actual), queda Solvente.
    const today = new Date();
    const isSolventeNow = nextDate.getFullYear() >= today.getFullYear() && nextDate.getMonth() >= today.getMonth();

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
