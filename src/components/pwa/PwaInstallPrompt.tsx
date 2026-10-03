'use client';

import { useState, useEffect } from 'react';
import { 
  Download, Bell, X, Share, PlusSquare, CheckCircle2, 
  Smartphone, BellRing, Sparkles, Loader2, Info, Check
} from 'lucide-react';
import { urlBase64ToUint8Array } from '@/lib/pushClient';
import { savePushSubscription } from '@/app/actions/pushSubscription';
import { toast } from 'sonner';

export default function PwaInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [pushGranted, setPushGranted] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [isSubscribingPush, setIsSubscribingPush] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. Detectar si es dispositivo iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as any).MSStream;
    setIsIos(isIosDevice);

    // 2. Detección híbrida y completa de instalación
    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
    const isIosStandalone = (window.navigator as any).standalone === true;
    const isWebApk = typeof document !== 'undefined' && document.referrer?.includes('android-app://');
    const isPwaParam = typeof window !== 'undefined' && window.location.search.includes('source=pwa');
    const storedInstalled = typeof window !== 'undefined' && localStorage.getItem('ksasport_pwa_installed') === 'true';

    const alreadyInstalled = isStandaloneMedia || isIosStandalone || isWebApk || isPwaParam || storedInstalled;

    if (alreadyInstalled) {
      setIsInstalled(true);
      try {
        localStorage.setItem('ksasport_pwa_installed', 'true');
      } catch (e) {
        // ignore
      }
    }

    // Comprobación adicional en navegadores modernos (Chrome getInstalledRelatedApps)
    if ('getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps().then((relatedApps: any[]) => {
        if (relatedApps && relatedApps.length > 0) {
          setIsInstalled(true);
          try {
            localStorage.setItem('ksasport_pwa_installed', 'true');
          } catch (e) {}
        }
      }).catch(() => {});
    }

    // 3. Detección de notificaciones Push (Permission, LocalStorage y ServiceWorker)
    const storedPush = typeof window !== 'undefined' && localStorage.getItem('ksasport_push_active') === 'true';
    const permGranted = typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';

    if (storedPush || permGranted) {
      setPushGranted(true);
      try {
        localStorage.setItem('ksasport_push_active', 'true');
      } catch (e) {}
    }

    // Verificar suscripción activa en ServiceWorker
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(async (reg) => {
        try {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            setPushGranted(true);
            try {
              localStorage.setItem('ksasport_push_active', 'true');
            } catch (e) {}
          }
        } catch (err) {
          console.warn('SW subscription check:', err);
        }
      });
    }

    // 4. Capturar evento nativo de instalación en Chrome/Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      try {
        localStorage.setItem('ksasport_pwa_installed', 'true');
      } catch (e) {}
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

  // Función para marcar manualmente como instalada
  const markAsInstalled = () => {
    setIsInstalled(true);
    try {
      localStorage.setItem('ksasport_pwa_installed', 'true');
    } catch (e) {}
    setShowIosGuide(false);
    setShowAndroidGuide(false);
    toast.success('¡KsaSport confirmada como instalada en tu dispositivo! 🏆');
  };

  // 1. Si no está montado en cliente, no renderizar nada
  if (!mounted) return null;

  // 2. Si el usuario cerró el aviso en esta sesión con la X, no mostrarlo hasta recargar
  if (isDismissed) return null;

  // 3. Si AMBOS servicios ya están listos (instalada y notificaciones activas), no mostrarlo NUNCA
  if (isInstalled && pushGranted) return null;

  // Manejar clic en "Instalar"
  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          markAsInstalled();
        }
      } catch (err) {
        console.error('Error lanzando prompt de instalación', err);
      } finally {
        setDeferredPrompt(null);
      }
    } else {
      // Si el navegador no tiene deferredPrompt (porque ya la instaló o no lo soporta directamente)
      setShowAndroidGuide(true);
    }
  };

  // Manejar activación de notificaciones Push
  const handleEnablePush = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      if (isIos && !isInstalled) {
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
        toast.error('Permiso denegado. Puedes activarlo en los ajustes de tu navegador.');
        setIsSubscribingPush(false);
        return;
      }

      setPushGranted(true);
      try {
        localStorage.setItem('ksasport_push_active', 'true');
      } catch (e) {}

      const reg = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidPublicKey) {
        throw new Error('Clave pública VAPID no configurada.');
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
      toast.error(err.message || 'No se pudo completar la suscripción push.');
    } finally {
      setIsSubscribingPush(false);
    }
  };

  return (
    <>
      {/* BARRA FLOTANTE FIJA INFERIOR */}
      <aside 
        aria-label="Configuración de la Aplicación KsaSport"
        className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:w-[450px] z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="bg-gradient-to-r from-[#3B0711] via-kasa-vinotinto to-[#250309] text-white rounded-3xl p-4 sm:p-5 shadow-[0_12px_45px_rgba(0,0,0,0.5)] border border-white/20 backdrop-blur-xl relative overflow-hidden">
          {/* Acento de brillo decorativo */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-kasa-dorado/15 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-3 relative z-10">
            {/* Encabezado con logo oficial y botón de cerrar (X) */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white p-1 shadow-md flex items-center justify-center shrink-0">
                  <img src="/icon-192.png" alt="KsaSport" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-extrabold text-sm text-white tracking-wide">
                      KsaSport
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-kasa-dorado text-kasa-vinotinto shrink-0">
                      App Oficial
                    </span>
                  </div>
                  <p className="text-[11px] text-white/75 truncate mt-0.5">
                    {!isInstalled && !pushGranted
                      ? 'Instala la app y activa tus alertas deportivas'
                      : !isInstalled
                      ? 'Agrega KsaSport a tu pantalla de inicio'
                      : 'Activa tus alertas para juegos y pagos'}
                  </p>
                </div>
              </div>

              {/* Botón de cerrar aviso (X) */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDismissed(true);
                }}
                className="min-h-[44px] min-w-[44px] text-white/70 hover:text-white p-2 hover:bg-white/10 rounded-2xl transition-colors cursor-pointer flex items-center justify-center shrink-0 active:scale-90"
                title="Cerrar aviso hasta recargar"
                aria-label="Cerrar aviso de instalación"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Botones de Acción (Instalación y Push) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              
              {/* 1. Botón o Estatus de Instalación */}
              {!isInstalled ? (
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={handleInstallClick}
                    className="min-h-[44px] w-full px-3.5 py-2.5 rounded-2xl bg-kasa-dorado hover:bg-yellow-400 text-kasa-vinotinto font-black text-xs transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Instalar en Inicio</span>
                  </button>
                  <button
                    type="button"
                    onClick={markAsInstalled}
                    className="text-[10px] text-white/70 hover:text-white underline underline-offset-2 transition-colors cursor-pointer text-center py-1 mt-0.5"
                  >
                    ¿Ya la instalaste? Toca aquí
                  </button>
                </div>
              ) : (
                <div className="min-h-[44px] px-3 py-2 rounded-2xl bg-white/10 border border-white/15 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>App Instalada</span>
                </div>
              )}

              {/* 2. Botón o Estatus de Notificaciones Push */}
              {!pushGranted ? (
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={handleEnablePush}
                    disabled={isSubscribingPush}
                    className="min-h-[44px] w-full px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {isSubscribingPush ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        <span>Conectando...</span>
                      </>
                    ) : (
                      <>
                        <Bell className="w-4 h-4 text-kasa-dorado shrink-0" />
                        <span>Activar Alertas</span>
                      </>
                    )}
                  </button>
                  {isIos && !isInstalled && (
                    <span className="text-[10px] text-white/50 text-center py-1 mt-0.5">
                      (Requiere agregar a inicio)
                    </span>
                  )}
                </div>
              ) : (
                <div className="min-h-[44px] px-3 py-2 rounded-2xl bg-white/10 border border-white/15 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Alertas Activas</span>
                </div>
              )}

            </div>
          </div>
        </div>
      </aside>

      {/* MODAL GUÍA PASO A PASO PARA IPHONE (SAFARI) */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[32px] sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-gray-900 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-kasa-vinotinto p-1 flex items-center justify-center shrink-0">
                  <img src="/icon-192.png" alt="KsaSport" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900 leading-tight">Instalar KsaSport</h3>
                  <p className="text-xs text-slate-500 font-medium">Guía para iPhone / iPad (Safari)</p>
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
              En Safari de Apple, agrega <strong>KsaSport</strong> a tu pantalla de inicio siguiendo estos 3 pasos:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-black text-xs">
                  1
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-gray-900">Pulsa el botón Compartir</p>
                  <p className="text-slate-500 mt-0.5">
                    En la barra inferior de Safari busca el ícono <Share className="w-3.5 h-3.5 inline text-blue-600 mx-0.5" />.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-black text-xs">
                  2
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-gray-900">«Agregar a pantalla de inicio»</p>
                  <p className="text-slate-500 mt-0.5">
                    Desliza en las opciones y selecciona <PlusSquare className="w-3.5 h-3.5 inline text-gray-800 mx-0.5" /> <strong>Agregar a pantalla de inicio</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-black text-xs">
                  3
                </div>
                <div className="text-xs text-slate-700">
                  <p className="font-bold text-gray-900">Confirma pulsando «Agregar»</p>
                  <p className="text-slate-500 mt-0.5">
                    En la esquina superior derecha, toca <strong>Agregar</strong>.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={markAsInstalled}
                className="min-h-[44px] w-full py-3.5 rounded-2xl bg-kasa-vinotinto text-white font-black text-xs hover:bg-red-950 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <Check className="w-4 h-4 text-kasa-dorado" />
                <span>¡Listo, ya la agregué a mi inicio!</span>
              </button>

              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="min-h-[44px] w-full py-2.5 rounded-2xl text-slate-500 hover:text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cerrar guía
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GUÍA PARA ANDROID / CHROME */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[32px] sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-gray-900 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-kasa-vinotinto p-1 flex items-center justify-center shrink-0">
                  <img src="/icon-192.png" alt="KsaSport" className="w-full h-full object-contain rounded-xl" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-gray-900 leading-tight">Instalar KsaSport</h3>
                  <p className="text-xs text-slate-500 font-medium">Android y Chrome</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAndroidGuide(false)}
                className="min-h-[44px] min-w-[44px] text-gray-400 hover:text-gray-700 flex items-center justify-center rounded-xl transition-colors cursor-pointer"
                aria-label="Cerrar ventana"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <Info className="w-4 h-4 text-amber-700 shrink-0" />
                ¿Ya tienes KsaSport en tu teléfono?
              </p>
              <p className="text-amber-800 leading-relaxed">
                Si ya instalaste KsaSport o ya la ves en tu pantalla de inicio, confírmalo a continuación para que no te vuelva a solicitar instalación.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
              <p className="font-bold text-gray-900">Si aún no está en tu inicio:</p>
              <p>
                Toca los <strong>tres puntos (⋮)</strong> en la esquina superior de Chrome y selecciona <strong>«Instalar aplicación»</strong> o <strong>«Agregar a la pantalla principal»</strong>.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={markAsInstalled}
                className="min-h-[44px] w-full py-3.5 rounded-2xl bg-kasa-vinotinto text-white font-black text-xs hover:bg-red-950 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <Check className="w-4 h-4 text-kasa-dorado" />
                <span>¡Sí, ya la tengo instalada!</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAndroidGuide(false)}
                className="min-h-[44px] w-full py-2.5 rounded-2xl text-slate-500 hover:text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
              >
                Entendido, voy a revisar el menú
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
