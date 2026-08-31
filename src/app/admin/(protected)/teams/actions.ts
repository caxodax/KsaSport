'use server'
import { getServiceSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { uploadImageToCloudflare } from '@/lib/cloudflare';

export async function createTeam(formData: FormData) {
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const logoFile = formData.get('logo') as File | null;

  if (!name || !category) return { error: 'Nombre y categoría son requeridos' };

  let logo_url = null;
  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 5 * 1024 * 1024) return { error: 'El logo no debe pesar más de 5MB.' };
    logo_url = await uploadImageToCloudflare(logoFile, 'teams');
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('teams').insert([{ name, category, logo_url }]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/teams');
  return { success: true };
}

export async function deleteTeam(id: string) {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('teams').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/teams');
  return { success: true };
}

export async function updateTeam(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;
  const logoFile = formData.get('logo') as File | null;

  if (!id || !name || !category) return { error: 'Datos incompletos' };

  const updateData: any = { name, category };

  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 5 * 1024 * 1024) return { error: 'El logo no debe pesar más de 5MB.' };
    const publicUrl = await uploadImageToCloudflare(logoFile, 'teams');
    if (publicUrl) {
      updateData.logo_url = publicUrl;
    }
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('teams').update(updateData).eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/teams');
  return { success: true };
}
