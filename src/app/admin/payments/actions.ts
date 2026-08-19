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

  // 2. Si el concepto incluye "Mensualidad", actualizar el estatus de la atleta a "Solvente"
  if (concept.toLowerCase().includes('mensualidad')) {
    const { error: athleteError } = await supabase
      .from('athletes')
      .update({ status: 'Solvente' })
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
