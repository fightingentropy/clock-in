const CACHE_NAME = 'clock-in-hq-v2';
const OFFLINE_URLS = ['/login'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET' || request.headers.get('range')) {
    return;
  }

  const shouldHandle = new URL(request.url).origin === self.location.origin;

  if (request.mode === 'navigate' && shouldHandle) {
    event.respondWith(handleNavigationRequest(request));
    return;
  }

  if (!shouldHandle) {
    return;
  }

  event.respondWith(handleAssetRequest(request));
});

async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      redirect: 'follow',
      credentials: 'include',
    });

    if (networkResponse?.type === 'opaqueredirect') {
      return fetch('/login', { redirect: 'follow' });
    }

    if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    const fallback = await caches.match('/login');
    return fallback ?? Response.error();
  }
}

async function handleAssetRequest(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    return (await caches.match('/login')) ?? Response.error();
  }
}
