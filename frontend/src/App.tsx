import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
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

export function App() {
  return (
    <AppProviders>
      <BrowserRouter>
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
