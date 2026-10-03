// ==============================================================================
// KASA SPORTS - SERVICE WORKER PWA & WEB PUSH NOTIFICATIONS
// ==============================================================================

const CACHE_NAME = 'ksasport-pwa-v1';

// 1. Ciclo de vida: Instalación y Activación Inmediata
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 2. Recepción de Notificaciones Push (Web Push API)
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch (err) {
    payload = {
      title: 'Kasa Sports',
      body: event.data.text() || 'Tienes una nueva notificación de Kasa Sports.',
    };
  }

  const title = payload.title || 'Kasa Sports';
  const targetUrl = payload.url || '/portal';

  const notificationOptions = {
    body: payload.body || 'Actualización en el ecosistema deportivo.',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/apple-touch-icon.png',
    vibrate: [200, 100, 200],
    tag: payload.tag || 'ksasport-notification',
    renotify: true,
    data: {
      url: targetUrl,
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, notificationOptions)
  );
});

// 3. Clic sobre la Notificación Nativa
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/portal';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si el usuario ya tiene la app o una pestaña abierta, la enfocamos y redirigimos
      for (const client of clientList) {
        if (client.url && client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Si la app está cerrada en segundo plano, abrir ventana nueva en la URL indicada
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
