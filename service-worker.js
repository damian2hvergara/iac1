// ============================================
// SERVICE WORKER PARA IMPORT AMERICAN CARS
// Versión: 2.0.0 | Cache Strategy: Stale-While-Revalidate
// ============================================

const CACHE_NAME = 'iac-v2.0.0';
const OFFLINE_URL = '/offline.html';
const API_CACHE_NAME = 'iac-api-v1.0.0';

// Assets críticos para instalación
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/testimonios.css',
  '/css/mobile-nav.css',
  '/js/config.js',
  '/js/app.js',
  '/js/productos.js',
  '/js/supabase.js',
  '/js/ui.js',
  '/js/testimonios.js',
  '/js/comparador.js',
  '/js/mobile-nav.js',
  '/favicon.ico',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
];

// Imágenes críticas
const CRITICAL_IMAGES = [
  'https://images.unsplash.com/photo-1580274455191-1c62238fa333?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1553440569-bcc63803a83d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
];

// ===== INSTALL EVENT =====
self.addEventListener('install', event => {
  console.log('🛠️ Service Worker: Instalando v2.0.0...');
  
  event.waitUntil(
    Promise.all([
      // Cache de assets estáticos
      caches.open(CACHE_NAME)
        .then(cache => {
          console.log('📦 Cacheando assets críticos...');
          return cache.addAll([
            ...STATIC_CACHE_URLS,
            ...CRITICAL_IMAGES
          ]).catch(error => {
            console.warn('⚠️ Error cacheando algunos recursos:', error);
          });
        }),
      
      // Cache de página offline
      caches.open('offline')
        .then(cache => cache.add(OFFLINE_URL)),
      
      // Forzar activación inmediata
      self.skipWaiting()
    ])
    .then(() => {
      console.log('✅ Service Worker instalado correctamente');
    })
    .catch(error => {
      console.error('❌ Error durante instalación:', error);
    })
  );
});

