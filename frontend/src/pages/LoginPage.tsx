import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SignIn, useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Plane } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { userId, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && userId) {
      navigate('/trips');
    }
  }, [isLoaded, userId, navigate]);

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

        {/* Clerk Sign In */}
        <div className="flex justify-center">
          <SignIn
            routing="hash"
            afterSignInUrl="/trips"
            afterSignUpUrl="/trips"
            appearance={{
              elements: {
                rootBox: 'w-full',
                card: 'shadow-none bg-transparent border-none',
              },
            }}
          />
        </div>

        <p className="text-xs mt-6" style={{ color: 'var(--color-text-muted)' }}>
          By signing in, you agree to let us store your trip data.
        </p>
      </motion.div>
    </div>
  );
}
