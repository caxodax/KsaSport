'use server'
import { getServiceSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createTeam(formData: FormData) {
  const name = formData.get('name') as string;
  const category = formData.get('category') as string;

  if (!name || !category) return { error: 'Nombre y categoría son requeridos' };

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('teams').insert([{ name, category }]);

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

  if (!id || !name || !category) return { error: 'Datos incompletos' };

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('teams').update({ name, category }).eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/teams');
  return { success: true };
}
