'use server';

import { createClient } from '@/lib/supabase/server';
import { getServiceSupabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type AuthResult = {
  error?: string;
  successMessage?: string;
};

export async function login(formData: FormData): Promise<AuthResult | undefined> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Por favor, ingresa tu correo y contraseña.' };
  }

  const supabase = await createClient();

  // 1. Iniciar sesión en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: 'Credenciales inválidas o correo no registrado.' };
  }

  const userId = authData.user.id;
  const adminSupabase = getServiceSupabase();

  // 2. Consultar roles concurrentemente (Admin y Atleta)
  const [adminRes, athleteRes] = await Promise.all([
    adminSupabase
      .from('admin_users')
      .select('id, role_id')
      .eq('id', userId)
      .maybeSingle(),
    adminSupabase
      .from('athletes')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const isAdmin = !!adminRes.data;
  const isAthlete = !!athleteRes.data;

  // 3. Revalidar rutas para refrescar sesión
  revalidatePath('/', 'layout');

  // 4. Enrutamiento inteligente según roles
  if (isAdmin && isAthlete) {
    // Si tiene ambos perfiles (ej. Directivo/Técnico que también es jugador)
    redirect('/gateway');
  }

  if (isAdmin) {
    redirect('/admin');
  }

  if (isAthlete) {
    redirect('/portal/dashboard');
  }

  // Si no tiene ningún rol vinculado (usuario registrado recientemente)
  redirect('/portal/link-profile');
}

export async function signup(formData: FormData): Promise<AuthResult | undefined> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Por favor, completa todos los campos requeridos.' };
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  const supabase = await createClient();

  // 1. Crear usuario en Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // 2. Intentar login inmediato (si la confirmación de email no es estricta)
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return {
      successMessage: 'Cuenta creada exitosamente. Por favor, revisa tu correo para verificar tu cuenta antes de iniciar sesión.',
    };
  }

  // 3. Redirigir a vincular perfil de atleta
  revalidatePath('/', 'layout');
  redirect('/portal/link-profile');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
