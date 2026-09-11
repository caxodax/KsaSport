'use server';

import { getServiceSupabase } from '@/lib/supabase';
import { checkAdminPermission } from '@/lib/auth-admin';
import { revalidatePath } from 'next/cache';

/**
 * Crea un nuevo usuario en Supabase Auth y le asigna su rol administrativo.
 */
export async function createAdminUser(formData: FormData) {
  const { user: callerUser } = await checkAdminPermission('manage_roles');

  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const roleId = (formData.get('role_id') as string)?.trim();
  const teamId = (formData.get('team_id') as string)?.trim() || null;

  if (!email || !password || !roleId) {
    return { error: 'Correo, contraseña y rol son obligatorios.' };
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const adminSupabase = getServiceSupabase();

  // 1. Crear el usuario en Supabase Auth con confirmación automática
  let targetUserId: string;

  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: name || email.split('@')[0] }
  });

  if (authError) {
    // Si el usuario ya existe en Auth, verificar si ya tiene rol administrativo
    if (authError.message.includes('already been registered') || authError.code === 'email_exists') {
      const { data: existingAuthUser } = await adminSupabase
        .from('admin_users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingAuthUser) {
        return { error: 'Este usuario ya tiene acceso al panel administrativo.' };
      }

      // Buscar el ID en auth.users
      const { data: usersList } = await adminSupabase.auth.admin.listUsers();
      const matched = usersList?.users?.find(u => u.email?.toLowerCase() === email);

      if (!matched) {
        return { error: `No se pudo registrar: ${authError.message}` };
      }

      targetUserId = matched.id;
    } else {
      return { error: `Error al crear usuario en autenticación: ${authError.message}` };
    }
  } else if (!authData.user) {
    return { error: 'No se pudo crear la cuenta de usuario.' };
  } else {
    targetUserId = authData.user.id;
  }

  // 2. Insertar en la tabla admin_users
  const { error: adminError } = await adminSupabase.from('admin_users').upsert({
    id: targetUserId,
    email,
    role_id: roleId,
  });

  if (adminError) {
    return { error: `Error al registrar rol administrativo: ${adminError.message}` };
  }

  // 3. Si el rol es 'coach' y se seleccionó un equipo, vincular en la tabla staff
  if (roleId === 'coach') {
    const { data: existingStaff } = await adminSupabase
      .from('staff')
      .select('id, name')
      .eq('user_id', targetUserId)
      .single();

    if (existingStaff) {
      await adminSupabase
        .from('staff')
        .update({ team_id: teamId, name: name || existingStaff.name })
        .eq('id', existingStaff.id);
    } else {
      // Crear ficha en staff para que sus atletas y lineup se filtren por su equipo
      const pseudoCedula = `ADM-${Date.now().toString().slice(-6)}`;
      await adminSupabase.from('staff').insert({
        name: name || email.split('@')[0],
        cedula: pseudoCedula,
        role: 'Entrenador',
        team_id: teamId,
        user_id: targetUserId
      });
    }
  }

  // Obtener rol enriquecido
  const { data: roleInfo } = await adminSupabase
    .from('admin_roles')
    .select('id, name, permissions')
    .eq('id', roleId)
    .single();

  // Obtener staff y equipo vinculado
  let staffPayload = null;
  const { data: staffData } = await adminSupabase
    .from('staff')
    .select('id, name, team_id, teams(id, name, category)')
    .eq('user_id', targetUserId)
    .single();

  if (staffData) {
    staffPayload = {
      id: staffData.id,
      name: staffData.name,
      team_id: staffData.team_id,
      teams: Array.isArray(staffData.teams) ? staffData.teams[0] : staffData.teams,
    };
  }

  const savedUser = {
    id: targetUserId,
    email,
    role_id: roleId,
    created_at: new Date().toISOString(),
    admin_roles: roleInfo || { id: roleId, name: roleId },
    staff: staffPayload,
  };

  revalidatePath('/admin/users');
  revalidatePath('/admin/staff');
  return { success: true, user: savedUser };
}

/**
 * Actualiza el rol o equipo de un usuario existente.
 */
