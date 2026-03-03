import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Plane, Sun, Moon, Monitor, Plus, LogOut, User } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

const THEME_OPTIONS = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
  { value: 'system' as const, icon: Monitor, label: 'System' },
];

export default function Header() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isSignedIn = !!authUser;
  const userName = authUser?.name || 'User';
  const userEmail = authUser?.email || '';
  const userPicture = authUser?.picture;

  const isActive = (path: string) => location.pathname === path;

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <header className="glass sticky top-0 z-50 px-6 py-3 flex items-center justify-between border-b"
      style={{ borderColor: 'var(--color-border)' }}>
      <Link to="/" className="flex items-center gap-2.5 no-underline">
        <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-md">
          <Plane className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
          TripCraft <span className="gradient-text">AI</span>
        </h1>
      </Link>

      <div className="flex items-center gap-4">
        {/* Theme toggle pill */}
        <div className="flex items-center rounded-full p-0.5"
          style={{ backgroundColor: 'var(--color-surface-tertiary)' }}>
          {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              title={label}
              className="p-1.5 rounded-full transition-all duration-200"
              style={{
                backgroundColor: theme === value ? 'var(--color-surface)' : 'transparent',
                boxShadow: theme === value ? 'var(--shadow-sm)' : 'none',
                color: theme === value ? 'var(--color-accent)' : 'var(--color-text-muted)',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>

        {/* Nav links */}
        {isSignedIn && (
          <nav className="flex items-center gap-1">
            <Link
              to="/trips"
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{
                color: isActive('/trips') ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                backgroundColor: isActive('/trips') ? 'var(--color-accent-light)' : 'transparent',
              }}
            >
              My Trips
            </Link>
            <Link
              to="/planner"
              className="gradient-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-md hover:shadow-lg transition-shadow"
            >
              <Plus className="w-4 h-4" />
              Plan a Trip
            </Link>
          </nav>
        )}

        {/* User menu / Sign in */}
        {isSignedIn && authUser ? (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 rounded-full p-0.5 pr-3 transition-colors"
              style={{ backgroundColor: 'var(--color-surface-tertiary)' }}
            >
              {userPicture ? (
                <img
                  src={userPicture}
                  alt={userName}
                  className="w-7 h-7 rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {userName.split(' ')[0]}
              </span>
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 rounded-xl shadow-lg py-1 z-50 border"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    {userName}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {userEmail}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:opacity-80 transition-opacity"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            to="/login"
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              color: 'var(--color-accent)',
              backgroundColor: 'var(--color-accent-light)',
            }}
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
