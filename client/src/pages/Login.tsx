import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { normalizeRole, dashboardPathForRole } from '../lib/roles';
import { authAPI } from '../services/api';
import { clsx } from 'clsx';
import { GitBranch, Mail, Lock, User as UserIcon } from 'lucide-react';

const Login = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginWithGoogle, loginWithGitHub } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /* Where to go after signing in.
     A visitor sent here mid-task (saving a résumé, exporting) returns to
     exactly what they were doing — dropping them on a dashboard would lose
     their place and imply work they haven't done. Only fall back to the
     role's dashboard when they came to /login directly. */
  const returnTo = (role: string) => {
    const from = (location.state as { from?: string } | null)?.from;
    return from && from !== '/login' ? from : dashboardPathForRole(role as any);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login(email, password);
      const role = normalizeRole(res.data.user?.role);
      const accessToken = res.data.tokens?.accessToken || res.data.token;
      const refreshToken = res.data.tokens?.refreshToken || res.data.refreshToken;
      await login(accessToken, refreshToken, { ...res.data.user, role });
      navigate(returnTo(role));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.register({ email, password, firstName, lastName });
      const role = normalizeRole(res.data.user?.role);
      const accessToken = res.data.tokens?.accessToken || res.data.token;
      const refreshToken = res.data.tokens?.refreshToken || res.data.refreshToken;
      await login(accessToken, refreshToken, { ...res.data.user, role });
      navigate(returnTo(role));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-line bg-bg-card p-8 shadow-2xl backdrop-blur-sm animate-fade-in-up">

        <div className="text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight">
            <span className="text-brand-orange">NxtGen</span>
            <span className="text-strong ml-1">Academy</span>
          </h2>
          <p className="mt-2 text-sm text-text-muted">Welcome back to the future of learning.</p>
        </div>

        <div className="flex rounded-lg bg-bg-surface p-1">
          <button
            onClick={() => setActiveTab('login')}
            className={clsx(
              "w-1/2 rounded-md py-2 text-sm font-medium transition-all",
              activeTab === 'login' ? "bg-bg-card text-strong shadow" : "text-text-muted hover:text-strong"
            )}
          >
            Student Login
          </button>
          <button
            onClick={() => setActiveTab('signup')}
            className={clsx(
              "w-1/2 rounded-md py-2 text-sm font-medium transition-all",
              activeTab === 'signup' ? "bg-bg-card text-strong shadow" : "text-text-muted hover:text-strong"
            )}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-500/10 p-3 text-sm text-red-500 border border-red-500/20">
            {error}
          </div>
        )}

        {activeTab === 'login' ? (
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4 rounded-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-lg border border-line bg-bg-surface py-3 pl-10 pr-3 text-strong placeholder-text-muted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange sm:text-sm transition-colors"
                  placeholder="Email address"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-lg border border-line bg-bg-surface py-3 pl-10 pr-3 text-strong placeholder-text-muted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange sm:text-sm transition-colors"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input id="remember-me" type="checkbox" className="h-4 w-4 rounded border-line bg-bg-surface text-brand-orange focus:ring-brand-orange focus:ring-offset-bg-canvas" />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-text-muted">Remember me</label>
              </div>
              <div className="text-sm">
                <a href="#" className="font-medium text-brand-orange hover:text-orange-400">Forgot Password?</a>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-brand-orange px-4 py-3 text-sm font-medium text-on-brand hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-bg-canvas transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={loginWithGoogle} className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-bg-surface px-4 py-2.5 text-sm font-medium text-strong transition-colors hover:bg-elevate">
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                Google
              </button>
              <button onClick={loginWithGitHub} className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-bg-surface px-4 py-2.5 text-sm font-medium text-strong transition-colors hover:bg-elevate">
                <GitBranch size={20} />
                GitHub
              </button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-line"></div></div>
              <div className="relative flex justify-center text-sm"><span className="bg-bg-card px-2 text-text-muted">or continue with email</span></div>
            </div>

            <form className="space-y-4" onSubmit={handleSignup}>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted"><UserIcon size={18} /></div>
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="block w-full rounded-lg border border-line bg-bg-surface py-3 pl-10 pr-3 text-strong placeholder-text-muted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange sm:text-sm transition-colors" placeholder="First Name" />
                </div>
                <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} className="block w-full rounded-lg border border-line bg-bg-surface py-3 px-3 text-strong placeholder-text-muted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange sm:text-sm transition-colors" placeholder="Last Name" />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted"><Mail size={18} /></div>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full rounded-lg border border-line bg-bg-surface py-3 pl-10 pr-3 text-strong placeholder-text-muted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange sm:text-sm transition-colors" placeholder="Email address" />
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-muted"><Lock size={18} /></div>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full rounded-lg border border-line bg-bg-surface py-3 pl-10 pr-3 text-strong placeholder-text-muted focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange sm:text-sm transition-colors" placeholder="Password" />
              </div>
              <button type="submit" disabled={loading} className="group relative flex w-full justify-center rounded-lg bg-brand-orange px-4 py-3 text-sm font-medium text-on-brand hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-brand-orange focus:ring-offset-2 focus:ring-offset-bg-canvas transition-colors disabled:opacity-50">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
