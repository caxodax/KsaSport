'use server'

import { getServiceSupabase } from '@/lib/supabase'
import { checkAdminPermission } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'
import { sendAthletePush } from '@/lib/pushNotifications'
import { syncAthleteCoverage } from '@/lib/athleteCoverage'

export async function approvePayment(paymentId: string, athleteId: string, concept: string) {
  const { user } = await checkAdminPermission('view_finances')
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
  const updatePayload: any = { 
    status: 'Completado',
    approved_by: user?.id || null,
    approved_by_email: user?.email || null,
    approved_at: new Date().toISOString()
  }

  let { data: updatedPayment, error: paymentError } = await supabase
    .from('payments')
    .update(updatePayload)
    .eq('id', paymentId)
    .eq('status', 'Pendiente')
    .select('id')
    .single()

  // Fallback si las columnas de auditoría aún no existen en DB
  if (paymentError && paymentError.message.includes('approved_by')) {
    delete updatePayload.approved_by;
    delete updatePayload.approved_by_email;
    delete updatePayload.approved_at;
    const retry = await supabase
      .from('payments')
      .update(updatePayload)
      .eq('id', paymentId)
      .eq('status', 'Pendiente')
      .select('id')
      .single()
    updatedPayment = retry.data;
    paymentError = retry.error;
  }

  if (paymentError || !updatedPayment) {
    return { error: 'Este pago ya fue procesado o no se encuentra en estado Pendiente.' }
  }

  // 3. Si el concepto incluye "Mensualidad", actualizar el estatus de la atleta de forma unificada
  if ((concept.toLowerCase().includes('mensualidad') || concept.toLowerCase().includes('cuota')) && payment) {
    await syncAthleteCoverage(athleteId, supabase);
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
  const { user } = await checkAdminPermission('view_finances')
  const supabase = getServiceSupabase()
  
  // Obtener atleta_id antes de actualizar
  const { data: payment } = await supabase
    .from('payments')
    .select('athlete_id, amount')
    .eq('id', paymentId)
    .single()

  const updatePayload: any = { 
    status: 'Rechazado',
    voided_by: user?.id || null,
    voided_by_email: user?.email || null,
    voided_at: new Date().toISOString()
  }

  let { data: updatedPayment, error } = await supabase
    .from('payments')
    .update(updatePayload)
    .eq('id', paymentId)
    .eq('status', 'Pendiente')
    .select('id')
    .single()

  if (error && error.message.includes('voided_by')) {
    delete updatePayload.voided_by;
    delete updatePayload.voided_by_email;
    delete updatePayload.voided_at;
    const retry = await supabase
      .from('payments')
      .update(updatePayload)
      .eq('id', paymentId)
      .eq('status', 'Pendiente')
      .select('id')
      .single()
    updatedPayment = retry.data;
    error = retry.error;
  }

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
  const { user, permissions } = await checkAdminPermission()
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

  // 2. Anular el pago actualizando su estatus y registrando auditoría
  const voidConcept = reason?.trim() 
    ? `${payment.concept} [ANULADO: ${reason.trim()}]` 
    : `${payment.concept} [ANULADO]`

  const updatePayload: any = { 
    status: 'Anulado',
    concept: voidConcept,
    voided_by: user?.id || null,
    voided_by_email: user?.email || null,
    voided_at: new Date().toISOString()
  }

  let { error: updateError } = await supabase
    .from('payments')
    .update(updatePayload)
    .eq('id', paymentId)

  // Fallback si las columnas de auditoría aún no existen en DB
  if (updateError && updateError.message.includes('voided_by')) {
    delete updatePayload.voided_by;
    delete updatePayload.voided_by_email;
    delete updatePayload.voided_at;
    const retry = await supabase
      .from('payments')
      .update(updatePayload)
      .eq('id', paymentId)
    updateError = retry.error;
  }

  if (updateError) {
    return { error: updateError.message || 'Error al anular el pago.' }
  }

  const athleteId = payment.athlete_id

  // 3. Sincronización automática de estatus y cobertura de la atleta si el pago era una Mensualidad
  if ((payment.concept.toLowerCase().includes('mensualidad') || payment.concept.toLowerCase().includes('cuota')) && athleteId) {
    await syncAthleteCoverage(athleteId, supabase);
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

