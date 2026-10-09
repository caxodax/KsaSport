import webpush from 'web-push';
import { getServiceSupabase } from './supabase';

// Inicializar Web Push con VAPID
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const privateKey = process.env.VAPID_PRIVATE_KEY || '';
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@ksasports.com';

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

export interface TargetPushOptions extends PushPayload {
  targetType: 'all' | 'team' | 'status' | 'athlete';
  targetFilter?: string | null;
  adminEmail?: string | null;
}

/**
 * Enviar notificación a una suscripción individual.
 * Si la suscripción expiró o fue revocada en el teléfono, la elimina de la BD.
 */
export async function sendSinglePush(subscription: {
  id?: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}, payload: PushPayload) {
  if (!publicKey || !privateKey) {
    console.error('VAPID keys not configured in environment');
    return { success: false, error: 'VAPID no configurado' };
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(
      pushSubscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || '/portal',
        icon: payload.icon || '/icon.png',
        badge: payload.badge || '/apple-touch-icon.png',
        tag: payload.tag || 'ksasport-alert',
      })
    );
    return { success: true };
  } catch (error: any) {
    // Si el navegador reporta 404 o 410 Gone (la suscripción ya no existe en el dispositivo)
    if (error.statusCode === 404 || error.statusCode === 410) {
      const supabase = getServiceSupabase();
      await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscription.endpoint);
    }
    return { success: false, error: error.message || 'Error de entrega' };
  }
}

/**
 * Enviar notificación segmentada o masiva desde el Admin
 */
export async function sendTargetedPush(options: TargetPushOptions) {
  const supabase = getServiceSupabase();
  const { targetType, targetFilter, title, body, url, adminEmail } = options;

  let query = supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth, athlete_id');

  if (targetType === 'athlete' && targetFilter) {
    query = query.eq('athlete_id', targetFilter);
  } else if (targetType === 'team' && targetFilter) {
    // Obtener atletas del equipo
    const { data: teamAthletes } = await supabase
      .from('athletes')
      .select('id')
      .eq('team_id', targetFilter);
    const athleteIds = teamAthletes?.map((a) => a.id) || [];
    if (athleteIds.length === 0) {
      return { success: true, sentCount: 0, totalTargeted: 0 };
    }
    query = query.in('athlete_id', athleteIds);
  } else if (targetType === 'status' && targetFilter) {
    let athleteIds: string[] = [];

    if (targetFilter === 'Solvente') {
      // Atletas solventes Y atletas exonerados (con alianza o con exoneraciones registradas)
      const [{ data: solventes }, { data: alianzas }, { data: exemptRecords }] = await Promise.all([
        supabase.from('athletes').select('id').eq('status', 'Solvente'),
        supabase.from('athletes').select('id').eq('has_alliance', true),
        supabase.from('athlete_exemptions').select('athlete_id'),
      ]);

      const targetIdSet = new Set<string>();
      solventes?.forEach((a) => targetIdSet.add(a.id));
      alianzas?.forEach((a) => targetIdSet.add(a.id));
      exemptRecords?.forEach((e) => targetIdSet.add(e.athlete_id));

      athleteIds = Array.from(targetIdSet);
    } else if (targetFilter === 'Moroso') {
      // Atletas morosos pero excluyendo rigurosamente a quienes tengan alianza o exoneración
      const [{ data: morosos }, { data: alianzas }, { data: exemptRecords }] = await Promise.all([
        supabase.from('athletes').select('id').eq('status', 'Moroso'),
        supabase.from('athletes').select('id').eq('has_alliance', true),
        supabase.from('athlete_exemptions').select('athlete_id'),
      ]);

      const excludedSet = new Set<string>();
      alianzas?.forEach((a) => excludedSet.add(a.id));
      exemptRecords?.forEach((e) => excludedSet.add(e.athlete_id));

      athleteIds = (morosos || [])
        .map((a) => a.id)
        .filter((id) => !excludedSet.has(id));
    } else if (targetFilter === 'Exonerado') {
      // Específicamente atletas con alianza o exoneraciones vigentes
      const [{ data: alianzas }, { data: exemptRecords }] = await Promise.all([
        supabase.from('athletes').select('id').eq('has_alliance', true),
        supabase.from('athlete_exemptions').select('athlete_id'),
      ]);

      const targetIdSet = new Set<string>();
      alianzas?.forEach((a) => targetIdSet.add(a.id));
      exemptRecords?.forEach((e) => targetIdSet.add(e.athlete_id));

      athleteIds = Array.from(targetIdSet);
    } else {
      // Otros estatus (ej. Inactivo)
      const { data: statusAthletes } = await supabase
        .from('athletes')
        .select('id')
        .eq('status', targetFilter);
      athleteIds = statusAthletes?.map((a) => a.id) || [];
    }

    if (athleteIds.length === 0) {
      return { success: true, sentCount: 0, totalTargeted: 0 };
    }
    query = query.in('athlete_id', athleteIds);
  }

  const { data: subscriptions, error } = await query;

  if (error || !subscriptions || subscriptions.length === 0) {
    return { 
      success: true, 
      sentCount: 0, 
      totalTargeted: subscriptions?.length || 0,
      message: 'No hay dispositivos suscritos para este segmento.'
    };
  }

  // Enviar a todos los destinatarios en paralelo
  const results = await Promise.allSettled(
    subscriptions.map((sub) =>
      sendSinglePush(sub, { title, body, url })
    )
  );

  const sentCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;

  // Registrar en la bitácora de notificaciones
  await supabase.from('push_notifications_log').insert({
    title,
    body,
    url: url || '/portal',
    target_type: targetType,
    target_filter: targetFilter || null,
    sent_count: sentCount,
    created_by: adminEmail || 'Admin',
  });

  return {
    success: true,
    sentCount,
    totalTargeted: subscriptions.length,
  };
}

/**
 * Helper para notificaciones automáticas dirigidas a un atleta específico
 * (Ejemplo: Pago Aprobado / Rechazado, Notificación de Cuota)
 */
export async function sendAthletePush(athleteId: string, payload: PushPayload) {
  const supabase = getServiceSupabase();
  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('athlete_id', athleteId);

  if (!subscriptions || subscriptions.length === 0) {
    return { success: false, reason: 'Atleta no tiene dispositivos suscritos' };
  }

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendSinglePush(sub, payload))
  );

  const sentCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;

  return { success: sentCount > 0, sentCount };
}
