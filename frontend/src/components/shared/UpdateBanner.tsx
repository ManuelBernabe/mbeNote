import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useAppUpdate } from '../../hooks/useAppUpdate';

export function UpdateBanner() {
  const { needsRefresh, applyUpdate } = useAppUpdate();

  return (
    <AnimatePresence>
      {needsRefresh && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed left-0 right-0 top-14 z-50 flex items-center justify-between gap-3 bg-blue-600 px-4 py-2.5 shadow-lg md:top-16"
        >
          <p className="text-sm font-medium text-white">
            Nueva versión disponible
          </p>
          <button
            onClick={applyUpdate}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50 active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
