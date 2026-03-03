import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: 'var(--color-surface-secondary)', color: 'var(--color-text-primary)' }}
      >
        <div className="max-w-md text-center glass rounded-2xl border p-6" style={{ borderColor: 'var(--color-border)' }}>
          <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            A runtime error occurred. Reload to continue.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="gradient-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
