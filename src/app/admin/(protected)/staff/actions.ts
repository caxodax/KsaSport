'use server'
import { getServiceSupabase } from '@/lib/supabase';
import { checkAdminPermission } from '@/lib/auth-admin';
import { revalidatePath } from 'next/cache';
import { cleanCedula } from '@/lib/cedula';

export async function createStaff(formData: FormData) {
  await checkAdminPermission('manage_catalog');
  const name = formData.get('name') as string;
  const cedula = cleanCedula(formData.get('cedula') as string);
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
  await checkAdminPermission('manage_catalog');
  const supabase = getServiceSupabase();
  const { error } = await supabase.from('staff').delete().eq('id', id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/admin/staff');
  return { success: true };
}

export async function updateStaff(formData: FormData) {
  await checkAdminPermission('manage_catalog');
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const cedula = cleanCedula(formData.get('cedula') as string);
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

export async function saveStaffAccessAndPermissions(payload: {
  staffId: string;
  enableAccess: boolean;
  email?: string;
  password?: string;
  permissions: string[];
}): Promise<{ success?: boolean; error?: string }> {
  await checkAdminPermission('manage_roles');
  const supabase = getServiceSupabase();

  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('id, name, role, user_id, team_id')
    .eq('id', payload.staffId)
    .single();

  if (staffError || !staff) {
    return { error: 'Miembro del staff no encontrado.' };
  }

  // 1. Si se desactiva el acceso web
  if (!payload.enableAccess) {
    const roleId = `staff_${staff.id}`;
    await supabase.from('admin_roles').delete().eq('id', roleId);
    if (staff.user_id) {
      // Eliminar de admin_users
      await supabase.from('admin_users').delete().eq('id', staff.user_id);
      // Desvincular en staff
      await supabase.from('staff').update({ user_id: null }).eq('id', staff.id);
    }
    revalidatePath('/admin/staff');
    revalidatePath('/admin/users');
    return { success: true };
  }

  // 2. Si se habilita o actualiza el acceso web
  const roleId = `staff_${staff.id}`;
  const permissions = payload.permissions?.length > 0 ? payload.permissions : ['view_lineup', 'view_roster'];
  
  // 2.1 Asegurar que el rol personalizado exista en admin_roles con los permisos seleccionados
  const { error: roleError } = await supabase.from('admin_roles').upsert({
    id: roleId,
    name: `${staff.role}: ${staff.name}`,
    permissions
  }, { onConflict: 'id' });

  if (roleError) {
    console.error('Error upserting admin_roles:', roleError);
    return { error: `Error configurando rol: ${roleError.message}` };
  }

  const email = payload.email?.trim().toLowerCase();
  let targetUserId = staff.user_id;

  // 2.2 Si el Super Admin suministró manualmente credenciales
  if (email && !targetUserId) {
    const { data: authList } = await supabase.auth.admin.listUsers();
    const existingAuthUser = authList?.users?.find(u => u.email?.toLowerCase() === email);

    if (existingAuthUser) {
      targetUserId = existingAuthUser.id;
      if (payload.password && payload.password.length >= 6) {
        await supabase.auth.admin.updateUserById(targetUserId, { password: payload.password });
      }
    } else if (payload.password && payload.password.length >= 6) {
      const { data: newAuthData, error: createAuthError } = await supabase.auth.admin.createUser({
        email,
        password: payload.password,
        email_confirm: true,
        user_metadata: { name: staff.name }
      });

      if (!createAuthError && newAuthData?.user) {
        targetUserId = newAuthData.user.id;
      }
    }

    if (targetUserId) {
      await supabase.from('staff').update({ user_id: targetUserId }).eq('id', staff.id);
    }
  } else if (targetUserId) {
    // Si ya tenía user_id, actualizar email y/o password si se suministraron
    const updates: any = {};
    if (payload.password && payload.password.length >= 6) updates.password = payload.password;
    if (email) updates.email = email;

    if (Object.keys(updates).length > 0) {
      await supabase.auth.admin.updateUserById(targetUserId, updates);
    }
  }

  // 2.3 Si ya tiene cuenta vinculada (sea manual o por auto-registro), sincronizar admin_users
  if (targetUserId) {
    await supabase.from('admin_users').upsert({
      id: targetUserId,
      email: email || staff.name,
      role_id: roleId
    }, { onConflict: 'id' });
  }

  revalidatePath('/admin/staff');
  revalidatePath('/admin/users');
  return { success: true };
}

export async function revokeStaffAccess(staffId: string): Promise<{ success?: boolean; error?: string }> {
  await checkAdminPermission('manage_roles');
  const supabase = getServiceSupabase();

  const { data: staff, error: fetchErr } = await supabase
    .from('staff')
    .select('id, user_id')
    .eq('id', staffId)
    .single();

  if (fetchErr) {
    return { error: 'No se encontró el miembro del staff.' };
  }

  const roleId = `staff_${staffId}`;
  await supabase.from('admin_roles').delete().eq('id', roleId);

  if (staff?.user_id) {
    const { error: delErr } = await supabase.from('admin_users').delete().eq('id', staff.user_id);
    if (delErr) {
      return { error: `Error eliminando permisos: ${delErr.message}` };
    }
    const { error: updErr } = await supabase.from('staff').update({ user_id: null }).eq('id', staffId);
    if (updErr) {
      return { error: `Error desvinculando staff: ${updErr.message}` };
    }
  }

  revalidatePath('/admin/staff');
  revalidatePath('/admin/users');
  return { success: true };
}

