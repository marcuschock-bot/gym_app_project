const CACHE = 'shadowforge-v1';
const STATIC = ['/', '/manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('/api/')) return; // never cache API
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fresh = fetch(e.request).then(res => {
        if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        return res;
      });
      return cached || fresh;
    })
  );
});

// Push notifications
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? { title: 'Shadow Forge', body: 'Time to train, Hunter.' };
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      vibrate: [200, 100, 200],
      tag: 'shadowforge-reminder',
      renotify: true,
    })
  );
});

// Notification click → open app
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});
