import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { iAssistAPI } from '../services/api';
import { Monitor, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

const DesktopAuthorize = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();

  const port = searchParams.get('port');
  const state = searchParams.get('state');

  const [status, setStatus] = useState<'idle' | 'authorizing' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const isValid = port && state && /^\d+$/.test(port);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const returnUrl = `/desktop-authorize?port=${port}&state=${state}`;
      navigate(`/login?redirect=${encodeURIComponent(returnUrl)}`);
    }
  }, [authLoading, isAuthenticated, navigate, port, state]);

  const handleAuthorize = async () => {
    if (!isValid || !state) return;

    setStatus('authorizing');
    setError('');

    try {
      const res = await iAssistAPI.authorizeDesktop(state);
      const code = res.data.code;

      setStatus('success');

      setTimeout(() => {
        window.location.href = `http://127.0.0.1:${port}/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;
      }, 500);
    } catch (err: any) {
      setStatus('error');
      setError(err.response?.data?.message || 'Authorization failed. Please try again.');
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-canvas px-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-line bg-bg-card p-8 shadow-2xl">

        {/* Header */}
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight">
            <span className="text-brand-orange">NxtGen</span>
            <span className="text-strong ml-1">I-Assist</span>
          </h2>
          <p className="mt-1 text-sm text-text-muted">Desktop App Authorization</p>
        </div>

        {!isValid ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg bg-red-500/10 p-4 border border-red-500/20">
              <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-500">Invalid Authorization Request</p>
                <p className="mt-1 text-xs text-text-muted">
                  This page was opened with missing or invalid parameters.
                  Please try again from the I-Assist desktop app.
                </p>
              </div>
            </div>
          </div>
        ) : status === 'success' ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <ShieldCheck size={32} className="text-green-500" />
            </div>
            <div>
              <p className="text-lg font-semibold text-strong">Authorization Successful</p>
              <p className="mt-1 text-sm text-text-muted">
                Redirecting back to the desktop app...
              </p>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-bg-surface">
              <div className="h-full animate-pulse rounded-full bg-green-500" style={{ width: '100%' }} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User info */}
            <div className="flex items-center gap-3 rounded-lg border border-line bg-bg-surface p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-on-brand font-bold text-sm">
                {(user?.firstName || user?.email || '?').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-strong truncate">
                  {user?.firstName && user?.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user?.email}
                </p>
                <p className="text-xs text-text-muted truncate">{user?.email}</p>
              </div>
            </div>

            {/* What you're authorizing */}
            <div className="space-y-3">
              <p className="text-sm text-text-muted">
                The I-Assist desktop app is requesting access to your account:
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-strong/80">
                  <Monitor size={16} className="text-brand-orange flex-shrink-0" />
                  <span>Start and manage interview sessions</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-strong/80">
                  <Monitor size={16} className="text-brand-orange flex-shrink-0" />
                  <span>Access your assistants and context documents</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-strong/80">
                  <Monitor size={16} className="text-brand-orange flex-shrink-0" />
                  <span>Use AI transcription and query features</span>
                </div>
              </div>
            </div>

            {/* Error */}
            {status === 'error' && (
              <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => window.close()}
                className="flex-1 rounded-lg border border-line bg-bg-surface px-4 py-3 text-sm font-medium text-strong transition-colors hover:bg-elevate"
              >
                Cancel
              </button>
              <button
                onClick={handleAuthorize}
                disabled={status === 'authorizing'}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-brand-orange px-4 py-3 text-sm font-medium text-on-brand transition-colors hover:bg-orange-600 disabled:opacity-50"
              >
                {status === 'authorizing' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Authorizing...
                  </>
                ) : (
                  'Authorize'
                )}
              </button>
            </div>

            <p className="text-center text-xs text-text-muted">
              This will grant the desktop app access to your I-Assist account.
              You can revoke access by signing out from the desktop app.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesktopAuthorize;
