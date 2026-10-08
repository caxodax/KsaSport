'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, BellOff, BellRing, Sparkles, CheckCircle2, 
  ShieldCheck, Loader2, Smartphone, Share 
} from 'lucide-react';
import { urlBase64ToUint8Array, getDevicePwaStatus, DevicePwaStatus } from '@/lib/pushClient';
import { savePushSubscription, removePushSubscription, sendTestPushToSelf } from '@/app/actions/pushSubscription';
import { toast } from 'sonner';
import IosInstallGuideModal from '@/components/pwa/IosInstallGuideModal';

interface PushNotificationCardProps {
  athleteId?: string;
}

export default function PushNotificationCard({ athleteId }: PushNotificationCardProps) {
  const [deviceStatus, setDeviceStatus] = useState<DevicePwaStatus>({
    isIos: false,
    isStandalone: false,
    hasNativePushApis: false,
    canSubscribePush: false,
  });
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    const status = getDevicePwaStatus();
    setDeviceStatus(status);

    if (status.hasNativePushApis) {
      if ('Notification' in window) {
        setPermission(Notification.permission);
      }

      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setIsSubscribed(true);
            setSubscription(sub);
            try {
              localStorage.setItem('ksasport_push_active', 'true');
            } catch (e) {}
          }
        }).catch((err) => {
          console.warn('Error verificando suscripción existente:', err);
        });
      });
    }
  }, []);

  const handleSubscribe = async () => {
    // Si estamos en iPhone y NO en modo standalone (es decir, en pestaña normal de Safari):
    if (deviceStatus.isIos && !deviceStatus.isStandalone) {
      setShowIosGuide(true);
      toast.info('En iPhone, primero debes abrir KsaSport desde tu pantalla de inicio para activar las notificaciones push.', {
        duration: 6000,
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Pedir permiso al usuario
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        toast.error(
          deviceStatus.isIos
            ? 'Has bloqueado las notificaciones. Puedes activarlas en Configuración > Safari/KsaSport > Notificaciones.'
            : 'Has bloqueado los permisos de notificación. Actívalos en los ajustes de tu navegador.'
        );
        setLoading(false);
        return;
      }

      // 2. Obtener Service Worker
      const reg = await navigator.serviceWorker.ready;

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        toast.error('Clave pública VAPID no encontrada en el sistema.');
        setLoading(false);
        return;
      }

      // 3. Crear suscripción Push en el navegador
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
      });

      const subJson = sub.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error('No se pudieron obtener las credenciales de suscripción.');
      }

      // 4. Guardar en Supabase
      const res = await savePushSubscription({
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        userAgent: navigator.userAgent,
        athleteId: athleteId || null,
      });

      if (!res.success) {
        throw new Error(res.error || 'Error guardando suscripción');
      }

      setIsSubscribed(true);
      setSubscription(sub);
      try {
        localStorage.setItem('ksasport_push_active', 'true');
      } catch (e) {}
      toast.success(
        deviceStatus.isIos
          ? '¡iPhone conectado exitosamente! Ahora recibirás alertas en tu teléfono. 🔔'
          : '¡Dispositivo conectado! Ahora recibirás alertas de KsaSport. 🔔'
      );
    } catch (err: any) {
      console.error('Error suscribiendo push:', err);
      if (err.name === 'NotAllowedError') {
        toast.error('Permiso bloqueado. Habilita las notificaciones en los Ajustes de tu teléfono.');
      } else if (deviceStatus.isIos && !deviceStatus.isStandalone) {
        setShowIosGuide(true);
        toast.info('En iPhone, abre KsaSport desde el ícono de tu pantalla de inicio para recibir alertas.');
      } else {
        toast.error(err.message || 'Error al suscribir el dispositivo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscription) return;
    setLoading(true);
    try {
      await removePushSubscription(subscription.endpoint);
      await subscription.unsubscribe();
      setIsSubscribed(false);
      setSubscription(null);
      try {
        localStorage.removeItem('ksasport_push_active');
      } catch (e) {}
      toast.info('Has desactivado las notificaciones en este dispositivo.');
    } catch (err: any) {
      toast.error('No se pudo desactivar la suscripción.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!subscription) return;
    setTesting(true);
    try {
      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        toast.error('Datos de suscripción incompletos');
        return;
      }

      const res = await sendTestPushToSelf({
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
      });

      if (res.success) {
        toast.success('¡Notificación enviada! Revisa la cortina de notificaciones de tu teléfono.');
      } else {
        toast.error(res.error || 'Error enviando notificación');
      }
    } catch (err: any) {
      toast.error('Error al probar la notificación.');
    } finally {
      setTesting(false);
    }
  };

  // CASO 1: Dispositivo/navegador que no soporta Push APIs nativas
  if (!deviceStatus.hasNativePushApis) {
    return (
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm text-xs text-gray-500 flex items-center gap-3">
        <BellOff className="w-5 h-5 text-gray-400 shrink-0" />
        <p>
          Las notificaciones Web Push requieren un navegador compatible (Chrome, Safari iOS 16.4+ en inicio, Edge o Firefox).
        </p>
      </div>
    );
  }

  // CASO 2: iPhone en Safari regular (no standalone)
  // Apple bloquea Push en pestañas regulares; guiamos al usuario amablemente sin error
  if (deviceStatus.isIos && !deviceStatus.isStandalone) {
    return (
      <>
        <div className="bg-gradient-to-r from-amber-950/90 via-kasa-vinotinto to-red-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-white/10 relative overflow-hidden">
          {/* Glow decorativo */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-kasa-dorado/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/15 text-kasa-dorado">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm sm:text-base text-white">
                    Notificaciones Push en iPhone
                  </h3>
                  <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    Paso en iOS
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-1 max-w-md">
                  Por seguridad de Apple, debes agregar KsaSport a tu pantalla de inicio y abrirla desde allí para poder activar tus notificaciones.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setShowIosGuide(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-kasa-dorado hover:bg-yellow-400 text-kasa-vinotinto font-black text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Share className="w-4 h-4" />
                <span>Ver cómo activar en iPhone</span>
              </button>
            </div>
          </div>
        </div>

        <IosInstallGuideModal
          isOpen={showIosGuide}
          onClose={() => setShowIosGuide(false)}
          reason="push"
        />
      </>
    );
  }

  // CASO 3: Dispositivo compatible listo (Android/Desktop, o iPhone en Standalone)
  return (
    <>
      <div className="bg-gradient-to-r from-amber-950/90 via-kasa-vinotinto to-red-950 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-white/10 relative overflow-hidden">
        {/* Glow decorativo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-kasa-dorado/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/15 text-kasa-dorado">
              {isSubscribed ? <BellRing className="w-6 h-6 animate-bounce" /> : <Bell className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm sm:text-base text-white">
                  {isSubscribed ? 'Alertas Push Conectadas' : 'Notificaciones Push KsaSport'}
                </h3>
                {isSubscribed ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" />
                    {deviceStatus.isIos ? 'iOS PWA' : 'PWA'}
                  </span>
                )}
              </div>
              <p className="text-xs text-white/80 mt-1 max-w-md">
                {isSubscribed
                  ? 'Recibirás avisos de juegos, aprobación de pagos y comunicados urgentes en la pantalla de tu móvil.'
                  : 'Entérate de convocatorias, confirmación de pagos y avisos oficiales en tiempo real en tu teléfono.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {isSubscribed ? (
              <>
                <button
                  type="button"
                  onClick={handleSendTest}
                  disabled={testing}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Probar notificación en este celular"
                >
                  {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-kasa-dorado" />}
                  <span>Probar</span>
                </button>
                <button
                  type="button"
                  onClick={handleUnsubscribe}
                  disabled={loading}
                  className="px-3 py-2.5 rounded-xl bg-black/20 hover:bg-black/40 text-white/70 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                  title="Desactivar en este dispositivo"
                >
                  Desactivar
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={loading || permission === 'denied'}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-kasa-dorado hover:bg-yellow-400 text-kasa-vinotinto font-black text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Activar Notificaciones</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <IosInstallGuideModal
        isOpen={showIosGuide}
        onClose={() => setShowIosGuide(false)}
        reason="push"
      />
    </>
  );
}
