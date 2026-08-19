'use server'
import { getServiceSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

export async function createStaff(formData: FormData) {
  const name = formData.get('name') as string;
  const cedula = formData.get('cedula') as string;
  const phone = formData.get('phone') as string;
  const team_id = formData.get('team_id') as string;
  const role = formData.get('role') as string;

  if (!name || !cedula || !role) return { error: 'Nombre, cédula y rol son requeridos' };

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('staff').insert([{ 
    name, 
    cedula, 
    phone, 
    team_id: team_id || null, 
    role 
  }]);

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe un miembro del staff con esa cédula' };
    }
    return { error: error.message };
  }

  revalidatePath('/admin/staff');
  return { success: true };
}

export async function deleteStaff(id: string) {
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('staff').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/staff');
  return { success: true };
}

export async function updateStaff(formData: FormData) {
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const cedula = formData.get('cedula') as string;
  const phone = formData.get('phone') as string;
  const team_id = formData.get('team_id') as string;
  const role = formData.get('role') as string;

  if (!id || !name || !cedula || !role) return { error: 'Datos incompletos' };

  const supabase = getServiceSupabase();
  const { error } = await supabase.from('staff').update({ 
    name, 
    cedula, 
    phone, 
    team_id: team_id || null, 
    role 
  }).eq('id', id);

  if (error) {
    if (error.code === '23505') {
      return { error: 'Ya existe otro miembro del staff con esa cédula' };
    }
    return { error: error.message };
  }

  revalidatePath('/admin/staff');
  return { success: true };
}
