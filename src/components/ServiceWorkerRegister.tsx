'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (window.location.protocol === 'https:' || window.location.hostname === 'localhost')
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // Si hay una actualización lista, activar inmediatamente
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('Nueva versión de KsaSport PWA disponible.');
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn('Error registrando Service Worker:', err);
        });
    }
  }, []);

  return null;
}
