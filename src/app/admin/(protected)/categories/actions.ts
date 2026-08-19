'use server'
import { getServiceSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string;

  if (!name) return { error: 'El nombre de la categoría es requerido' };

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('categories').insert([{ name }]);

  if (error) {
    if (error.code === '23505') return { error: 'Esta categoría ya existe.' };
    return { error: error.message };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/admin/teams'); // Refresca los selectores de equipos
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
  return { success: true };
}

export async function updateCategory(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;

  if (!id || !name) return { error: 'Datos incompletos' };

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('categories').update({ name }).eq('id', id);

  if (error) {
    if (error.code === '23505') return { error: 'Esta categoría ya existe.' };
    return { error: error.message };
  }

  revalidatePath('/admin/categories');
  revalidatePath('/admin/teams');
  return { success: true };
}
