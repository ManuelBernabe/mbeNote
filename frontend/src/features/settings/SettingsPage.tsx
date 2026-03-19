import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Monitor,
  Plus,
  Edit3,
  Trash2,
  Bell,
  Calendar as CalendarIcon,
  Palette,
  X,
  Check,
  Loader2,
  RefreshCw,
  Smartphone,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { useUIStore, type Theme } from '../../stores/uiStore';
import { useAppUpdate } from '../../hooks/useAppUpdate';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../../hooks/useCategories';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const presetColors = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#6366f1', '#d946ef', '#f43f5e', '#14b8a6',
];

export function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const { needsRefresh, checkForUpdate, applyUpdate } = useAppUpdate();
  const [checking, setChecking] = useState(false);
  const { data: categories = [] } = useCategories();
  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  // Category management
  const [editingCategory, setEditingCategory] = useState<{
    id: number;
    name: string;
    color: string;
  } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      await createCategoryMutation.mutateAsync({
        name: newCategoryName.trim(),
        color: newCategoryColor,
      });
      toast.success('Categoría creada');
      setNewCategoryName('');
      setNewCategoryColor('#3b82f6');
      setShowAddCategory(false);
    } catch {
      toast.error('Error al crear categoría');
    }
  };

  const handleUpdateCategory = async (id: number) => {
    if (!editingCategory) return;
    try {
      await updateCategoryMutation.mutateAsync({
        id: String(id),
        data: {
          name: editingCategory.name,
          color: editingCategory.color,
        },
      });
      toast.success('Categoría actualizada');
      setEditingCategory(null);
    } catch {
      toast.error('Error al actualizar');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await deleteCategoryMutation.mutateAsync(String(id));
      toast.success('Categoría eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-2xl space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Configuración
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Personaliza tu experiencia
        </p>
      </div>

      {/* Theme */}
      <motion.section variants={itemVariants} className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Palette className="h-5 w-5 text-blue-500" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Apariencia
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {([
            { key: 'light' as Theme, label: 'Claro', icon: Sun },
            { key: 'dark' as Theme, label: 'Oscuro', icon: Moon },
          ]).map((opt) => (
            <button
              key={opt.key}
              onClick={() => handleThemeChange(opt.key)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all',
                theme === opt.key
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-500/10'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
              )}
            >
              <opt.icon
                className={cn(
                  'h-6 w-6',
                  theme === opt.key
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-slate-400'
                )}
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  theme === opt.key
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300'
                )}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Categories */}
      <motion.section variants={itemVariants} className="card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-violet-500" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
              Categorías
            </h2>
          </div>
          <button
            onClick={() => setShowAddCategory(true)}
            className="btn-primary gap-1 py-1.5 text-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Añadir
          </button>
        </div>

        {/* Add form */}
        <AnimatePresence>
          {showAddCategory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Nombre de la categoría"
                    className="input-field flex-1"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    {presetColors.slice(0, 6).map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewCategoryColor(color)}
                        className={cn(
                          'h-7 w-7 rounded-full transition-all',
                          newCategoryColor === color &&
                            'ring-2 ring-offset-2 dark:ring-offset-slate-800'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <button
                    onClick={handleAddCategory}
                    disabled={
                      createCategoryMutation.isPending ||
                      !newCategoryName.trim()
                    }
                    className="btn-primary py-1.5 text-xs"
                  >
                    {createCategoryMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setShowAddCategory(false)}
                    className="btn-ghost py-1.5 text-xs"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category list */}
        <div className="space-y-2">
          {categories.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No hay categorías creadas
            </p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 rounded-lg border border-slate-100 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
              >
                {editingCategory?.id === cat.id ? (
                  <>
                    <div
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: editingCategory.color }}
                    />
                    <input
                      type="text"
                      value={editingCategory.name}
                      onChange={(e) =>
                        setEditingCategory({
                          ...editingCategory,
                          name: e.target.value,
                        })
                      }
                      className="input-field flex-1 py-1"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      {presetColors.slice(0, 4).map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            setEditingCategory({
                              ...editingCategory,
                              color,
                            })
                          }
                          className={cn(
                            'h-5 w-5 rounded-full',
                            editingCategory.color === color &&
                              'ring-2 ring-offset-1'
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <button
                      onClick={() => handleUpdateCategory(cat.id)}
                      className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div
                      className="h-4 w-4 shrink-0 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {cat.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {cat.reminderCount} avisos
                    </span>
                    <button
                      onClick={() =>
                        setEditingCategory({
                          id: cat.id,
                          name: cat.name,
                          color: cat.color ?? '#94a3b8',
                        })
                      }
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </motion.section>

      {/* Notification preferences */}
      <motion.section variants={itemVariants} className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-amber-500" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Notificaciones
          </h2>
        </div>
        <div className="space-y-4">
          {[
            {
              label: 'Notificaciones push',
              description: 'Recibir notificaciones en el navegador',
            },
            {
              label: 'Sonido',
              description: 'Reproducir sonido con las notificaciones',
            },
            {
              label: 'Avisos vencidos',
              description: 'Notificar cuando un aviso se vence',
            },
            {
              label: 'Resumen diario',
              description: 'Enviar un resumen de los avisos del día',
            },
          ].map((pref) => (
            <div
              key={pref.label}
              className="flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {pref.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {pref.description}
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  defaultChecked
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-slate-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/20 dark:bg-slate-700 dark:after:border-slate-600 dark:after:bg-slate-500 dark:peer-checked:after:bg-white" />
              </label>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Calendar connections */}
      <motion.section variants={itemVariants} className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-emerald-500" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Calendarios conectados
          </h2>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Google Calendar', connected: false },
            { name: 'Microsoft Outlook', connected: false },
          ].map((cal) => (
            <div
              key={cal.name}
              className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700"
            >
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {cal.name}
                </p>
                <p className="text-xs text-slate-400">
                  {cal.connected ? 'Conectado' : 'No conectado'}
                </p>
              </div>
              <button
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                  cal.connected
                    ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20'
                    : 'bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:hover:bg-blue-500/20'
                )}
              >
                {cal.connected ? 'Desconectar' : 'Conectar'}
              </button>
            </div>
          ))}
        </div>
      </motion.section>

      {/* App update */}
      <motion.section variants={itemVariants} className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-violet-500" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Aplicación
          </h2>
        </div>
        <div className="space-y-3">
          {needsRefresh ? (
            <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-500/30 dark:bg-blue-500/10">
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Nueva versión disponible
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Pulsa para actualizar ahora
                </p>
              </div>
              <button
                onClick={applyUpdate}
                className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600 active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Actualizar
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3 dark:border-slate-700">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Buscar actualizaciones
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Comprueba si hay una versión nueva disponible
                </p>
              </div>
              <button
                onClick={async () => {
                  setChecking(true);
                  const found = await checkForUpdate();
                  setChecking(false);
                  if (!found) toast.success('La app está al día');
                }}
                disabled={checking}
                className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 disabled:opacity-50 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', checking && 'animate-spin')} />
                {checking ? 'Comprobando…' : 'Comprobar'}
              </button>
            </div>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
}
