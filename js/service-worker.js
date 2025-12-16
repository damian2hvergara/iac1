// Service Worker para Import American Cars
const CACHE_NAME = 'iac-v1.0.0';
const OFFLINE_URL = '/offline.html';

const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/testimonios.css',
  '/js/config.js',
  '/js/app.js',
  '/js/productos.js',
  '/js/supabase.js',
  '/js/ui.js',
  '/js/testimonios.js',
  '/js/comparador.js',
  '/js/mobile-nav.js',
  '/favicon.ico'
];

// Instalar Service Worker
self.addEventListener('install', event => {
  console.log('🛠️ Service Worker instalando...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Cache abierto');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Todos los recursos cacheados');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error durante la instalación:', error);
      })
  );
});

// Activar Service Worker
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker activando...');
  
  // Limpiar caches antiguos
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`🗑️ Eliminando cache antiguo: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('✅ Service Worker activado');
      return self.clients.claim();
    })
  );
});

// Interceptar fetch requests
self.addEventListener('fetch', event => {
  // No cachear requests a Supabase (siempre frescos)
  if (event.request.url.includes('supabase.co')) {
    return;
  }
  
  // Estrategia: Cache First, luego Network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          console.log('📦 Sirviendo desde cache:', event.request.url);
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            // No cachear respuestas no exitosas o que no sean del mismo origen
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clonar la respuesta para cachearla
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(error => {
            console.error('❌ Error en fetch:', error);
            
            // Si estamos offline y es una página, mostrar offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            return new Response('Network error', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Manejar mensajes desde la app
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Sincronización en background
self.addEventListener('sync', event => {
  if (event.tag === 'sync-testimonios') {
    event.waitUntil(syncTestimonios());
  }
});

async function syncTestimonios() {
  console.log('🔄 Sincronizando testimonios pendientes...');
  
  // Aquí iría la lógica para sincronizar datos pendientes
  // (testimonios enviados offline, interacciones, etc.)
  
  return Promise.resolve();
}