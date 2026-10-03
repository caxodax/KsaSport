'use server';

import { checkAdminPermission } from '@/lib/auth-admin';
import { sendTargetedPush } from '@/lib/pushNotifications';
import { revalidatePath } from 'next/cache';

export async function sendAdminBroadcast(formData: FormData) {
  const { user } = await checkAdminPermission('manage_settings');

  const title = (formData.get('title') as string)?.trim();
  const body = (formData.get('body') as string)?.trim();
  const url = (formData.get('url') as string)?.trim() || '/portal/dashboard';
  const targetType = (formData.get('targetType') as 'all' | 'team' | 'status' | 'athlete') || 'all';
  const targetFilter = (formData.get('targetFilter') as string)?.trim() || null;

  if (!title) {
    return { error: 'El título de la notificación es obligatorio.' };
  }
  if (!body) {
    return { error: 'El mensaje de la notificación es obligatorio.' };
  }

  const result = await sendTargetedPush({
    title,
    body,
    url,
    targetType,
    targetFilter,
    adminEmail: user?.email || 'Admin',
  });

  revalidatePath('/admin/notifications');

  return result;
}
