'use server'

import { getServiceSupabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

/**
 * Actualiza la regla general / global por defecto del club.
 */
export async function updateGlobalSettings(formData: FormData) {
  const grace_period_days = Number(formData.get('grace_period_days'))
  const penalty_amount = Number(formData.get('penalty_amount'))

  if (isNaN(grace_period_days) || grace_period_days < 0) {
    return { error: 'Los días de gracia deben ser un número válido mayor o igual a 0.' }
  }

  if (isNaN(penalty_amount) || penalty_amount < 0) {
    return { error: 'El monto de penalidad debe ser un número válido mayor o igual a 0.' }
  }

  const supabase = getServiceSupabase()
  const { error } = await supabase
    .from('club_settings')
    .update({ 
      grace_period_days, 
      penalty_amount, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', 1)

  if (error) {
    console.error('Error updating global settings:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/admin')
  revalidatePath('/portal/dashboard/pagos')
  return { success: true }
}

/**
 * Actualiza o restablece la política de morosidad para una categoría específica.
 */
export async function updateCategoryPenalty(
  categoryId: string,
  useCustom: boolean,
  grace_period_days?: number | null,
  penalty_amount?: number | null
) {
  if (!categoryId) {
    return { error: 'ID de categoría no válido.' }
  }

  const supabase = getServiceSupabase()

  const updatePayload: {
    grace_period_days: number | null
    penalty_amount: number | null
  } = {
    grace_period_days: useCustom && grace_period_days !== undefined && grace_period_days !== null ? Number(grace_period_days) : null,
    penalty_amount: useCustom && penalty_amount !== undefined && penalty_amount !== null ? Number(penalty_amount) : null
  }

  const { error } = await supabase
    .from('categories')
    .update(updatePayload)
    .eq('id', categoryId)

  if (error) {
    console.error('Error updating category penalty:', error)
    // Si la columna no existe aún, alertamos amigablemente
    if (error.code === '42703' || error.message.includes('column')) {
      return { 
        error: 'Las columnas de penalidad por categoría aún no existen en la base de datos. Por favor ejecuta el script migration_category_penalties.sql en el editor de Supabase.' 
      }
    }
    return { error: error.message }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/admin')
  revalidatePath('/portal/dashboard/pagos')
  return { success: true }
}
