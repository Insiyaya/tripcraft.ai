import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import TripsListPage from './pages/TripsListPage';
import PlannerPage from './pages/PlannerPage';
import { useUIStore } from './store/uiStore';
import { useAuthStore } from './store/authStore';
import { GOOGLE_CLIENT_ID } from './utils/constants';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

/**
 * Mounts the Google OAuth provider only when a client ID is configured.
 *
 * Deliberately not a gate on the whole app: an earlier version rendered a
 * "Missing Google Client ID" screen instead of the site, so one unset build
 * variable took down every page including the ones that never needed Google.
 * Sign-in with email and password has to keep working regardless.
 */
function MaybeGoogleProvider({ children }: { children: React.ReactNode }) {
  if (!GOOGLE_CLIENT_ID) return <>{children}</>;
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>;
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <>{children}</>;
}

function AuthLoader({ children }: { children: React.ReactNode }) {
  const isLoaded = useAuthStore((s) => s.isLoaded);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isLoaded)
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-surface-secondary)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Loading…</p>
        </div>
      </div>
    );
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isLoaded = useAuthStore((s) => s.isLoaded);
  if (!isLoaded) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <MaybeGoogleProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthLoader>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route element={<MainLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route
                    path="/trips"
                    element={
                      <ProtectedRoute>
                        <TripsListPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/planner"
                    element={
                      <ProtectedRoute>
                        <PlannerPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/planner/:tripId"
                    element={
                      <ProtectedRoute>
                        <PlannerPage />
                      </ProtectedRoute>
                    }
                  />
                </Route>
              </Routes>
            </BrowserRouter>
          </AuthLoader>
        </ThemeProvider>
      </QueryClientProvider>
    </MaybeGoogleProvider>
  );
}
