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
  try {
    await checkAdminPermission('manage_settings')

    const instagram_url = (formData.get('instagram_url') as string || '').trim()
    const tiktok_url = (formData.get('tiktok_url') as string || '').trim()
    const facebook_url = (formData.get('facebook_url') as string || '').trim()
    const rawWhatsapp = (formData.get('whatsapp_number') as string || '').trim()
    const whatsapp_number = rawWhatsapp.replace(/[^0-9]/g, '')

    const calendar_title = (formData.get('calendar_title') as string || 'Calendario Oficial de Ligas Activas').trim()
    const calendar_season = (formData.get('calendar_season') as string || 'Temporada 2026').trim()
    const calendar_description = (formData.get('calendar_description') as string || '').trim()
    const calendar_is_active = formData.get('calendar_is_active') === 'true'

    // Logotipo Oficial de la Marca
    const removeLogo = formData.get('remove_logo') === 'true'
    const newLogoFile = formData.get('logo') as File | null
    let brand_logo_url: string | undefined = undefined

    if (newLogoFile && newLogoFile.size > 0) {
      const uploadedLogoUrl = await uploadImageToCloudflare(newLogoFile, 'branding')
      if (uploadedLogoUrl) {
        brand_logo_url = uploadedLogoUrl
      }
    } else if (removeLogo) {
      brand_logo_url = 'https://pub-d9a707e799754eaf97bb7a295f4a8030.r2.dev/branding/ksasport-official-logo.png'
    }

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

    // PDF Oficial del Calendario
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

    // --- SECCIÓN 2: SCOUTING Y TRYOUTS ---
    const tryouts_title = (formData.get('tryouts_title') as string || 'Scouting y Tryouts Oficiales').trim()
    const tryouts_season = (formData.get('tryouts_season') as string || 'Temporada 2026').trim()
    const tryouts_description = (formData.get('tryouts_description') as string || '').trim()
    const tryouts_is_active = formData.get('tryouts_is_active') === 'true'

    let tryouts_images: string[] = []
    const tryoutsRetainedJson = formData.get('tryouts_retained_images') as string
    if (tryoutsRetainedJson) {
      try {
        tryouts_images = JSON.parse(tryoutsRetainedJson)
      } catch {
        tryouts_images = []
      }
    }

    const tryoutsNewFiles = formData.getAll('tryouts_new_images') as File[]
    for (const file of tryoutsNewFiles) {
      if (file && file.size > 0) {
        const uploadedUrl = await uploadImageToCloudflare(file, 'tryouts')
        if (uploadedUrl) {
          tryouts_images.push(uploadedUrl)
        }
      }
    }

    const tryoutsRemovePdf = formData.get('tryouts_remove_pdf') === 'true'
    const tryoutsNewPdfFile = formData.get('tryouts_pdf') as File | null
    let tryouts_pdf_url: string | null = undefined as any

    if (tryoutsNewPdfFile && tryoutsNewPdfFile.size > 0) {
      const uploadedPdfUrl = await uploadImageToCloudflare(tryoutsNewPdfFile, 'tryouts')
      if (uploadedPdfUrl) {
        tryouts_pdf_url = uploadedPdfUrl
      }
    } else if (tryoutsRemovePdf) {
      tryouts_pdf_url = null
    }

    // --- SECCIÓN 3: DRAFTS DE KICKINGBALL ---
    const drafts_title = (formData.get('drafts_title') as string || 'Drafts de Kickingball').trim()
    const drafts_season = (formData.get('drafts_season') as string || 'Temporada 2026').trim()
    const drafts_description = (formData.get('drafts_description') as string || '').trim()
    const drafts_is_active = formData.get('drafts_is_active') === 'true'

    let drafts_images: string[] = []
    const draftsRetainedJson = formData.get('drafts_retained_images') as string
    if (draftsRetainedJson) {
      try {
        drafts_images = JSON.parse(draftsRetainedJson)
      } catch {
        drafts_images = []
      }
    }

    const draftsNewFiles = formData.getAll('drafts_new_images') as File[]
    for (const file of draftsNewFiles) {
      if (file && file.size > 0) {
        const uploadedUrl = await uploadImageToCloudflare(file, 'drafts')
        if (uploadedUrl) {
          drafts_images.push(uploadedUrl)
        }
      }
    }

    const draftsRemovePdf = formData.get('drafts_remove_pdf') === 'true'
    const draftsNewPdfFile = formData.get('drafts_pdf') as File | null
    let drafts_pdf_url: string | null = undefined as any

    if (draftsNewPdfFile && draftsNewPdfFile.size > 0) {
      const uploadedPdfUrl = await uploadImageToCloudflare(draftsNewPdfFile, 'drafts')
      if (uploadedPdfUrl) {
        drafts_pdf_url = uploadedPdfUrl
      }
    } else if (draftsRemovePdf) {
      drafts_pdf_url = null
    }

    const supabase = getServiceSupabase()
    const updatePayload: Record<string, any> = {
      instagram_url,
      tiktok_url,
      facebook_url,
      whatsapp_number,
      calendar_title,
      calendar_season,
      calendar_description,
      calendar_images: images,
      calendar_is_active,
      tryouts_title,
      tryouts_season,
      tryouts_description,
      tryouts_images,
      tryouts_is_active,
      drafts_title,
      drafts_season,
      drafts_description,
      drafts_images,
      drafts_is_active,
      updated_at: new Date().toISOString()
    }

    if (calendar_pdf_url !== undefined) {
      updatePayload.calendar_pdf_url = calendar_pdf_url
    }

    if (tryouts_pdf_url !== undefined) {
      updatePayload.tryouts_pdf_url = tryouts_pdf_url
    }

    if (drafts_pdf_url !== undefined) {
      updatePayload.drafts_pdf_url = drafts_pdf_url
    }

    if (brand_logo_url !== undefined) {
      updatePayload.logo_url = brand_logo_url
    }

    let { data: updatedSettings, error } = await supabase
      .from('club_settings')
      .update(updatePayload)
      .eq('id', 1)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating portal and calendar settings:', error)
      if (error.code === '42703' || error.message?.includes('tryouts_') || error.message?.includes('drafts_') || error.message?.includes('tiktok_url')) {
        // Si faltan columnas de tryouts/drafts o tiktok en Supabase, reintentar sin ellas para no interrumpir
        const fallbackPayload = { ...updatePayload }
        delete fallbackPayload.tiktok_url
        delete fallbackPayload.tryouts_title
        delete fallbackPayload.tryouts_season
        delete fallbackPayload.tryouts_description
        delete fallbackPayload.tryouts_images
        delete fallbackPayload.tryouts_pdf_url
        delete fallbackPayload.tryouts_is_active
        delete fallbackPayload.drafts_title
        delete fallbackPayload.drafts_season
        delete fallbackPayload.drafts_description
        delete fallbackPayload.drafts_images
        delete fallbackPayload.drafts_pdf_url
        delete fallbackPayload.drafts_is_active

        const retry = await supabase
          .from('club_settings')
          .update(fallbackPayload)
          .eq('id', 1)
          .select('*')
          .single()

        if (!retry.error) {
          revalidatePath('/admin/settings')
          revalidatePath('/admin')
          revalidatePath('/calendario')
          revalidatePath('/portal')
          revalidatePath('/login')
          revalidatePath('/')
          return {
            error: 'Para activar las tarjetas autoadministrables de Tryouts y Drafts, por favor ejecuta el script migration_tryouts_and_drafts.sql en el SQL Editor de Supabase (las demás configuraciones se guardaron correctamente).'
          }
        }
      }

      if (error.code === '42703' || error.message.includes('logo_url')) {
        return {
          error: 'La columna de logotipo aún no existe en la base de datos. Por favor ejecuta el script migration_brand_logo.sql en el SQL Editor de Supabase.'
        }
      }
      return { error: error.message }
    }

    revalidatePath('/admin/settings')
    revalidatePath('/admin')
    revalidatePath('/calendario')
    revalidatePath('/portal')
    revalidatePath('/login')
    revalidatePath('/portal/login')
    revalidatePath('/')
    return { success: true, settings: updatedSettings }
  } catch (err: any) {
    if (err?.digest?.startsWith('NEXT_REDIRECT') || err?.message === 'NEXT_REDIRECT') {
      throw err
    }
    console.error('Error no controlado en updatePortalAndCalendarSettings:', err)
    return { error: err?.message || 'Error inesperado al guardar la configuración.' }
  }
}


