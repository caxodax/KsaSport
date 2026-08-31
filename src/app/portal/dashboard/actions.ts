'use server'

import { getServiceSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { uploadImageToCloudflare } from '@/lib/cloudflare';

export async function updateAvatar(athleteId: string, formData: FormData) {
  const file = formData.get('avatar') as File;
  if (!file || file.size === 0) {
    return { error: 'No se seleccionó ninguna imagen.' };
  }

  // Verificar tipo de archivo
  if (!file.type.startsWith('image/')) {
    return { error: 'El archivo debe ser una imagen válida.' };
  }

  // Verificar tamaño (ej: máximo 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'La imagen no debe pesar más de 5MB.' };
  }

  try {
    const publicUrl = await uploadImageToCloudflare(file, 'avatares');
    
    if (!publicUrl) {
      return { error: 'Error al subir la imagen al servidor.' };
    }

    const supabase = getServiceSupabase();
    const { error } = await supabase
      .from('athletes')
      .update({ avatar_url: publicUrl })
      .eq('id', athleteId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/portal/dashboard');
    revalidatePath('/portal/verify/[id]', 'page');
    return { success: true, avatar_url: publicUrl };
  } catch (err: any) {
    return { error: err.message || 'Error desconocido' };
  }
}
