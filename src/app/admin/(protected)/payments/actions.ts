'use server'

import { getServiceSupabase } from '@/lib/supabase'
import { checkAdminPermission } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'
import { sendAthletePush } from '@/lib/pushNotifications'

export async function approvePayment(paymentId: string, athleteId: string, concept: string) {
  await checkAdminPermission('view_finances')
  const supabase = getServiceSupabase()
  
  // 1. Obtener la data del pago antes de actualizar
  const { data: payment } = await supabase
    .from('payments')
    .select('amount, product_id, status')
    .eq('id', paymentId)
    .single()
  
  if (!payment) return { error: 'Pago no encontrado.' }
  if (payment.status === 'Completado') return { error: 'Este pago ya fue aprobado previamente.' }

  // 2. Actualizar estatus del pago de forma atómica asegurando que siga en Pendiente
  const { data: updatedPayment, error: paymentError } = await supabase
    .from('payments')
    .update({ status: 'Completado' })
    .eq('id', paymentId)
    .eq('status', 'Pendiente')
    .select('id')
    .single()

  if (paymentError || !updatedPayment) {
    return { error: 'Este pago ya fue procesado o no se encuentra en estado Pendiente.' }
  }

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

  // Notificación Push Automática al Atleta
  sendAthletePush(athleteId, {
    title: '¡Pago Aprobado! ✅',
    body: `Tu pago de "${concept}" por $${Number(payment.amount).toFixed(2)} ha sido validado exitosamente.`,
    url: '/portal/dashboard',
  }).catch((err) => console.error('Error enviando push de aprobación:', err));

  revalidatePath('/admin/payments')
  revalidatePath('/admin/athletes')
  revalidatePath('/admin/ledger')
  revalidatePath('/admin')
  return { success: true }
}

export async function rejectPayment(paymentId: string) {
  await checkAdminPermission('view_finances')
  const supabase = getServiceSupabase()
  
  // Obtener atleta_id antes de actualizar
  const { data: payment } = await supabase
    .from('payments')
    .select('athlete_id, amount')
    .eq('id', paymentId)
    .single()

  const { data: updatedPayment, error } = await supabase
    .from('payments')
    .update({ status: 'Rechazado' })
    .eq('id', paymentId)
    .eq('status', 'Pendiente')
    .select('id')
    .single()

  if (error || !updatedPayment) {
    return { error: 'El pago ya fue procesado o no se encuentra en estado Pendiente.' }
  }

  // Notificación Push Automática de Rechazo
  if (payment?.athlete_id) {
    sendAthletePush(payment.athlete_id, {
      title: 'Aviso sobre tu reporte de pago ⚠️',
      body: 'Tu reporte de pago ha sido revisado y no pudo ser validado. Revisa tu portal o contacta a administración.',
      url: '/portal/dashboard/pagos',
    }).catch((err) => console.error('Error enviando push de rechazo:', err));
  }

  revalidatePath('/admin/payments')
  revalidatePath('/admin/athletes')
  revalidatePath('/admin/ledger')
  revalidatePath('/admin')
  return { success: true }
}

/**
 * Anula contablemente un pago completado o registrado por error.
 * Actualiza el status a 'Anulado', descontándolo inmediatamente del estado de cuenta,
 * ingresos del club y recalculando solvencia si correspondía a una mensualidad.
 */
export async function voidPayment(paymentId: string, reason?: string) {
  const { permissions } = await checkAdminPermission()
  if (!permissions.includes('view_finances') && !permissions.includes('manage_catalog')) {
    return { error: 'No autorizado para anular pagos.' }
  }

  const supabase = getServiceSupabase()

  // 1. Obtener la data del pago antes de anular
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('id, athlete_id, product_id, amount, concept, status, rate_type')
    .eq('id', paymentId)
    .single()

  if (fetchError || !payment) {
    return { error: 'Pago no encontrado.' }
  }

  if (payment.status === 'Anulado') {
    return { error: 'Este pago ya se encuentra anulado.' }
  }

  // 2. Anular el pago actualizando su estatus
  const voidConcept = reason?.trim() 
    ? `${payment.concept} [ANULADO: ${reason.trim()}]` 
    : `${payment.concept} [ANULADO]`

  const { error: updateError } = await supabase
    .from('payments')
    .update({ 
      status: 'Anulado',
      concept: voidConcept
    })
    .eq('id', paymentId)

  if (updateError) {
    return { error: updateError.message || 'Error al anular el pago.' }
  }

  const athleteId = payment.athlete_id

  // 3. Reversión de estatus del atleta si el pago era una Mensualidad
  if (payment.concept.toLowerCase().includes('mensualidad') && athleteId) {
    // Buscamos los pagos COMPLETADOS restantes de este atleta para mensualidades
    const { data: remainingPayments } = await supabase
      .from('payments')
      .select('amount, product_id, created_at, products(price, end_date)')
      .eq('athlete_id', athleteId)
      .eq('status', 'Completado')
      .ilike('concept', '%mensualidad%')
      .order('created_at', { ascending: false })

    if (!remainingPayments || remainingPayments.length === 0) {
      await supabase
        .from('athletes')
        .update({
          status: 'Moroso',
          paid_until: null
        })
        .eq('id', athleteId)
    } else {
      let highestDate: Date | null = null
      for (const p of remainingPayments) {
        const prod = Array.isArray(p.products) ? p.products[0] : p.products
        if (prod?.end_date) {
          const d = new Date(prod.end_date)
          if (!highestDate || d > highestDate) highestDate = d
        }
      }

      const today = new Date()
      if (highestDate) {
        const isSolventeNow = highestDate.getFullYear() > today.getFullYear() || 
                             (highestDate.getFullYear() === today.getFullYear() && highestDate.getMonth() >= today.getMonth())
        await supabase
          .from('athletes')
          .update({
            status: isSolventeNow ? 'Solvente' : 'Moroso',
            paid_until: highestDate.toISOString().split('T')[0]
          })
          .eq('id', athleteId)
      }
    }
  }

  // 4. Revalidar todas las pantallas financieras y de atletas
  if (athleteId) {
    revalidatePath(`/admin/athletes/${athleteId}`)
  }
  revalidatePath('/admin/athletes')
  revalidatePath('/admin/payments')
  revalidatePath('/admin/ledger')
  revalidatePath('/admin')
  revalidatePath('/portal/dashboard')
  revalidatePath('/portal/dashboard/pagos')

  return { success: true }
}

