// Service Worker for mbeNote push notifications
// This runs in the background even when the app tab is closed

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Handle incoming push notifications
self.addEventListener('push', (event) => {
  let data = { title: 'mbeNote', body: 'Tienes un aviso', url: '/reminders' };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    data: { url: data.url || '/reminders' },
    // Unique tag per notification so they don't replace each other
    tag: data.tag || ('mbenote-' + Date.now()),
    // Keep notification visible until user interacts with it
    requireInteraction: true,
    // Vibration pattern
    vibrate: [200, 100, 200, 100, 200],
    // Show timestamp
    timestamp: data.timestamp || Date.now(),
    // Renotify even if same tag (in case of updates)
    renotify: true,
    // Keep notification silent=false so it makes sound
    silent: false,
    actions: [
      { action: 'open', title: 'Ver aviso' },
      { action: 'dismiss', title: 'Cerrar' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/reminders';

  if (event.action === 'dismiss') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// Do NOT auto-close notifications - let the user dismiss them manually
// No notificationclose listener needed
