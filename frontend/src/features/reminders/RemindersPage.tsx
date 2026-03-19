import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, LayoutGrid, List, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { useReminders } from '../../hooks/useReminders';
import { cn } from '../../lib/utils';
import type { ReminderResponse } from '../../types';
import { ReminderStatus, ReminderPriority } from '../../types';
import { ReminderCard } from './components/ReminderCard';
import { ReminderFilters } from './components/ReminderFilters';
import { ReminderForm } from './components/ReminderForm';
import { ReminderDetail } from './components/ReminderDetail';

export function RemindersPage() {
  const { data: remindersData, refetch } = useReminders();
  const reminders = remindersData?.items ?? [];

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderResponse | null>(null);
  const [detailReminder, setDetailReminder] = useState<ReminderResponse | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = useMemo(() => {
    return reminders.filter((r) => {
      if (
        search &&
        !r.title.toLowerCase().includes(search.toLowerCase()) &&
        !(r.description ?? '').toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (statusFilter !== 'all' && String(r.status) !== statusFilter) return false;
      if (priorityFilter !== 'all' && String(r.priority) !== priorityFilter) return false;
      if (categoryFilter !== 'all' && String(r.categoryId) !== categoryFilter) return false;
      return true;
    });
  }, [reminders, search, statusFilter, priorityFilter, categoryFilter]);

  const handleEdit = (reminder: ReminderResponse) => {
    setEditingReminder(reminder);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingReminder(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Avisos
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} aviso{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                viewMode === 'grid'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'rounded-md p-1.5 transition-colors',
                viewMode === 'list'
                  ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary gap-2"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nuevo aviso</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <ReminderFilters
        search={search}
        onSearchChange={setSearch}
        status={statusFilter}
        onStatusChange={setStatusFilter}
        priority={priorityFilter}
        onPriorityChange={setPriorityFilter}
        category={categoryFilter}
        onCategoryChange={setCategoryFilter}
      />

      {/* Reminders */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
            <Inbox className="h-8 w-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No hay avisos
          </h3>
          <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
            {search || statusFilter !== 'all'
              ? 'No se encontraron avisos con los filtros seleccionados'
              : 'Crea tu primer aviso para empezar a organizarte'}
          </p>
          {!search && statusFilter === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary mt-4 gap-2"
            >
              <Plus className="h-4 w-4" /> Crear aviso
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
              : 'space-y-3'
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((reminder) => (
              <motion.div
                key={reminder.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <ReminderCard
                  reminder={reminder}
                  viewMode={viewMode}
                  onEdit={() => handleEdit(reminder)}
                  onDetail={() => setDetailReminder(reminder)}
                  onRefresh={refetch}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* FAB for mobile */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 transition-all hover:bg-blue-600 hover:shadow-xl active:scale-95 md:bottom-6 md:right-6 md:hidden"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <ReminderForm
            reminder={editingReminder}
            onClose={handleFormClose}
            onSaved={() => {
              handleFormClose();
              refetch();
              toast.success(
                editingReminder ? 'Aviso actualizado' : 'Aviso creado'
              );
            }}
          />
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailReminder && (
          <ReminderDetail
            reminder={detailReminder}
            onClose={() => setDetailReminder(null)}
            onEdit={() => {
              handleEdit(detailReminder);
              setDetailReminder(null);
            }}
            onRefresh={refetch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