export async function updateAdminUser(formData: FormData) {
  const { user: callerUser } = await checkAdminPermission('manage_roles');

  const userId = formData.get('user_id') as string;
  const roleId = formData.get('role_id') as string;
  const teamId = (formData.get('team_id') as string)?.trim() || null;
  const name = (formData.get('name') as string)?.trim();

  if (!userId || !roleId) {
    return { error: 'Datos incompletos.' };
  }

  // Seguridad: El usuario activo no puede degradar su propio rol de superadmin
  if (userId === callerUser.id && roleId !== 'superadmin') {
    return { error: 'Por seguridad, no puedes removerte tu propio rol de Súper Administrador.' };
  }

  const adminSupabase = getServiceSupabase();

  // 1. Actualizar rol en admin_users
  const { error: updateError } = await adminSupabase
    .from('admin_users')
    .update({ role_id: roleId })
    .eq('id', userId);

  if (updateError) {
    return { error: `Error al actualizar rol: ${updateError.message}` };
  }

  // 2. Si es coach o tiene equipo, sincronizar en staff
  if (roleId === 'coach') {
    const { data: existingStaff } = await adminSupabase
      .from('staff')
      .select('id, name')
      .eq('user_id', userId)
      .single();

    if (existingStaff) {
      await adminSupabase
        .from('staff')
        .update({
          team_id: teamId,
          ...(name ? { name } : {})
        })
        .eq('id', existingStaff.id);
    } else {
      const pseudoCedula = `ADM-${Date.now().toString().slice(-6)}`;
      await adminSupabase.from('staff').insert({
        name: name || 'Entrenador',
        cedula: pseudoCedula,
        role: 'Entrenador',
        team_id: teamId,
        user_id: userId
      });
    }
  } else if (teamId) {
    // Si se asignó equipo aunque tenga otro rol, actualizar staff si existe
    await adminSupabase
      .from('staff')
      .update({ team_id: teamId })
      .eq('user_id', userId);
  }

  // Obtener rol enriquecido
  const { data: roleInfo } = await adminSupabase
    .from('admin_roles')
    .select('id, name, permissions')
    .eq('id', roleId)
    .single();

  const { data: currentAdmin } = await adminSupabase
    .from('admin_users')
    .select('email, created_at')
    .eq('id', userId)
    .single();

  let staffPayload = null;
  const { data: staffData } = await adminSupabase
    .from('staff')
    .select('id, name, team_id, teams(id, name, category)')
    .eq('user_id', userId)
    .single();

  if (staffData) {
    staffPayload = {
      id: staffData.id,
      name: staffData.name,
      team_id: staffData.team_id,
      teams: Array.isArray(staffData.teams) ? staffData.teams[0] : staffData.teams,
    };
  }

  const updatedUser = {
    id: userId,
    email: currentAdmin?.email || '',
    role_id: roleId,
    created_at: currentAdmin?.created_at || new Date().toISOString(),
    admin_roles: roleInfo || { id: roleId, name: roleId },
    staff: staffPayload,
  };

  revalidatePath('/admin/users');
  revalidatePath('/admin/staff');
  revalidatePath('/admin/athletes');
  return { success: true, user: updatedUser };
}

/**
 * Restablece la contraseña de un usuario desde la interfaz.
 */
export async function resetAdminPassword(formData: FormData) {
  await checkAdminPermission('manage_roles');

  const userId = formData.get('user_id') as string;
  const newPassword = formData.get('new_password') as string;

  if (!userId || !newPassword) {
    return { error: 'Usuario y nueva contraseña requeridos.' };
  }

  if (newPassword.length < 6) {
    return { error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
  }

  const adminSupabase = getServiceSupabase();

  const { error } = await adminSupabase.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (error) {
    return { error: `Error al cambiar contraseña: ${error.message}` };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

/**
 * Revoca el acceso administrativo de un usuario (Opción A: elimina de admin_users y desvincula staff,
 * preservando la integridad de datos históricos).
 */
export async function revokeAdminUser(targetUserId: string) {
  const { user: callerUser } = await checkAdminPermission('manage_roles');

  if (targetUserId === callerUser.id) {
    return { error: 'Por seguridad, no puedes revocar tu propio acceso de Súper Administrador.' };
  }

  const adminSupabase = getServiceSupabase();

  // 1. Eliminar de admin_users (revoca permiso al panel)
  const { error: deleteError } = await adminSupabase
    .from('admin_users')
    .delete()
    .eq('id', targetUserId);

  if (deleteError) {
    return { error: `Error al revocar acceso: ${deleteError.message}` };
  }

  // 2. Desvincular de la tabla staff si estaba asociado
  await adminSupabase
    .from('staff')
    .update({ user_id: null })
    .eq('user_id', targetUserId);

  revalidatePath('/admin/users');
  revalidatePath('/admin/staff');
  return { success: true };
}
