import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { Plus, LayoutGrid, List, Inbox, ArrowUpDown, CheckSquare, Trash2, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { useReminders, useReminder, useBatchDeleteReminders, useBatchCompleteReminders } from '../../hooks/useReminders';
import { useNotificationStore } from '../../stores/notificationStore';
import { cn } from '../../lib/utils';
import type { ReminderResponse } from '../../types';
import { ReminderStatus, ReminderPriority } from '../../types';
import { ReminderCard } from './components/ReminderCard';
import { ReminderFilters } from './components/ReminderFilters';
import { ReminderForm } from './components/ReminderForm';
import { ReminderDetail } from './components/ReminderDetail';

const FAB_KEY = 'mbenote_fab_pos';

function DraggableFAB({ onClick }: { onClick: () => void }) {
  const getSaved = () => {
    try {
      const s = localStorage.getItem(FAB_KEY);
      return s ? JSON.parse(s) : { x: 0, y: 0 };
    } catch { return { x: 0, y: 0 }; }
  };
  const saved = getSaved();
  const x = useMotionValue(saved.x);
  const y = useMotionValue(saved.y);
  const dragging = useRef(false);

  return (
    <motion.button
      drag
      dragMomentum={false}
      style={{ x, y }}
      onDragStart={() => { dragging.current = true; }}
      onDragEnd={() => {
        localStorage.setItem(FAB_KEY, JSON.stringify({ x: x.get(), y: y.get() }));
        setTimeout(() => { dragging.current = false; }, 50);
      }}
      onClick={() => { if (!dragging.current) onClick(); }}
      className="fixed bottom-20 right-4 z-30 flex h-14 w-14 touch-none items-center justify-center rounded-full bg-blue-500 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-600 active:scale-95 md:bottom-6 md:right-6 md:hidden"
      whileDrag={{ scale: 1.1 }}
    >
      <Plus className="h-6 w-6" />
    </motion.button>
  );
}

export function RemindersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: remindersData, refetch } = useReminders();
  const reminders = remindersData?.items ?? [];

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'date' | 'priority' | 'category'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderResponse | null>(null);
  const [detailReminder, setDetailReminder] = useState<ReminderResponse | null>(null);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const batchDelete = useBatchDeleteReminders();
  const batchComplete = useBatchCompleteReminders();

  // Fetch reminder by ID when navigated from a push notification (?open=ID)
  const openId = searchParams.get('open') ?? '';
  const { data: openedReminder } = useReminder(openId);
  const { setUnreadCount } = useNotificationStore();

  useEffect(() => {
    if (openedReminder) {
      setDetailReminder(openedReminder);
      setSearchParams({}, { replace: true });
      // User has seen the notification — clear the app icon badge
      setUnreadCount(0);
    }
  }, [openedReminder]);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = useMemo(() => {
    const result = reminders.filter((r) => {
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

    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'date') {
        cmp = new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime();
      } else if (sortBy === 'priority') {
        cmp = a.priority - b.priority;
      } else if (sortBy === 'category') {
        const nameA = (a.categoryName ?? '').toLowerCase();
        const nameB = (b.categoryName ?? '').toLowerCase();
        cmp = nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [reminders, search, statusFilter, priorityFilter, categoryFilter, sortBy, sortDir]);

  const toggleSelect = (id: number) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const selectAll = () => setSelectedIds(new Set(filtered.map(r => r.id)));
  const clearSelection = () => { setSelectedIds(new Set()); setSelectionMode(false); };
  const handleBatchDelete = async () => {
    await batchDelete.mutateAsync([...selectedIds]);
    toast.success(`${selectedIds.size} avisos eliminados`);
    clearSelection();
  };
  const handleBatchComplete = async () => {
    await batchComplete.mutateAsync([...selectedIds]);
    toast.success(`${selectedIds.size} avisos completados`);
    clearSelection();
  };

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
          {/* Sort control */}
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const [by, dir] = e.target.value.split('-') as ['date' | 'priority' | 'category', 'asc' | 'desc'];
                setSortBy(by);
                setSortDir(dir);
              }}
              className="bg-transparent text-xs text-slate-600 focus:outline-none dark:text-slate-300"
            >
              <option value="date-asc">Fecha ↑</option>
              <option value="date-desc">Fecha ↓</option>
              <option value="priority-desc">Prioridad</option>
              <option value="category-asc">Categoría</option>
            </select>
          </div>
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
          {!selectionMode && (
            <button
              onClick={() => setSelectionMode(true)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <CheckSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Seleccionar</span>
            </button>
          )}
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
                  selectionMode={selectionMode}
                  selected={selectedIds.has(reminder.id)}
                  onSelect={toggleSelect}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Draggable FAB for mobile */}
      <DraggableFAB onClick={() => setShowForm(true)} />

      {/* Batch selection action bar */}
      <AnimatePresence>
        {selectionMode && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-16 left-0 right-0 z-40 flex items-center justify-center gap-2 px-4 md:bottom-4"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                onClick={selectAll}
                className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Seleccionar todo
              </button>
              {selectedIds.size > 0 && (
                <>
                  <button
                    onClick={handleBatchComplete}
                    className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
                  >
                    <Check className="h-4 w-4" />
                    Completar ({selectedIds.size})
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    className="flex items-center gap-1.5 rounded-lg bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar ({selectedIds.size})
                  </button>
                </>
              )}
              <button
                onClick={clearSelection}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                title="Cancelar selección"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