// ===== ACTIVATE EVENT =====
self.addEventListener('activate', event => {
  console.log('🚀 Service Worker: Activando...');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguos
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== API_CACHE_NAME && 
                cacheName !== 'offline') {
              console.log(`🗑️ Eliminando cache antiguo: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Tomar control de todos los clients
      self.clients.claim(),
      
      // Limpiar cache de API periódicamente
      cleanApiCache()
    ])
    .then(() => {
      console.log('✅ Service Worker activado y listo');
      
      // Enviar mensaje a clients
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            version: '2.0.0'
          });
        });
      });
    })
  );
});

// ===== FETCH EVENT =====
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // No cachear requests a Supabase (API)
  if (url.hostname.includes('supabase.co')) {
    handleApiRequest(event);
    return;
  }
  
  // No cachear requests a Cloudinary (imágenes dinámicas)
  if (url.hostname.includes('cloudinary.com') || 
      url.hostname.includes('images.unsplash.com')) {
    handleImageRequest(event);
    return;
  }
  
  // Para otros recursos, usar estrategia adecuada
  if (event.request.mode === 'navigate') {
    // Para navegación: Network First, fallback a cache
    handleNavigationRequest(event);
  } else {
    // Para assets: Cache First, luego network
    handleAssetRequest(event);
  }
});

// ===== ESTRATEGIAS DE CACHE =====

// Manejar requests de API
function handleApiRequest(event) {
  event.respondWith(
    caches.open(API_CACHE_NAME).then(cache => {
      return fetch(event.request)
        .then(response => {
          // Cachear respuesta exitosa (solo GET)
          if (event.request.method === 'GET' && response.ok) {
            const responseToCache = response.clone();
            cache.put(event.request, responseToCache);
            
            // Limitar tamaño del cache de API
            cache.keys().then(keys => {
              if (keys.length > 50) {
                cache.delete(keys[0]);
              }
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback a cache si hay conexión
          return cache.match(event.request);
        });
    })
  );
}

// Manejar requests de imágenes
function handleImageRequest(event) {
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        // Retornar cache si existe
        if (cachedResponse) {
          // Actualizar cache en background
          fetchAndCache(event.request, cache);
          return cachedResponse;
        }
        
        // Si no hay cache, fetch y cachear
        return fetchAndCache(event.request, cache);
      });
    })
  );
}

// Manejar requests de navegación
function handleNavigationRequest(event) {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cachear página principal
        if (event.request.url === self.location.origin + '/' && response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback a cache o página offline
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return caches.match(OFFLINE_URL);
          });
      })
  );
}

// Manejar requests de assets
function handleAssetRequest(event) {
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Retornar cache si existe
        if (cachedResponse) {
          // Actualizar cache en background (stale-while-revalidate)
          fetchAndCache(event.request);
          return cachedResponse;
        }
        
        // Si no hay cache, fetch normal
        return fetch(event.request);
      })
  );
}

// ===== FUNCIONES HELPER =====

// Fetch y cachear
function fetchAndCache(request, cache = null) {
  return fetch(request)
    .then(response => {
      // Solo cachear respuestas exitosas
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      
      const responseToCache = response.clone();
      
      const cacheToUse = cache || caches.open(CACHE_NAME);
      return Promise.resolve(cacheToUse).then(cacheInstance => {
        cacheInstance.put(request, responseToCache);
        return response;
      });
    })
    .catch(error => {
      console.warn('Fetch falló:', error);
      throw error;
    });
}

// Limpiar cache de API periódicamente
function cleanApiCache() {
  return caches.open(API_CACHE_NAME).then(cache => {
    return cache.keys().then(requests => {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      requests.forEach(request => {
        cache.match(request).then(response => {
          if (response) {
            const dateHeader = response.headers.get('date');
            if (dateHeader) {
              const cachedTime = new Date(dateHeader).getTime();
              if (now - cachedTime > oneHour) {
                cache.delete(request);
              }
            }
          }
        });
      });
    });
  });
}

// ===== SYNC EVENT =====
self.addEventListener('sync', event => {
  console.log('🔄 Sync event:', event.tag);
  
  if (event.tag === 'sync-testimonios') {
    event.waitUntil(syncPendingTestimonios());
  }
  
  if (event.tag === 'sync-analytics') {
    event.waitUntil(syncPendingAnalytics());
  }
});

// Sincronizar testimonios pendientes
async function syncPendingTestimonios() {
  try {
    const pending = await getPendingTestimonios();
    
    for (const testimonio of pending) {
      const response = await fetch('https://cflpmluvhfldewiitymh.supabase.co/rest/v1/testimonios', {
        method: 'POST',
        headers: {
          'apikey': 'sb_publishable_lvUG-G_2bzDxyVZwAF25HA_30dFAb3K',
          'Authorization': 'Bearer sb_publishable_lvUG-G_2bzDxyVZwAF25HA_30dFAb3K',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testimonio)
      });
      
      if (response.ok) {
        await removePendingTestimonio(testimonio.id);
        console.log('✅ Testimonio sincronizado:', testimonio.id);
      }
    }
  } catch (error) {
    console.error('❌ Error sincronizando testimonios:', error);
  }
}

// Sincronizar analytics pendientes
async function syncPendingAnalytics() {
  try {
    const pending = await getPendingAnalytics();
    
    for (const event of pending) {
      const response = await fetch('https://cflpmluvhfldewiitymh.supabase.co/rest/v1/interacciones_usuario', {
        method: 'POST',
        headers: {
          'apikey': 'sb_publishable_lvUG-G_2bzDxyVZwAF25HA_30dFAb3K',
          'Authorization': 'Bearer sb_publishable_lvUG-G_2bzDxyVZwAF25HA_30dFAb3K',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      });
      
      if (response.ok) {
        await removePendingAnalytics(event.id);
      }
    }
  } catch (error) {
    console.error('❌ Error sincronizando analytics:', error);
  }
}

// ===== BACKGROUND SYNC HELPERS =====

// IndexedDB para datos pendientes
const DB_NAME = 'iac_offline_db';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Store para testimonios pendientes
      if (!db.objectStoreNames.contains('pending_testimonios')) {
        const store = db.createObjectStore('pending_testimonios', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
      
      // Store para analytics pendientes
      if (!db.objectStoreNames.contains('pending_analytics')) {
        const store = db.createObjectStore('pending_analytics', { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
    };
  });
}

async function getPendingTestimonios() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending_testimonios', 'readonly');
    const store = transaction.objectStore('pending_testimonios');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removePendingTestimonio(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending_testimonios', 'readwrite');
    const store = transaction.objectStore('pending_testimonios');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function getPendingAnalytics() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending_analytics', 'readonly');
    const store = transaction.objectStore('pending_analytics');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removePendingAnalytics(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('pending_analytics', 'readwrite');
    const store = transaction.objectStore('pending_analytics');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// ===== PUSH NOTIFICATIONS =====
self.addEventListener('push', event => {
  console.log('📢 Push notification recibida:', event);
  
  const options = {
    body: event.data?.text() || 'Nueva actualización disponible',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver novedades',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icon-192.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Import American Cars', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('🔔 Notification click:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// ===== MESSAGE EVENT =====
self.addEventListener('message', event => {
  console.log('📨 Mensaje recibido en SW:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME);
      caches.delete(API_CACHE_NAME);
      break;
      
    case 'GET_CACHE_INFO':
      caches.keys().then(cacheNames => {
        event.ports[0].postMessage({
          type: 'CACHE_INFO',
          caches: cacheNames
        });
      });
      break;
      
    case 'PRECACHE_IMAGE':
      const { url } = event.data;
      caches.open(CACHE_NAME).then(cache => {
        fetch(url).then(response => {
          if (response.ok) {
            cache.put(url, response);
          }
        });
      });
      break;
  }
});

// ===== ERROR HANDLING =====
self.addEventListener('error', event => {
  console.error('❌ Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('❌ Service Worker unhandled rejection:', event.reason);
});

// ===== OFFLINE DETECTION =====
function updateOnlineStatus() {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NETWORK_STATUS',
        isOnline: navigator.onLine
      });
    });
  });
}

// Escuchar cambios de conexión
self.addEventListener('online', updateOnlineStatus);
self.addEventListener('offline', updateOnlineStatus);

console.log('✅ Service Worker cargado correctamente');