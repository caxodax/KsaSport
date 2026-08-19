'use server'

import { getServiceSupabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function approvePayment(paymentId: string, athleteId: string, concept: string) {
  const supabase = getServiceSupabase()
  
  // 1. Actualizar estatus del pago
  const { error: paymentError } = await supabase
    .from('payments')
    .update({ status: 'Completado' })
    .eq('id', paymentId)

  if (paymentError) return { error: paymentError.message }

  // 2. Si el concepto incluye "Mensualidad", actualizar el estatus de la atleta a "Solvente" y sumar +1 mes
  if (concept.toLowerCase().includes('mensualidad')) {
    // Buscar la fecha actual
    const { data: athlete } = await supabase.from('athletes').select('paid_until').eq('id', athleteId).single()
    
    let nextDate: Date;
    if (athlete?.paid_until) {
      // Sumarle un mes a la fecha que ya tenía
      nextDate = new Date(athlete.paid_until)
      nextDate.setMonth(nextDate.getMonth() + 1)
      // Ajustar si el día se pasa (ej. 31 a Febrero -> 28)
    } else {
      // Si no tenía fecha, le damos hasta el final de este mes
      nextDate = new Date()
      nextDate.setMonth(nextDate.getMonth() + 1)
      nextDate.setDate(0) // Último día del mes actual
    }

    const { error: athleteError } = await supabase
      .from('athletes')
      .update({ 
        status: 'Solvente',
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
