'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type ResetResult = {
  error?: string;
  success?: boolean;
};

export async function updatePassword(formData: FormData): Promise<ResetResult | undefined> {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  if (!password || !confirmPassword) {
    return { error: 'Por favor, completa ambos campos.' };
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' };
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error('Error updating user password:', error);
    return { error: error.message || 'No se pudo actualizar la contraseña. El enlace puede haber expirado.' };
  }

  revalidatePath('/', 'layout');
  redirect('/login?reset=success');
}
