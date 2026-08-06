import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Sparkles, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { normalizeRole, dashboardPathForRole, ROLE_LABELS } from '../lib/roles';

/**
 * Signed-in account control for the public header.
 *
 * The public site previously rendered a Login button unconditionally, so a
 * signed-in visitor browsing the marketing pages was told to log in again and
 * had no route back to their dashboard — and no way to sign out at all,
 * because logout only existed inside the dashboard shell.
 */
const AccountMenu = () => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  useEffect(() => setOpen(false), [location]);

  // Signed out: the original call to action, unchanged.
  if (!user) {
    return (
      <Link
        to="/login"
        state={{ from: location.pathname + location.search }}
        className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand transition-transform hover:scale-105 shadow-md"
      >
        Login
      </Link>
    );
  }

  const role = normalizeRole(user.role);
  const dashboard = dashboardPathForRole(role);
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
  const initial = (user.firstName?.[0] || user.email?.[0] || 'U').toUpperCase();

  /* A site user's dashboard IS the toolkit, so listing both would be two
     links to the same page. Students and admins get it as a separate entry
     because their dashboard is somewhere else entirely. */
  const showToolsLink = role !== 'site_user';

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

  const itemClass =
    'flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-muted transition-colors hover:bg-elevate hover:text-strong';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${fullName}`}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-elevate"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-orange text-sm font-bold text-on-brand">
          {initial}
        </span>
        <ChevronDown
          size={16}
          className={`text-text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-bg-surface shadow-2xl"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="truncate text-sm font-semibold text-strong">{fullName}</p>
            <p className="truncate text-xs text-text-muted">{ROLE_LABELS[role]}</p>
          </div>

          <div className="py-1">
            <Link to={dashboard} role="menuitem" className={itemClass}>
              <LayoutDashboard size={16} />
              Dashboard
            </Link>

            {showToolsLink && (
              <Link to="/dashboard/tools" role="menuitem" className={itemClass}>
                <Sparkles size={16} />
                AI Career Tools
              </Link>
            )}
          </div>

          <div className="border-t border-line py-1">
            <button
              onClick={handleLogout}
              role="menuitem"
              className={`${itemClass} hover:bg-red-500/10 hover:text-red-400`}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountMenu;
