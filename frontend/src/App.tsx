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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading…</p>
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
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div>
          <h1 className="text-xl font-semibold mb-2">Missing Google Client ID</h1>
          <p className="text-sm opacity-80">Set VITE_GOOGLE_CLIENT_ID to run the app.</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
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
    </GoogleOAuthProvider>
  );
}
