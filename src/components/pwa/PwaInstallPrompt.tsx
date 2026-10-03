'use client';

import { useState, useEffect } from 'react';
import { 
  Download, Bell, X, Share, PlusSquare, CheckCircle2, 
  Smartphone, ChevronUp, BellRing, Sparkles, Loader2, Info
} from 'lucide-react';
import { urlBase64ToUint8Array } from '@/lib/pushClient';
import { savePushSubscription } from '@/app/actions/pushSubscription';
import { toast } from 'sonner';

export default function PwaInstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(true); // default true to avoid flash
  const [pushGranted, setPushGranted] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. Detectar si la app ya está instalada / modo standalone
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      const isIosStandalone = (window.navigator as any).standalone === true;
      return isStandaloneMedia || isIosStandalone;
    };

    const standalone = checkStandalone();
    setIsStandalone(standalone);

    // 2. Detectar si es iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // 3. Detectar estatus de notificaciones push
    if ('Notification' in window) {
      setPushGranted(Notification.permission === 'granted');
    } else {
      setPushGranted(false);
    }

    // 4. Capturar evento de instalación nativa en Android / Chrome
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsStandalone(false);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
      toast.success('¡KsaSport instalada exitosamente en tu pantalla de inicio! 🏆');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Si ambos ya están activos, o aún no está montado en cliente, o el usuario cerró el aviso en esta sesión
  if (!mounted) return null;
  if (isDismissed) return null;
  if (isStandalone && pushGranted) return null;

  // Manejar instalación en Android / Chrome
  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      // Si el navegador no disparó el evento pero es Android, dar instrucción guiada
      toast.info('Abre el menú de 3 puntos de Chrome y selecciona «Instalar aplicación» o «Añadir a pantalla de inicio».');
    }
  };

  // Manejar activación de notificaciones Push
  const handleEnablePush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      if (isIos && !isStandalone) {
        setShowIosGuide(true);
        toast.info('En iPhone, primero debes añadir KsaSport a tu pantalla de inicio para recibir alertas push.');
        return;
      }
      toast.error('Tu navegador no soporta notificaciones Web Push.');
      return;
    }

    setIsSubscribingPush(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        toast.error('Has denegado los permisos. Actívalos en la configuración del navegador.');
        setIsSubscribingPush(false);
        return;
      }

      setPushGranted(true);

      const reg = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        throw new Error('Clave pública VAPID no encontrada.');
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as unknown as BufferSource,
      });

      const subJson = sub.toJSON();
      if (subJson.endpoint && subJson.keys) {
        await savePushSubscription({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
          userAgent: navigator.userAgent,
        });
      }

      toast.success('¡Notificaciones Push activadas en tu dispositivo! 🔔');
    } catch (err: any) {
      console.error(err);
      toast.error('No se pudo completar la suscripción push.');
    } finally {
      setIsSubscribingPush(false);
    }
  };

  return (
    <>
      {/* 1. BARRA FLOTANTE FIJA INFERIOR (Visible si falta instalar o activar push, hasta que se cierre) */}
      <aside 
        aria-label="Configuración de la Aplicación KsaSport"
        className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-[440px] z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5"
      >
        <div className="bg-gradient-to-r from-[#3B0711] via-kasa-vinotinto to-[#250309] text-white rounded-3xl p-4 sm:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] border border-white/20 backdrop-blur-xl relative overflow-hidden">
          {/* Acento decorativo */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-kasa-dorado/15 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3.5 relative z-10">
            {/* Encabezado con logo y botón de cerrar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-white p-1 shadow-md flex items-center justify-center shrink-0">
                  <img src="/icon-192.png" alt="KsaSport" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                    <span>KsaSport</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-kasa-dorado text-kasa-vinotinto">
                      App Oficial
                    </span>
                  </h3>
                  <p className="text-[11px] text-white/70">
                    Configura tu dispositivo para la mejor experiencia deportiva.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="min-h-[44px] min-w-[44px] text-white/60 hover:text-white p-1.5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer flex items-center justify-center"
                title="Cerrar aviso hasta recargar"
                aria-label="Cerrar aviso"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

              {/* Botones de Acción (Instalar y Push) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                
                {/* 1. Botón Instalar PWA */}
                {!isStandalone ? (
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="min-h-[44px] w-full px-4 py-2.5 rounded-2xl bg-kasa-dorado hover:bg-yellow-400 text-kasa-vinotinto font-black text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    <span>Instalar en Inicio</span>
                  </button>
                ) : (
                  <div className="min-h-[44px] px-3 py-2 rounded-2xl bg-white/10 border border-white/15 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>App Instalada</span>
                  </div>
                )}

                {/* 2. Botón Activar Notificaciones Push */}
                {!pushGranted ? (
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    disabled={isSubscribingPush}
                    className="min-h-[44px] w-full px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {isSubscribingPush ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Conectando...</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 text-kasa-dorado" />
                        <span>Activar Alertas</span>
                      </>
                    )}
                  </button>
                ) : (
                  <div className="min-h-[44px] px-3 py-2 rounded-2xl bg-white/10 border border-white/15 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Alertas Activas</span>
                  </div>
                )}

              </div>
            </div>
        </div>
      </aside>

      {/* 2. MODAL GUÍA PASO A PASO PARA IPHONE (SAFARI) */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[32px] sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6 text-gray-900 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-kasa-vinotinto p-1.5 flex items-center justify-center">
                  <img src="/icon-192.png" alt="KsaSport" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900 leading-tight">Instalar KsaSport</h3>
                  <p className="text-xs text-slate-500 font-medium">Guía oficial para iPhone (iOS)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="min-h-[44px] min-w-[44px] text-gray-400 hover:text-gray-700 flex items-center justify-center rounded-xl transition-colors cursor-pointer"
                aria-label="Cerrar guía de instalación"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              En Safari de Apple, las aplicaciones se instalan siguiendo estos 3 pasos para contar con icono propio y notificaciones push:
            </p>

            <div className="space-y-3.5">
              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-black text-sm">
                  1
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-gray-900">Pulsa el botón Compartir</p>
                  <p className="text-slate-500 mt-0.5">
                    Está ubicado en la barra inferior de Safari con el ícono <Share className="w-3.5 h-3.5 inline text-blue-600" />.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-black text-sm">
                  2
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-gray-900">«Agregar a pantalla de inicio»</p>
                  <p className="text-slate-500 mt-0.5">
                    Desliza hacia abajo en las opciones hasta encontrar <PlusSquare className="w-3.5 h-3.5 inline text-gray-800" /> <strong>Agregar a pantalla de inicio</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-black text-sm">
                  3
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-gray-900">Confirma pulsando «Agregar»</p>
                  <p className="text-slate-500 mt-0.5">
                    Toca <strong>Agregar</strong> en la esquina superior derecha. Se creará la App <strong>KsaSport</strong> con su logo oficial.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="min-h-[44px] w-full py-3.5 rounded-2xl bg-kasa-vinotinto text-white font-black text-xs hover:bg-red-950 transition-colors cursor-pointer"
            >
              Entendido, voy a agregarlo
            </button>
          </div>
        </div>
      )}
    </>
  );
}
