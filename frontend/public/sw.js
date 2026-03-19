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
    // 1. Always write to Cache API first — this is the most reliable mechanism on iOS
    //    because it survives JS suspension and app-open-from-closed-state timing gaps.
    caches.open('mbenote-pending').then(cache =>
      cache.put('nav', new Response(url))
    ).then(() =>
      clients.matchAll({ type: 'window', includeUncontrolled: true })
    ).then((clientList) => {
      const appClient = clientList.find(c => c.url.startsWith(self.location.origin));

      if (appClient) {
        // 2. BroadcastChannel — more reliable than postMessage on iOS Safari PWA
        //    (Safari 15.4+ supported; shared channel lets the page receive even after SW
        //    has already closed its message port)
        try {
          new BroadcastChannel('mbenote-nav').postMessage({ type: 'NOTIFICATION_CLICK', url });
        } catch (e) { /* BroadcastChannel not supported */ }

        // 3. postMessage as fast-path fallback (works when page JS is still running)
        //    NOTE: do NOT use WindowClient.navigate() — it causes a full page reload,
        //    returns null for uncontrolled clients (silent failure), and is unsupported
        //    on iOS Safari PWA.
        try { appClient.postMessage({ type: 'NOTIFICATION_CLICK', url }); } catch (e) {}

        return appClient.focus();
      }

      // App was closed — open with the full absolute URL.
      // The page will read the pending URL from Cache API on mount.
      return clients.openWindow(new URL(url, self.location.origin).href);
    })
  );
});

// Do NOT auto-close notifications - let the user dismiss them manually
// No notificationclose listener needed
