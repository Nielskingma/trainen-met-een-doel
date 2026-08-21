// Minimale service worker — bestaat alleen om de app installeerbaar te maken
// (Android behandelt een geïnstalleerde PWA minder agressief bij het opruimen
// van achtergrondprocessen dan een los tabblad). Cachet expres NIETS: de app
// wordt actief doorontwikkeld en vaak gepusht, dus elke wijziging moet
// meteen zichtbaar zijn — geen kans op een verouderde gecachete versie.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
