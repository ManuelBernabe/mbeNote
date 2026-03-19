import { useEffect, useState, useCallback, useRef } from 'react';

const VERSION_KEY = 'mbenote_server_version';

async function fetchServerVersion(): Promise<string | null> {
  try {
    const res = await fetch('/api/version', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.version ?? null;
  } catch {
    return null;
  }
}

export function useAppUpdate() {
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    // Store the server version on first load so we can compare later
    fetchServerVersion().then((v) => {
      if (v && !localStorage.getItem(VERSION_KEY)) {
        localStorage.setItem(VERSION_KEY, v);
      }
    });

    if (!('serviceWorker' in navigator)) return;

    const onControllerChange = () => {
      if (mountedRef.current) setNeedsRefresh(true);
    };

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    navigator.serviceWorker.ready.then((reg) => {
      if (!mountedRef.current) return;
      registrationRef.current = reg;

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
    // 1. Check server version (most reliable for Railway deploys)
    const stored = localStorage.getItem(VERSION_KEY);
    const current = await fetchServerVersion();

    if (current && stored && current !== stored) {
      // New deploy detected — store the new version and signal update
      localStorage.setItem(VERSION_KEY, current);
      if (mountedRef.current) setNeedsRefresh(true);
      return true;
    }

    // 2. Also trigger SW update check as a secondary mechanism
    const reg = registrationRef.current;
    if (!reg) return false;

    return new Promise((resolve) => {
      let resolved = false;
      const done = (found: boolean) => {
        if (!resolved) { resolved = true; resolve(found); }
      };

      const onUpdateFound = () => {
        done(true);
        if (mountedRef.current) setNeedsRefresh(true);
      };

      reg.addEventListener('updatefound', onUpdateFound, { once: true });

      reg.update()
        .then(() => {
          setTimeout(() => {
            reg.removeEventListener('updatefound', onUpdateFound);
            done(false);
          }, 1000);
        })
        .catch(() => {
          reg.removeEventListener('updatefound', onUpdateFound);
          done(false);
        });
    });
  }, []);

  const applyUpdate = useCallback(() => {
    const reg = registrationRef.current;
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    // Clear stored version so it's re-fetched fresh after reload
    localStorage.removeItem(VERSION_KEY);
    window.location.href = window.location.origin + window.location.pathname + '?v=' + Date.now();
  }, []);

  return { needsRefresh, checkForUpdate, applyUpdate };
}
