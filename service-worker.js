// service-worker.js

// **IMPORTANTE**: INCREMENTA QUESTO NUMERO AD OGNI AGGIORNAMENTO MAGGIORE DEL GIOCO
const CACHE_NAME = 'gioketto-offline-cache-v1.24'; 

// Elenca i file essenziali per far funzionare il gioco offline
const urlsToCache = [
    '/',
    'index.html',
    'style.css',
    'main.js',
    'manifest.json',
    
    // Aggiungi qui tutti i tuoi script e asset:
    './texture.js',
    './base.js',
    './player.js',
    './cubo.js',
    './punta.js',
    './stoneball.js',
    './fastF.js',
    
    // Esempio asset (adattali ai tuoi percorsi effettivi)
    'assets/bg_base.png',
    'assets/doppiaPunta_albert.png',
    'assets/doppiaPunta_etto.png',
    'assets/doppiaPunta_homer.png',
    'assets/doppiaPunta_mine.png',
    'assets/doppiaPunta_potter.png',
    'assets/double_platform_albert.png',
    'assets/double_platform_etto.png',
    'assets/double_platform_homer.png',
    'assets/double_platform_mine.png',
    'assets/double_platform_potter.png',
    'assets/double_stone_albert.png',
    'assets/double_stone_etto.png',
    'assets/double_stone_homer.png',
    'assets/double_stone_mine.png',
    'assets/double_stone_potter.png',
    'assets/fastForward.png',
    'assets/frame.png',
    'assets/logo.png',
    'assets/platform_albert.png',
    'assets/platform_etto.png',
    'assets/platform_homer.png',
    'assets/platform_mine.png',
    'assets/platform_potter.png',
    'assets/punta_albert.png',
    'assets/punta_etto.png',
    'assets/punta_homer.png',
    'assets/punta_mine.png',
    'assets/punta_potter.png',
    'assets/settings.png',
    'assets/stone_albert.png',
    'assets/stone_etto.png',
    'assets/stone_homer.png',
    'assets/stone_mine.png',
    'assets/stone_potter.png',
    'assets/stoneball.png',
    'assets/base/base_albert.png',
    'assets/base/base_etto.png',
    'assets/base/base_homer.png',
    'assets/base/base_mine.png',
    'assets/base/base_potter.png',
    'assets/bg/bg_albert.png',
    'assets/bg/bg_etto.png',
    'assets/bg/bg_homer.png',
    'assets/bg/bg_mine.png',
    'assets/bg/bg_potter.png',
    'assets/fonts/COMEBREAK.ttf',
    'assets/players/player_albert.png',
    'assets/players/player_etto.png',
    'assets/players/player_homer.png',
    'assets/players/player_mine.png',
    'assets/players/player_potter.png',
    'assets/icons/icon-192.png',
    'assets/icons/icon-512.png',
 
];

// ----------------------------------------------------------------------

// 1. EVENTO INSTALL
// Apre la cache e vi aggiunge tutti i file essenziali.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: In caching dei file essenziali...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forza l'attivazione immediata
  );
});

// 2. EVENTO ACTIVATE
// Questo evento pulisce le vecchie versioni della cache per risparmiare spazio e prevenire conflitti.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Eliminazione cache vecchia:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => clients.claim()) // Prende subito il controllo dei client
  );
});

// 3. EVENTO FETCH (La logica del Network-First)
// Intercetta ogni richiesta di rete
self.addEventListener('fetch', event => {
  event.respondWith(
    // Tenta prima di ottenere la risorsa dalla rete (quindi la versione più aggiornata)
    fetch(event.request)
      .then(response => {
        // Se la richiesta va a buon fine, clone la risposta per metterla in cache
        const responseClone = response.clone();
        
        // Esegui la cache in background (solo per le richieste GET)
        if (event.request.method === 'GET') {
             caches.open(CACHE_NAME).then(cache => {
                // Non salvare nella cache richieste che non vanno a buon fine o che non sono HTTP/HTTPS
                if (response.status === 200 && response.type === 'basic') {
                    cache.put(event.request, responseClone);
                }
            });
        }

        return response;
      })
      .catch(() => {
        // Se la rete fallisce (l'utente è offline o c'è un errore di rete),
        // cerca la risorsa nella cache locale.
        console.log('Service Worker: Offline. Servendo dalla cache:', event.request.url);
        return caches.match(event.request);
      })
  );
});