/// <reference lib="webworker" />
// Service worker de la PWA.
// Fase 1: precache de la aplicación para que sea instalable y cargue rápido.
// La app es "siempre online": no se cachean las llamadas a Supabase.
// En la Fase 3 se añadirán aquí los manejadores de notificaciones push.

import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Navegación tipo SPA: cualquier ruta devuelve index.html precacheado.
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')));

// Activa la nueva versión en cuanto está lista.
self.addEventListener('message', (evento) => {
  if (evento.data && evento.data.type === 'SKIP_WAITING') void self.skipWaiting();
});
self.addEventListener('activate', (evento) => {
  evento.waitUntil(self.clients.claim());
});
