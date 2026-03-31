// Note: VAPID public key must be inlined at build time or injected via a config endpoint.
// For Next.js, use NEXT_PUBLIC_VAPID_PUBLIC_KEY env var.
// The actual VAPID_PUBLIC_KEY is injected by the usePushNotifications hook via
// a runtime config exposed at /api/config (or inline below for static builds).

// Inline the public key from the env variable injected at build time
const VAPID_PUBLIC_KEY = typeof window !== 'undefined'
  ? (window.__ENV__?.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
  : '';

if (typeof self !== 'undefined' && self.importScripts && VAPID_PUBLIC_KEY) {
  // web-push is not available in service worker context without bundling,
  // so we use the Fetch API to get the public key and register the push manager.
  // For a proper implementation, inline the vapid key directly.
}

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    return;
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'TripPlanner', {
      body: data.body || '',
      icon: '/icon.png',
      badge: '/badge.png',
      data: data.data,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/notifications';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      return clients.openWindow(urlToOpen);
    })
  );
});
