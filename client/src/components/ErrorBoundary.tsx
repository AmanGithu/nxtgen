import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors so a failure shows something actionable instead of a
 * blank white page.
 *
 * Without this, any throw below the router — a bad API shape, a lazy chunk
 * that loaded against a stale module graph after an HMR update — unmounts the
 * whole tree and leaves an empty document. That reads as "the site is down"
 * when it is usually one component and one reload.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Vite forwards this to the dev server terminal, which is where these get
    // noticed — the browser console is rarely open when a tester hits one.
    console.error('Unhandled render error:', error, info.componentStack);
  }

  private reload = () => window.location.reload();

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    /* A stale module graph after an HMR update produces this specific error,
       and a plain reload genuinely fixes it — so say so rather than leaving
       the visitor to guess. */
    const isStaleModule = /must be used within|Cannot read propert|is not a function/.test(error.message);

    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-canvas p-6">
        <div className="w-full max-w-lg rounded-2xl border border-line bg-bg-surface p-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-brand-orange/10 text-brand-orange">
            <AlertTriangle size={22} />
          </div>

          <h1 className="font-display text-xl font-bold text-strong">This page didn&apos;t load</h1>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            {isStaleModule
              ? 'The page was left open while the app was updated. Reloading should fix it.'
              : 'Something went wrong while rendering this page.'}
          </p>

          <button
            onClick={this.reload}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600"
          >
            <RotateCw size={15} />
            Reload the page
          </button>

          {import.meta.env.DEV && (
            <pre className="mt-6 max-h-40 overflow-auto rounded-lg border border-line bg-bg-card p-3 text-left text-[11px] leading-relaxed text-text-muted">
              {error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
