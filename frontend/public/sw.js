// Service Worker for mbeNote push notifications
// This runs in the background even when the app tab is closed

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Allow the page to trigger an update manually
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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
    self.registration.showNotification(data.title, options).then(() => {
      // Update the app icon badge with the unread count
      if ('setAppBadge' in navigator) {
        const count = data.badgeCount;
        if (count != null && count > 0) {
          navigator.setAppBadge(count).catch(() => {});
        } else {
          navigator.setAppBadge().catch(() => {});
        }
      }
    })
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/reminders';

  // Clear the badge immediately when user taps the notification
  if ('clearAppBadge' in self.navigator) {
    self.navigator.clearAppBadge().catch(() => {});
  }

  event.waitUntil(
    // 1. Store the target URL in Cache API (shared between SW and page, no timing issues)
    caches.open('mbenote-pending').then(cache =>
      cache.put('nav', new Response(url))
    ).then(() =>
      clients.matchAll({ type: 'window', includeUncontrolled: true })
    ).then((clientList) => {
      const appClient = clientList.find(c => c.url.startsWith(self.location.origin));

      if (appClient) {
        // Use navigate() to directly change the URL in the existing window (most reliable).
        // This works even if the app was already focused/visible so visibilitychange
        // doesn't fire, and avoids any postMessage delivery race conditions.
        if (appClient.navigate) {
          return appClient.navigate(new URL(url, self.location.origin).href)
            .then(client => client ? client.focus() : null)
            .catch(() => {
              // navigate() not supported or failed — fall back to postMessage
              appClient.postMessage({ type: 'NOTIFICATION_CLICK', url });
              return appClient.focus();
            });
        }
        // Fallback for browsers without WindowClient.navigate()
        appClient.postMessage({ type: 'NOTIFICATION_CLICK', url });
        return appClient.focus();
      }

      // App was closed — open with the full absolute URL
      return clients.openWindow(new URL(url, self.location.origin).href);
    })
  );
});

// Do NOT auto-close notifications - let the user dismiss them manually
// No notificationclose listener needed
