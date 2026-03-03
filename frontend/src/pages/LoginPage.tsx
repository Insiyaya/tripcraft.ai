import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { googleLogin } from '../api/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setErrorMessage('');
    try {
      const data = await googleLogin(credentialResponse.credential);
      setAuth(data.user, data.access_token);
      navigate('/trips');
    } catch (err) {
      console.error('Login failed:', err);
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setErrorMessage('Google token rejected. Verify GOOGLE_CLIENT_ID is the same in Vercel and Render.');
          return;
        }
        if (!err.response) {
          setErrorMessage('Temporary network/CORS issue. Please try again in a few seconds.');
          return;
        }
      }
      setErrorMessage('Sign-in failed. Please try again.');
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
            onError={() => {
              console.error('Google login error');
              setErrorMessage('Google sign-in popup failed. Please retry.');
            }}
            theme="outline"
            size="large"
            shape="pill"
            width="280"
          />
        </div>

        {errorMessage && (
          <p className="text-xs mt-4 text-red-500">
            {errorMessage}
          </p>
        )}

        <p className="text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
          By signing in, you agree to let us store your trip data.
        </p>
      </motion.div>
    </div>
  );
}
