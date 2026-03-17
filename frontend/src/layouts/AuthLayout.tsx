import React from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Decorative background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Branding */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-500/25">
            <span className="text-xl font-bold text-white">m</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            mbeNote
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Gestiona tus avisos y recordatorios
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft dark:border-slate-800 dark:bg-slate-900">
          <Outlet />
        </div>
      </motion.div>
    </div>
  );
}
