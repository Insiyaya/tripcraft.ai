import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { API_BASE } from '../utils/constants';

export default function LoginPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (user) {
      navigate('/trips');
    }
  }, [user, navigate]);

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    const credential = credentialResponse.credential;
    if (!credential) {
      setError('Google sign-in failed — no credential returned.');
      return;
    }

    setSigningIn(true);
    setError('');

    try {
      const resp = await fetch(`${API_BASE}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || 'Login failed');
      }

      const { token, user: userData } = await resp.json();
      setAuth(
        {
          id: userData.id || userData._id,
          name: userData.name,
          email: userData.email,
          picture: userData.picture,
        },
        token,
      );
    } catch (err) {
      setSigningIn(false);
      setError(err instanceof Error ? err.message : 'Login failed');
    }
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
        className="glass rounded-2xl shadow-xl p-10 max-w-sm w-full text-center"
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

        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          TripCraft <span className="gradient-text">AI</span>
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-secondary)' }}>
          Sign in to plan your perfect trip
        </p>

        {/* Google Sign In */}
        <div className="flex justify-center">
          {signingIn ? (
            <div className="flex flex-col items-center gap-3 py-2">
              <div className="w-8 h-8 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Signing you in... This may take a moment.
              </p>
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed. Please try again.')}
              theme="outline"
              size="large"
              width="300"
            />
          )}
        </div>

        {error && (
          <p className="text-sm mt-4" style={{ color: '#ef4444' }}>
            {error}
          </p>
        )}

        <p className="text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
          By signing in, you agree to let us store your trip data.
        </p>
      </motion.div>
    </div>
  );
}
