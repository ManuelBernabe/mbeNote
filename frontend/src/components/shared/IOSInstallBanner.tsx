import React, { useState, useEffect } from 'react';
import { X, Share2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as any).standalone === true)
  );
}

export function IOSInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isIOS() && !isInStandaloneMode()) {
      const dismissed = localStorage.getItem('ios-install-dismissed');
      // Show again after 7 days
      const shouldShow = !dismissed || Date.now() - Number(dismissed) > 7 * 24 * 60 * 60 * 1000;
      if (shouldShow) {
        // Small delay so it doesn't pop immediately
        const t = setTimeout(() => setShow(true), 2000);
        return () => clearTimeout(t);
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
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          // Sit above the bottom tab bar (h-16 = 64px + safe area)
          className="fixed bottom-20 left-3 right-3 z-50 rounded-2xl border border-blue-200 bg-white shadow-xl dark:border-blue-800 dark:bg-slate-900"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-start gap-3 p-4">
            {/* Icon */}
            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl bg-slate-900 dark:bg-slate-700">
              <div className="h-2 w-8 rounded-sm bg-blue-400" />
              <div className="h-2 w-8 rounded-sm bg-rose-400" />
              <div className="h-2 w-8 rounded-sm bg-emerald-400" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Añade mbeNote a tu inicio
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Pulsa{' '}
                <Share2 className="inline h-3.5 w-3.5 text-blue-500" />{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">Compartir</span>
                {' '}→{' '}
                <Plus className="inline h-3.5 w-3.5 text-blue-500" />{' '}
                <span className="font-medium text-slate-700 dark:text-slate-300">Añadir a pantalla de inicio</span>
              </p>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                Recibirás avisos aunque tengas la app cerrada
              </p>
            </div>

            {/* Close */}
            <button
              onClick={handleDismiss}
              className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
