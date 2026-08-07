import { Link, Outlet, useLocation } from 'react-router-dom';
import SiteNav from '../components/SiteNav';

const PublicLayout = () => {
  const location = useLocation();

  /* The home page wears the nav as a transparent overlay on the hero; every
     other page gets the solid sticky bar. */
  const isHomePage = location.pathname === '/';

  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas font-sans text-white">
      <SiteNav floating={isHomePage} />

      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-bg-surface py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center font-display text-xl font-bold">
              <span className="text-brand-orange">NxtGen</span>
              <span className="text-white ml-1">Academy</span>
            </div>
            <p className="text-sm text-text-muted">Where Careers Are Born, Not Found.</p>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-white">Courses</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li><Link to="/courses" className="hover:text-white">All Courses</Link></li>
              <li><Link to="/certifications" className="hover:text-white">Certifications</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-white">Internship & Tools</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li><Link to="/internship" className="hover:text-white">Internship Programs</Link></li>
              <li><Link to="/dashboard/tools/resume-builder" className="hover:text-white">AI Career Toolkit</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="mb-4 font-semibold text-white">Legal</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-7xl border-t border-white/[0.08] px-4 pt-8 text-center text-sm text-text-muted sm:px-6 lg:px-8">
          Powered by <span className="font-semibold text-white">PAVY</span>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
