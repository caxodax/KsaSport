'use server';

import { createClient } from '@/lib/supabase/server';
import { getServiceSupabase } from '@/lib/supabase';
import { sendSinglePush } from '@/lib/pushNotifications';

export async function savePushSubscription(data: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
  athleteId?: string | null;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const adminSupabase = getServiceSupabase();

    let athleteId = data.athleteId || null;

    // Si no vino athleteId explícito pero el usuario está autenticado, buscar su atleta
    if (!athleteId && user) {
      const { data: athlete } = await adminSupabase
        .from('athletes')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (athlete) {
        athleteId = athlete.id;
      }
    }

    const { error } = await adminSupabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint: data.endpoint,
          p256dh: data.p256dh,
          auth: data.auth,
          user_id: user?.id || null,
          athlete_id: athleteId,
          user_agent: data.userAgent || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

    if (error) {
      console.error('Error saving push subscription:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error in savePushSubscription:', err);
    return { success: false, error: err.message };
  }
}

export async function removePushSubscription(endpoint: string) {
  try {
    const adminSupabase = getServiceSupabase();
    await adminSupabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Enviar notificación de prueba al dispositivo actual del usuario
 */
export async function sendTestPushToSelf(data: {
  endpoint: string;
  p256dh: string;
  auth: string;
}) {
  return await sendSinglePush(data, {
    title: '¡Notificaciones Activas! ⚾🏆',
    body: 'Kasa Sports está conectado a tu dispositivo. Recibirás avisos de juegos y pagos.',
    url: '/portal/dashboard',
  });
}
