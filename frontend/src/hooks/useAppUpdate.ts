import { useEffect, useState, useCallback } from 'react';

export function useAppUpdate() {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    // Get current registration
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) setRegistration(reg);
    });

    // When a new SW takes control (skipWaiting already called in sw.js install),
    // prompt the user to reload to get the new version
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        setNeedsRefresh(true);
      }
    });

    // Also detect if there's already a waiting SW on load
    navigator.serviceWorker.ready.then((reg) => {
      setRegistration(reg);
      if (reg.waiting) {
        setNeedsRefresh(true);
      }

      // Listen for new SW installing
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setNeedsRefresh(true);
          }
        });
      });
    });
  }, []);

  const checkForUpdate = useCallback(async () => {
    if (!registration) return false;
    try {
      await registration.update();
      return true;
    } catch {
      return false;
    }
  }, [registration]);

  const applyUpdate = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  }, [registration]);

  return { needsRefresh, checkForUpdate, applyUpdate };
}
