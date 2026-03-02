import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { googleLogin } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    try {
      const data = await googleLogin(credentialResponse.credential);
      setAuth(data.user, data.access_token);
      navigate('/trips');
    } catch (err) {
      console.error('Login failed:', err);
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
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => console.error('Google login error')}
            theme="outline"
            size="large"
            shape="pill"
            width="280"
          />
        </div>

        <p className="text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
          By signing in, you agree to let us store your trip data.
        </p>
      </motion.div>
    </div>
  );
}
