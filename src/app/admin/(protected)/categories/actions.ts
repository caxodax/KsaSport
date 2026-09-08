'use server'
import { getServiceSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { normalizePositions } from '@/lib/positions';

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string;
  const positionsRaw = formData.get('positions') as string;
  const positions = normalizePositions(positionsRaw);

  if (!name) return { error: 'El nombre de la categoría es requerido' };

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('categories').insert([{ name, positions }]);

  if (error) {
    if (error.code === '23505') return { error: 'Esta categoría ya existe.' };
    return { error: error.message };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/admin/teams');
  revalidatePath('/admin/athletes');
  return { success: true };
}

export async function deleteCategory(id: string) {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('categories').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/admin/teams');
  revalidatePath('/admin/athletes');
  return { success: true };
}

export async function updateCategory(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const positionsRaw = formData.get('positions') as string;

  if (!id || !name) return { error: 'Datos incompletos' };

  const updateData: { name: string; positions?: any } = { name };
  if (positionsRaw !== null && positionsRaw !== undefined) {
    updateData.positions = normalizePositions(positionsRaw);
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('categories').update(updateData).eq('id', id);

  if (error) {
    if (error.code === '23505') return { error: 'Esta categoría ya existe.' };
    return { error: error.message };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/admin/teams');
  revalidatePath('/admin/athletes');
  return { success: true };
}

