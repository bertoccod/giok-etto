self.addEventListener('install', event => {
  // Installazione immediata senza cache
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  // Attiva subito il nuovo SW
  clients.claim();
});

self.addEventListener('fetch', event => {
  // Passa tutto direttamente alla rete
  return;
});
