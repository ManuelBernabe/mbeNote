import React, { useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { AppProviders } from './providers/AppProviders';
import { RootLayout } from './layouts/RootLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { LoginPage } from './features/auth/LoginPage';
import { RegisterPage } from './features/auth/RegisterPage';
import { DashboardPage } from './features/dashboard/DashboardPage';
import { RemindersPage } from './features/reminders/RemindersPage';
import { CalendarPage } from './features/calendar/CalendarPage';
import { HistoryPage } from './features/history/HistoryPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { SettingsPage } from './features/settings/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Handles navigation triggered by push notification taps.
// Uses Cache API as the primary mechanism (no timing issues on iOS)
// and postMessage as a fast-path fallback.
function NotificationClickHandler() {
  const navigate = useNavigate();

  const handleNotificationUrl = React.useCallback((raw: string) => {
    try {
      const parsed = new URL(raw, window.location.origin);
      navigate(parsed.pathname + parsed.search, { replace: false });
    } catch {
      navigate(raw, { replace: false });
    }
  }, [navigate]);

  // Primary: read pending URL from Cache API (written by SW, survives timing gaps)
  useEffect(() => {
    const consumePending = async () => {
      if (!('caches' in window)) return;
      try {
        const cache = await caches.open('mbenote-pending');
        const r = await cache.match('nav');
        if (!r) return;
        const url = await r.text();
        await cache.delete('nav');
        handleNotificationUrl(url);
      } catch { /* ignore */ }
    };

    consumePending(); // Check on mount (app opened from closed state)

    // Check when app becomes visible again (iOS background → foreground)
    const onVisible = () => { if (document.visibilityState === 'visible') consumePending(); };
    // Also check on focus — covers the case where the app was already visible
    // (visibilitychange doesn't fire) but the user tapped a notification
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', consumePending);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', consumePending);
    };
  }, [handleNotificationUrl]);

  // Fast-path: postMessage (works if listener is already up when message arrives)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== 'NOTIFICATION_CLICK') return;
      handleNotificationUrl(event.data.url || '/reminders');
    };
    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [handleNotificationUrl]);

  return null;
}

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <NotificationClickHandler />
        <Routes>
          {/* Auth routes */}
          <Route
            element={
              <PublicRoute>
                <AuthLayout />
              </PublicRoute>
            }
          >
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected app routes */}
          <Route
            element={
              <ProtectedRoute>
                <RootLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/reminders" element={<RemindersPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProviders>
  );
}
