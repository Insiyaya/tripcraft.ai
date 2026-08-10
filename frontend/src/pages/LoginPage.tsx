import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { Plane, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { API_BASE, GOOGLE_CLIENT_ID } from '../utils/constants';

const MIN_PASSWORD_LENGTH = 8;

type Mode = 'login' | 'register';

/**
 * FastAPI sends `detail` as a string for HTTPException but as an array of error
 * objects for request-validation failures, so a bare `data.detail` renders as
 * "[object Object]" on exactly the errors users most need to read.
 */
function parseErrorDetail(data: unknown, status: number): string {
  const detail = (data as { detail?: unknown })?.detail;

  if (typeof detail === 'string' && detail) return detail;

  if (Array.isArray(detail)) {
    const messages = detail
      .map((d: { msg?: string }) => d?.msg)
      .filter((m): m is string => Boolean(m));
    if (messages.length) return messages.join(', ');
  }

  return `Request failed (HTTP ${status})`;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/trips');
    }
  }, [user, navigate]);

  const switchMode = (next: Mode) => {
    setMode(next);
    // Stale errors from the other mode ("account already exists" while the user
    // is now trying to sign in) read as a live failure.
    setError('');
    setPassword('');
  };

  /** Shared tail of every sign-in path: store the session and let the redirect fire. */
  const applyAuth = (payload: { token: string; user: Record<string, unknown> }) => {
    const u = payload.user;
    setAuth(
      {
        id: (u.id || u._id) as string,
        name: u.name as string,
        email: u.email as string,
        picture: u.picture as string | undefined,
      },
      payload.token,
    );
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    const credential = credentialResponse.credential;
    if (!credential) {
      setError('Google returned no credential. Please try again.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const resp = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(parseErrorDetail(data, resp.status));
      }

      applyAuth(await resp.json());
    } catch (err) {
      setSubmitting(false);
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not reach the server. Please try again.',
      );
    }
  };

  // Google Identity Services doesn't pass a reason to onError — it only logs to
  // the console. In practice this fires when the page's origin isn't an
  // Authorized JavaScript origin for the client ID, so name that rather than
  // suggesting a retry that will fail identically.
  const handleGoogleError = () => {
    setSubmitting(false);
    setError(
      `Google rejected the sign-in request from ${window.location.origin}. ` +
        'Check that this exact origin is listed under "Authorized JavaScript origins" ' +
        'for the OAuth client. You can still sign in with your email and password.',
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (mode === 'register' && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const resp = await fetch(`${API_BASE}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'register' ? { name, email, password } : { email, password },
        ),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(parseErrorDetail(data, resp.status));
      }

      applyAuth(await resp.json());
      // Leave `submitting` set — the redirect effect above unmounts this page.
    } catch (err) {
      setSubmitting(false);
      setError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not reach the server. Please try again.',
      );
    }
  };

  const isRegister = mode === 'register';

  const inputStyle = {
    backgroundColor: 'var(--color-surface-tertiary)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-text-primary)',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: 'var(--color-surface-secondary)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl shadow-xl p-10 max-w-sm w-full"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 shadow-lg"
        >
          <Plane className="w-8 h-8 text-white" />
        </motion.div>

        <h1
          className="text-2xl font-bold mb-1 text-center"
          style={{ color: 'var(--color-text-primary)' }}
        >
          TripCraft <span className="gradient-text">AI</span>
        </h1>
        <p className="text-sm mb-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
          {isRegister ? 'Create an account to start planning' : 'Sign in to plan your perfect trip'}
        </p>

        {/* Google sign-in. Rendered only when a client ID is configured, so the
            email/password form below is never blocked by a missing build var. */}
        {GOOGLE_CLIENT_ID && (
          <>
            <div className="flex justify-center" aria-busy={submitting}>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                width="300"
                text={isRegister ? 'signup_with' : 'signin_with'}
              />
            </div>
            <div className="flex items-center gap-3 my-1">
              <span className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                or
              </span>
              <span className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isRegister && (
            <label className="relative block">
              <UserIcon
                className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-text-muted)' }}
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name (optional)"
                autoComplete="name"
                maxLength={100}
                disabled={submitting}
                className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-60"
                style={inputStyle}
              />
            </label>
          )}

          <label className="relative block">
            <Mail
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              disabled={submitting}
              className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-60"
              style={inputStyle}
            />
          </label>

          <label className="relative block">
            <Lock
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-text-muted)' }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              // Tells password managers to offer a new password rather than
              // autofilling the old one, and vice versa.
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              required
              minLength={isRegister ? MIN_PASSWORD_LENGTH : undefined}
              disabled={submitting}
              className="w-full border rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-60"
              style={inputStyle}
            />
          </label>

          {isRegister && (
            <p className="text-xs -mt-1" style={{ color: 'var(--color-text-muted)' }}>
              At least {MIN_PASSWORD_LENGTH} characters.
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="gradient-primary text-white rounded-lg py-2.5 text-sm font-semibold shadow-md hover:shadow-lg transition-shadow disabled:opacity-70 flex items-center justify-center gap-2 mt-1"
          >
            {submitting && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {submitting
              ? isRegister
                ? 'Creating account...'
                : 'Signing in...'
              : isRegister
                ? 'Create account'
                : 'Sign in'}
          </button>
        </form>

        {error && (
          <p className="text-sm mt-4 text-center" style={{ color: '#ef4444' }}>
            {error}
          </p>
        )}

        <p className="text-sm mt-6 text-center" style={{ color: 'var(--color-text-secondary)' }}>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => switchMode(isRegister ? 'login' : 'register')}
            disabled={submitting}
            className="font-medium underline disabled:opacity-60"
            style={{ color: 'var(--color-accent)' }}
          >
            {isRegister ? 'Sign in' : 'Create one'}
          </button>
        </p>

        <p className="text-xs mt-6 text-center" style={{ color: 'var(--color-text-muted)' }}>
          By continuing, you agree to let us store your trip data.
        </p>
      </motion.div>
    </div>
  );
}
