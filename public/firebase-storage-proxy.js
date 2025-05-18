// Firebase Storage CORS proxy service worker
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Only intercept Firebase Storage requests
  if (url.hostname === 'firebasestorage.googleapis.com') {
    console.log('[Storage Proxy] Intercepting Firebase Storage request:', url.toString());
    
    // Create a new request with CORS headers
    const modifiedRequest = new Request(event.request, {
      mode: 'cors',
      credentials: 'include',
      headers: new Headers({
        ...Object.fromEntries(event.request.headers.entries()),
        'Origin': self.location.origin,
        'Access-Control-Request-Method': event.request.method,
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      })
    });

    // Use a no-cors fetch as a fallback if the normal one fails
    const fetchPromise = fetch(modifiedRequest)
      .catch(error => {
        console.warn('[Storage Proxy] Standard fetch failed, trying no-cors mode:', error);
        return fetch(event.request.url, { 
          mode: 'no-cors',
          credentials: 'include'
        });
      });

    event.respondWith(fetchPromise);
  }
});

// Handle service worker installation and activation
self.addEventListener('install', event => {
  console.log('[Storage Proxy] Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[Storage Proxy] Service Worker activating');
  event.waitUntil(self.clients.claim());
}); 