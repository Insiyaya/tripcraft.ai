import { Link, useLocation } from 'react-router-dom';
import { Plane, Sun, Moon, Monitor, Plus } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

const THEME_OPTIONS = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
  { value: 'system' as const, icon: Monitor, label: 'System' },
];

export default function Header() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

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
      </div>
    </header>
  );
}
