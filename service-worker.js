self.addEventListener('install', event => {
  console.log('Service Worker installato');
});

self.addEventListener('fetch', event => {
  // Puoi aggiungere caching qui se vuoi
});
