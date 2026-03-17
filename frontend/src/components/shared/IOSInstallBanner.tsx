import React, { useState, useEffect } from 'react';
import { X, Share, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return (window.matchMedia('(display-mode: standalone)').matches) ||
    ('standalone' in window.navigator && (window.navigator as any).standalone === true);
}

export function IOSInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show on iOS Safari, NOT in standalone PWA mode
    if (isIOS() && !isInStandaloneMode()) {
      const dismissed = localStorage.getItem('ios-install-dismissed');
      if (!dismissed) {
        setShow(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('ios-install-dismissed', Date.now().toString());
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-blue-200 bg-blue-50 px-4 py-3 shadow-lg dark:border-blue-800 dark:bg-blue-950"
        >
          <button
            onClick={handleDismiss}
            className="absolute right-2 top-2 rounded p-1 text-blue-400 hover:text-blue-600"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-lg font-bold text-white">
              m
            </div>
            <div className="flex-1 pr-6">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Instala mbeNote para recibir notificaciones
              </p>
              <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
                Pulsa <Share className="inline h-3.5 w-3.5" /> <strong>Compartir</strong> →{' '}
                <PlusSquare className="inline h-3.5 w-3.5" /> <strong>Añadir a pantalla de inicio</strong>
              </p>
              <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">
                Así recibirás avisos incluso con la app cerrada.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
