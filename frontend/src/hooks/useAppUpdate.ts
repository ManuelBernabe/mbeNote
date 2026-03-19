import { useEffect, useState, useCallback, useRef } from 'react';

export function useAppUpdate() {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    if (!('serviceWorker' in navigator)) return;

    const onControllerChange = () => {
      if (mountedRef.current) setNeedsRefresh(true);
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    navigator.serviceWorker.ready.then((reg) => {
      if (!mountedRef.current) return;
      registrationRef.current = reg;

      // Already a waiting SW on load (e.g. user had the tab open during deploy)
      if (reg.waiting) {
        setNeedsRefresh(true);
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            if (mountedRef.current) setNeedsRefresh(true);
          }
        });
      });
    });

    return () => {
      mountedRef.current = false;
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  const checkForUpdate = useCallback(async (): Promise<boolean> => {
    const reg = registrationRef.current;
    if (!reg) return false;
    try {
      await reg.update();
      return true;
    } catch {
      return false;
    }
  }, []);

  const applyUpdate = useCallback(() => {
    const reg = registrationRef.current;
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Hard reload — forces re-fetch of index.html ignoring browser cache
    window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
  }, []);

  return { needsRefresh, checkForUpdate, applyUpdate };
}
