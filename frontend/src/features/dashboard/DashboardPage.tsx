import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Plus,
  Flag,
} from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useReminders, useUpcoming, useOverdue } from '../../hooks/useReminders';
import { useCategories } from '../../hooks/useCategories';
import { ReminderStatus, ReminderPriority } from '../../types';
import type { ReminderResponse } from '../../types';
import { QuickActions } from './components/QuickActions';
import { UpcomingWidget } from './components/UpcomingWidget';
import { OverdueWidget } from './components/OverdueWidget';
import { ReminderForm } from '../reminders/components/ReminderForm';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: remindersData, refetch } = useReminders();
  const { data: upcoming = [] } = useUpcoming(5);
  const { data: overdue = [] } = useOverdue();
  const { data: categories = [] } = useCategories();
  const [showForm, setShowForm] = useState(false);

  const reminders = remindersData?.items ?? [];
  const now = new Date();

  const activeReminders = reminders.filter((r) => r.status === ReminderStatus.Active);
  const dueToday = activeReminders.filter((r) => isSameDay(new Date(r.startDateTime), now));
  const completedReminders = reminders.filter((r) => r.status === ReminderStatus.Completed);
  const scheduledReminders = activeReminders.filter((r) => new Date(r.startDateTime) > now);
  const overdueCount = overdue.length;

  // Greeting based on time
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-5">
      {/* Greeting */}
      <motion.div variants={itemVariants}>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          {greeting}
        </h1>
        <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
          {format(now, "EEEE, d 'de' MMMM", { locale: es })}
        </p>
      </motion.div>

      {/* iOS-style summary cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
        {/* Hoy */}
        <button
          onClick={() => navigate('/reminders?status=0')}
          className="flex flex-col rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 p-4 text-left text-white shadow-md transition-transform active:scale-[0.97]"
        >
          <Calendar className="mb-2 h-7 w-7 opacity-90" />
          <span className="text-2xl font-bold">{dueToday.length}</span>
          <span className="text-sm font-medium opacity-90">Hoy</span>
        </button>

        {/* Programados */}
        <button
          onClick={() => navigate('/reminders?status=0')}
          className="flex flex-col rounded-2xl bg-gradient-to-br from-red-400 to-red-600 p-4 text-left text-white shadow-md transition-transform active:scale-[0.97]"
        >
          <Clock className="mb-2 h-7 w-7 opacity-90" />
          <span className="text-2xl font-bold">{scheduledReminders.length}</span>
          <span className="text-sm font-medium opacity-90">Programados</span>
        </button>

        {/* Todos */}
        <button
          onClick={() => navigate('/reminders')}
          className="flex flex-col rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 p-4 text-left text-white shadow-md transition-transform active:scale-[0.97]"
        >
          <CalendarCheck className="mb-2 h-7 w-7 opacity-90" />
          <span className="text-2xl font-bold">{reminders.length}</span>
          <span className="text-sm font-medium opacity-90">Todos</span>
        </button>

        {/* Vencidos */}
        <button
          onClick={() => navigate('/reminders')}
          className={cn(
            "flex flex-col rounded-2xl p-4 text-left text-white shadow-md transition-transform active:scale-[0.97]",
            overdueCount > 0
              ? "bg-gradient-to-br from-orange-400 to-orange-600"
              : "bg-gradient-to-br from-amber-400 to-amber-500"
          )}
        >
          <AlertTriangle className="mb-2 h-7 w-7 opacity-90" />
          <span className="text-2xl font-bold">{overdueCount}</span>
          <span className="text-sm font-medium opacity-90">Vencidos</span>
        </button>

        {/* Completados */}
        <button
          onClick={() => navigate('/reminders?status=1')}
          className="flex flex-col rounded-2xl bg-gradient-to-br from-gray-400 to-gray-500 p-4 text-left text-white shadow-md transition-transform active:scale-[0.97]"
        >
          <CheckCircle2 className="mb-2 h-7 w-7 opacity-90" />
          <span className="text-2xl font-bold">{completedReminders.length}</span>
          <span className="text-sm font-medium opacity-90">Completados</span>
        </button>
      </motion.div>

      {/* Quick Add */}
      <motion.div variants={itemVariants}>
        <QuickActions />
      </motion.div>

      {/* Categories as list */}
      {categories.length > 0 && (
        <motion.div variants={itemVariants}>
          <h2 className="mb-3 text-base font-semibold text-slate-900 dark:text-white">
            Mis categorías
          </h2>
          <div className="space-y-1.5">
            {categories.map((cat) => {
              const catReminders = activeReminders.filter((r) => r.categoryId === cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/reminders?category=${cat.id}`)}
                  className="flex w-full items-center gap-3 rounded-xl bg-white px-4 py-3 text-left transition-colors hover:bg-slate-50 active:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800"
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-lg"
                    style={{ backgroundColor: cat.color + '20', color: cat.color }}
                  >
                    {cat.icon || '📁'}
                  </div>
                  <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white">
                    {cat.name}
                  </span>
                  <span className="text-sm font-semibold text-slate-400">
                    {catReminders.length}
                  </span>
                  <svg className="h-4 w-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Upcoming */}
      <motion.div variants={itemVariants}>
        <UpcomingWidget reminders={upcoming} />
      </motion.div>

      {/* Overdue */}
      {overdue.length > 0 && (
        <motion.div variants={itemVariants}>
          <OverdueWidget reminders={overdue} />
        </motion.div>
      )}

      {/* FAB for mobile */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-600 hover:shadow-xl active:scale-95 md:bottom-6 md:right-6"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ReminderForm
            onClose={() => setShowForm(false)}
            onSaved={() => {
              setShowForm(false);
              refetch();
              toast.success('Aviso creado');
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
