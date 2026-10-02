'use server'

import { getServiceSupabase } from '@/lib/supabase'
import { checkAdminPermission } from '@/lib/auth-admin'
import { revalidatePath } from 'next/cache'
import { uploadImageToCloudflare } from '@/lib/cloudflare'

/**
 * Actualiza la regla general / global por defecto del club.
 */
export async function updateGlobalSettings(formData: FormData) {
  await checkAdminPermission('manage_settings')
  const grace_period_days = Number(formData.get('grace_period_days'))
  const penalty_amount = Number(formData.get('penalty_amount'))

  if (isNaN(grace_period_days) || grace_period_days < 0) {
    return { error: 'Los días de gracia deben ser un número válido mayor o igual a 0.' }
  }

  if (isNaN(penalty_amount) || penalty_amount < 0) {
    return { error: 'El monto de penalidad debe ser un número válido mayor o igual a 0.' }
  }

  const supabase = getServiceSupabase()
  const { data: updatedSettings, error } = await supabase
    .from('club_settings')
    .update({ 
      grace_period_days, 
      penalty_amount, 
      updated_at: new Date().toISOString() 
    })
    .eq('id', 1)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating global settings:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/admin')
  revalidatePath('/portal/dashboard/pagos')
  return { success: true, settings: updatedSettings }
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
  await checkAdminPermission('manage_settings')
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
  revalidatePath('/admin/payments')
  revalidatePath('/portal/dashboard/pagos')
  return { success: true }
}

/**
 * Actualiza la configuración de redes sociales, WhatsApp y el calendario oficial de ligas activas.
 */
export async function updatePortalAndCalendarSettings(formData: FormData) {
  await checkAdminPermission('manage_settings')

  const instagram_url = (formData.get('instagram_url') as string || '').trim()
  const facebook_url = (formData.get('facebook_url') as string || '').trim()
  const rawWhatsapp = (formData.get('whatsapp_number') as string || '').trim()
  const whatsapp_number = rawWhatsapp.replace(/[^0-9]/g, '')

  const calendar_title = (formData.get('calendar_title') as string || 'Calendario Oficial de Ligas Activas').trim()
  const calendar_season = (formData.get('calendar_season') as string || 'Temporada 2026').trim()
  const calendar_description = (formData.get('calendar_description') as string || '').trim()
  const calendar_is_active = formData.get('calendar_is_active') === 'true'

  // Imágenes existentes conservadas
  let images: string[] = []
  const retainedJson = formData.get('retained_images') as string
  if (retainedJson) {
    try {
      images = JSON.parse(retainedJson)
    } catch {
      images = []
    }
  }

  // Nuevas imágenes subidas
  const newImageFiles = formData.getAll('new_images') as File[]
  for (const file of newImageFiles) {
    if (file && file.size > 0) {
      const uploadedUrl = await uploadImageToCloudflare(file, 'calendario')
      if (uploadedUrl) {
        images.push(uploadedUrl)
      }
    }
  }

  // PDF Oficial
  const removePdf = formData.get('remove_pdf') === 'true'
  const newPdfFile = formData.get('calendar_pdf') as File | null
  let calendar_pdf_url: string | null = undefined as any

  if (newPdfFile && newPdfFile.size > 0) {
    const uploadedPdfUrl = await uploadImageToCloudflare(newPdfFile, 'calendario')
    if (uploadedPdfUrl) {
      calendar_pdf_url = uploadedPdfUrl
    }
  } else if (removePdf) {
    calendar_pdf_url = null
  }

  const supabase = getServiceSupabase()
  const updatePayload: Record<string, any> = {
    instagram_url,
    facebook_url,
    whatsapp_number,
    calendar_title,
    calendar_season,
    calendar_description,
    calendar_images: images,
    calendar_is_active,
    updated_at: new Date().toISOString()
  }

  if (calendar_pdf_url !== undefined) {
    updatePayload.calendar_pdf_url = calendar_pdf_url
  }

  const { data: updatedSettings, error } = await supabase
    .from('club_settings')
    .update(updatePayload)
    .eq('id', 1)
    .select('*')
    .single()

  if (error) {
    console.error('Error updating portal and calendar settings:', error)
    return { error: error.message }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/calendario')
  revalidatePath('/')
  return { success: true, settings: updatedSettings }
}


