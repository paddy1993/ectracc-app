// ECTRACC Service Worker - Enhanced PWA Features
const CACHE_NAME = 'ectracc-v1.0.0';
const RUNTIME_CACHE = 'ectracc-runtime';
const API_CACHE = 'ectracc-api';
const IMAGE_CACHE = 'ectracc-images';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/products\/search/,
  /\/api\/user-footprints\/summary/,
  /\/api\/user-footprints\/entries/
];

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/
];

// Network-first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /\/api\/auth\//,
  /\/api\/user-footprints\/entries$/ // POST requests
];

// Cache-first patterns (serve from cache if available)
const CACHE_FIRST_PATTERNS = [
  /\/static\//,
  /\.(?:js|css|woff2?|ttf|eot)$/
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== CACHE_NAME && 
                     cacheName !== RUNTIME_CACHE && 
                     cacheName !== API_CACHE && 
                     cacheName !== IMAGE_CACHE;
            })
            .map((cacheName) => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests for caching
  if (request.method !== 'GET') {
    // Handle POST/PUT/DELETE with network-only strategy
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If it's a successful API write operation, clear related caches
          if (response.ok && url.pathname.includes('/api/')) {
            clearRelatedCaches(url.pathname);
          }
          return response;
        })
        .catch((error) => {
          console.error('[SW] Network request failed:', error);
          // Return a custom offline response for failed writes
          return new Response(
            JSON.stringify({ 
              error: 'Network unavailable', 
              offline: true,
              message: 'Your action will be retried when you\'re back online'
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Image requests
  if (IMAGE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(handleImageRequest(request));
    return;
  }

  // Static assets (cache-first)
  if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(handleCacheFirst(request));
    return;
  }

  // Navigation requests (app shell)
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(handleNetworkFirst(request));
});

// Handle API requests with smart caching
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Network-first for auth and write operations
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return handleNetworkFirst(request, API_CACHE);
  }

  // Cache-first for search and read operations
  if (API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    return handleCacheFirst(request, API_CACHE, 5 * 60 * 1000); // 5 minutes TTL
  }

  // Default: network-first
  return handleNetworkFirst(request, API_CACHE);
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  return handleCacheFirst(request, IMAGE_CACHE);
}

// Cache-first strategy
async function handleCacheFirst(request, cacheName = RUNTIME_CACHE, ttl = null) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check TTL if specified
    if (ttl) {
      const cachedTime = cachedResponse.headers.get('sw-cache-time');
      if (cachedTime && Date.now() - parseInt(cachedTime) > ttl) {
        // Cache expired, fetch new data in background
        fetchAndCache(request, cache);
        return cachedResponse; // Return stale data immediately
      }
    }
    return cachedResponse;
  }

  // Not in cache, fetch and cache
  return fetchAndCache(request, cache);
}

// Network-first strategy
async function handleNetworkFirst(request, cacheName = RUNTIME_CACHE) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const responseClone = response.clone();
      
      // Add timestamp for TTL
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const modifiedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
    
    return response;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html') || new Response(
        '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }
    
    throw error;
  }
}

// Handle navigation requests (app shell pattern)
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch (error) {
    console.log('[SW] Navigation failed, serving app shell');
    
    // Try to serve the cached app shell
    const cache = await caches.open(CACHE_NAME);
    const appShell = await cache.match('/');
    
    if (appShell) {
      return appShell;
    }
    
    // Fallback offline page
    return new Response(
      `<!DOCTYPE html>
      <html>
        <head>
          <title>ECTRACC - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .offline { color: #666; }
            .retry { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
          </style>
        </head>
        <body>
          <h1>ECTRACC</h1>
          <div class="offline">
            <h2>You're offline</h2>
            <p>Please check your internet connection and try again.</p>
            <button class="retry" onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>`,
      {
        headers: { 'Content-Type': 'text/html' },
        status: 200
      }
    );
  }
}

// Fetch and cache helper
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const responseClone = response.clone();
      
      // Add timestamp for TTL
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const modifiedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
    
    return response;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    throw error;
  }
}

// Clear related caches when data is updated
function clearRelatedCaches(pathname) {
  if (pathname.includes('/user-footprints/')) {
    // Clear dashboard and history caches
    caches.open(API_CACHE).then(cache => {
      cache.keys().then(keys => {
        keys.forEach(key => {
          if (key.url.includes('/summary') || key.url.includes('/entries') || key.url.includes('/history')) {
            cache.delete(key);
          }
        });
      });
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'background-sync-footprint') {
    event.waitUntil(syncFootprintData());
  }
});

// Sync footprint data when back online
async function syncFootprintData() {
  try {
    // Get pending actions from IndexedDB
    const pendingActions = await getPendingActions();
    
    for (const action of pendingActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body
        });
        
        if (response.ok) {
          // Remove from pending actions
          await removePendingAction(action.id);
          
          // Notify clients of successful sync
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'SYNC_SUCCESS',
                action: action.type
              });
            });
          });
        }
      } catch (error) {
        console.error('[SW] Sync failed for action:', action, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);
  
  const options = {
    body: 'You have new carbon footprint insights!',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Dashboard',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/logo192.png'
      }
    ]
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.body || options.body;
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('ECTRACC', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll().then(clientList => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/');
      })
    );
  }
});

// Placeholder functions for IndexedDB operations
async function getPendingActions() {
  // TODO: Implement IndexedDB operations
  return [];
}

async function removePendingAction(id) {
  // TODO: Implement IndexedDB operations
  return true;
}

console.log('[SW] Service worker loaded');