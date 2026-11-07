/* Service worker mínimo para que Reporte Electro sea instalable (PWA).
   Estrategia: network-first para no dejar la app pegada en una versión vieja. */
const CACHE = 'reporte-electro-v23';
const ASSETS = ['./', './index.html', './manifest.json', './icon-180.png', './icon-512.png', './fpuntos.svg', './epa.svg', './epa.png', './logo-falabella.png', './attach.svg', './connect.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // no interceptar llamadas a Firebase / Gemini
  if (/googleapis\.com|gstatic\.com|firebase/.test(req.url)) return;
  e.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
// Web Push: muestra la notificación enviada por el servidor (GitHub Action)
self.addEventListener('push', e => {
  let d = {}; try { d = e.data ? e.data.json() : {}; } catch (_) { d = { body: e.data && e.data.text() }; }
  const title = d.title || 'Reporte Electro';
  e.waitUntil(self.registration.showNotification(title, {
    body: d.body || 'Recuerda subir el reporte del día',
    icon: './icon-180.png', badge: './icon-180.png', tag: 'reporte-remind'
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if ('focus' in w) return w.focus(); }
    if (clients.openWindow) return clients.openWindow('./');
  }));
});
