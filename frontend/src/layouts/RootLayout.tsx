import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Bell as BellIcon,
  Calendar,
  Clock,
  BarChart3,
  Settings,
  ChevronLeft,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useUIStore } from '../stores/uiStore';
import { useSignalR } from '../hooks/useSignalR';
import { NotificationBell } from '../features/notifications/components/NotificationBell';
import { IOSInstallBanner } from '../components/shared/IOSInstallBanner';
import { UpdateBanner } from '../components/shared/UpdateBanner';

function getUserFromStorage(): { displayName: string; email: string } {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const user = JSON.parse(raw);
      return { displayName: user.displayName || 'Usuario', email: user.email || '' };
    }
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        displayName: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'Usuario',
        email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '',
      };
    }
  } catch {}
  return { displayName: 'Usuario', email: '' };
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/reminders', icon: BellIcon, label: 'Avisos' },
  { to: '/calendar', icon: Calendar, label: 'Calendario' },
  { to: '/history', icon: Clock, label: 'Historial' },
  { to: '/analytics', icon: BarChart3, label: 'Analítica' },
  { to: '/settings', icon: Settings, label: 'Ajustes' },
];

// Bottom tab bar items (subset for mobile)
const tabItems = [
  { to: '/', icon: LayoutDashboard, label: 'Inicio' },
  { to: '/reminders', icon: BellIcon, label: 'Avisos' },
  { to: '/calendar', icon: Calendar, label: 'Calendario' },
  { to: '/analytics', icon: BarChart3, label: 'Analítica' },
  { to: '/settings', icon: Settings, label: 'Ajustes' },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export function RootLayout() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { sidebarOpen, theme, toggleSidebar, setTheme } = useUIStore();
  const isCollapsed = !sidebarOpen && !isMobile;
  const user = useMemo(() => getUserFromStorage(), []);

  useSignalR();

  const handleThemeToggle = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }, [theme, setTheme]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }, []);

  const currentPageLabel = navItems.find(
    (item) => item.to === location.pathname || (item.to === '/' && location.pathname === '/')
  )?.label ?? 'mbeNote';

  // Desktop sidebar content
  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className={cn('flex h-16 items-center border-b border-slate-200 px-4 dark:border-slate-800', isCollapsed ? 'justify-center' : 'gap-3')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500 text-sm font-bold text-white">m</div>
        <AnimatePresence>
          {!isCollapsed && (
            <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="overflow-hidden whitespace-nowrap text-lg font-semibold text-slate-900 dark:text-white">
              mbeNote
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200',
                isCollapsed && 'justify-center px-2'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300')} />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="ml-3 overflow-hidden whitespace-nowrap">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className={cn('border-t border-slate-200 p-3 dark:border-slate-800', isCollapsed && 'flex flex-col items-center gap-2')}>
        <button onClick={handleThemeToggle} className={cn('flex w-full items-center rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800', isCollapsed && 'justify-center px-2')}>
          {theme === 'dark' ? <Sun className="h-5 w-5 shrink-0 text-amber-500" /> : <Moon className="h-5 w-5 shrink-0 text-slate-400" />}
          {!isCollapsed && <span className="ml-3">{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>}
        </button>
        <div className={cn('flex items-center rounded-lg px-3 py-2', isCollapsed && 'justify-center px-2')}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-xs font-semibold text-white">{user.displayName.charAt(0).toUpperCase()}</div>
          {!isCollapsed && (
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{user.displayName}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          )}
        </div>
        <button onClick={handleLogout} className={cn('flex w-full items-center rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-500/10 dark:hover:text-red-400', isCollapsed && 'justify-center px-2')}>
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span className="ml-3">Cerrar sesión</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <motion.aside
          initial={false}
          animate={{ width: sidebarOpen ? 256 : 64 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="relative hidden shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:block"
        >
          {sidebarContent}
          <button onClick={toggleSidebar} className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
            <ChevronLeft className={cn('h-3.5 w-3.5 text-slate-600 transition-transform dark:text-slate-400', !sidebarOpen && 'rotate-180')} />
          </button>
        </motion.aside>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header - simplified for mobile */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 md:h-16 md:px-6">
          <div className="flex items-center gap-3">
            {isMobile && (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500 text-xs font-bold text-white">m</div>
            )}
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              {currentPageLabel}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {isMobile && (
              <>
                <button onClick={handleThemeToggle} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800">
                  {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
                </button>
                <div className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-[10px] font-semibold text-white">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[80px] truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                    {user.displayName}
                  </span>
                </div>
              </>
            )}
            <NotificationBell />
          </div>
        </header>

        {/* Page Content */}
        <main className={cn('flex-1 overflow-y-auto', isMobile && 'pb-20')}>
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/95"
          style={{ transform: 'translateZ(0)', paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex items-center">
            {tabItems.map((item) => {
              const isActive = item.to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.to);
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className="flex w-1/5 flex-col items-center gap-0.5 py-2"
                >
                  <item.icon className={cn('h-5 w-5 shrink-0 transition-colors', isActive ? 'text-blue-500' : 'text-slate-400')} />
                  <span className={cn('w-full truncate text-center text-[10px] font-medium transition-colors', isActive ? 'text-blue-500' : 'text-slate-400')}>
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      )}

      <UpdateBanner />
      <IOSInstallBanner />
    </div>
  );
}
