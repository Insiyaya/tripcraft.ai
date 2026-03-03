import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import TripsListPage from './pages/TripsListPage';
import PlannerPage from './pages/PlannerPage';
import { useUIStore } from './store/uiStore';
import { setAuthTokenGetter } from './api/authToken';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (dark: boolean) => {
      root.classList.toggle('dark', dark);
    };

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches);
      const handler = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      applyTheme(theme === 'dark');
    }
  }, [theme]);

  return <>{children}</>;
}

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useAuth();
  useEffect(() => {
    return () => setAuthTokenGetter(async () => null);
  }, []);

  if (!isLoaded) return null;
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, userId } = useAuth();
  if (!isLoaded) return null;
  if (!userId) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthTokenSync() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken());
  }, [getToken]);

  return null;
}

export default function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div>
          <h1 className="text-xl font-semibold mb-2">Missing Clerk key</h1>
          <p className="text-sm opacity-80">Set `VITE_CLERK_PUBLISHABLE_KEY` to run the app.</p>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <QueryClientProvider client={queryClient}>
        <AuthTokenSync />
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
    </ClerkProvider>
  );
}
