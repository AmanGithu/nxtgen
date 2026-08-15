import { Link, Outlet, useLocation } from 'react-router-dom';
import SiteNav from '../components/SiteNav';
import {
  MapPin,
  Mail,
  Phone,
} from 'lucide-react';
import {
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  InstagramIcon,
  YoutubeIcon,
} from '../components/SocialIcons';
import WhatsAppWidget from '../components/WhatsAppWidget';
import VoiceAgentWidget from '../components/VoiceAgentWidget';

const SOCIAL_LINKS = [
  { name: 'Facebook', icon: FacebookIcon, href: 'https://facebook.com/nxtgenacademy', color: '#1877F2' },
  { name: 'Twitter / X', icon: TwitterIcon, href: 'https://twitter.com/nxtgenacademy', color: '#1DA1F2' },
  { name: 'LinkedIn', icon: LinkedinIcon, href: 'https://linkedin.com/company/nxtgenacademy', color: '#0A66C2' },
  { name: 'Instagram', icon: InstagramIcon, href: 'https://instagram.com/nxtgenacademy', color: '#E4405F' },
  { name: 'YouTube', icon: YoutubeIcon, href: 'https://youtube.com/@nxtgenacademy', color: '#FF0000' },
];

const PublicLayout = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="flex min-h-screen flex-col bg-bg-canvas font-sans text-white">
      <SiteNav floating={isHomePage} />

      {/* Main Content with top padding so headers aren't hidden under sticky navbar */}
      <main className="flex-grow pt-20 md:pt-24">
        <Outlet />
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-white/[0.08] bg-bg-surface">
        <div className="mx-auto max-w-[1450px] px-6 sm:px-10 lg:px-12 py-16">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">

            {/* Column 1: Brand */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <Link to="/" className="flex items-center font-display text-xl font-bold">
                <span className="text-[#D4AF37] font-black">PAVY</span>
                <span className="text-white ml-1 font-bold">Academy</span>
              </Link>
              <p className="text-sm text-text-muted italic">"Where Careers Are Born, Not Found."</p>
              <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                <div className="flex items-start gap-2 text-xs text-text-muted">
                  <MapPin size={13} className="text-[#D4AF37] shrink-0 mt-0.5" />
                  <span>A4 Park Residency, Pune Maharatsra, India-411014</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Mail size={13} className="text-[#D4AF37] shrink-0" />
                  <a href="mailto:contact@pavy.ai" className="hover:text-white transition-colors">contact@pavy.ai</a>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Phone size={13} className="text-[#D4AF37] shrink-0" />
                  <a href="tel:+919673004500" className="hover:text-white transition-colors">+91 96730-04500</a>
                </div>
              </div>
            </div>

            {/* Column 2: Individual Services */}
            <div>
              <h3 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">Individual Services</h3>
              <ul className="flex flex-col gap-2.5 text-sm text-text-muted">
                <li>
                  <Link to="/courses" className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-orange/60" />
                    Courses
                  </Link>
                </li>
                <li>
                  <Link to="/certifications" className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-orange/60" />
                    Certifications
                  </Link>
                </li>
                <li>
                  <Link to="/internship" className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-orange/60" />
                    Internships
                  </Link>
                </li>
                <li>
                  <Link to="/tools/resume-builder" className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-orange/60" />
                    AI Tools Store
                  </Link>
                </li>
                <li>
                  <Link to="/job-support" className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-orange/60" />
                    Technical Job Support
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Corporate Programs */}
            <div>
              <h3 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">Corporate Programs</h3>
              <ul className="flex flex-col gap-2.5 text-sm text-text-muted">
                <li>
                  <Link to="/corporate#training" className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-orange/60" />
                    AI Training
                  </Link>
                </li>
                <li>
                  <Link to="/corporate#consulting" className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-orange/60" />
                    AI Consultation
                  </Link>
                </li>
                <li>
                  <Link to="/corporate#custom" className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-orange/60" />
                    AI Custom Solutions
                  </Link>
                </li>
                <li>
                  <Link to="/corporate#enrollments" className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-orange/60" />
                    AI Tools for Organization
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Social Media */}
            <div>
              <h3 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">Follow Us</h3>
              <ul className="flex flex-col gap-3">
                {SOCIAL_LINKS.map((social) => {
                  const Icon = social.icon;
                  return (
                    <li key={social.name}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 text-sm text-text-muted hover:text-white transition-colors"
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform group-hover:scale-110"
                          style={{ backgroundColor: social.color + '20', border: `1px solid ${social.color}30` }}
                        >
                          <Icon size={15} style={{ color: social.color }} />
                        </div>
                        <span className="group-hover:text-white">{social.name}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Column 5: Legal & About */}
            <div>
              <h3 className="mb-4 text-sm font-bold text-white uppercase tracking-wider">Company</h3>
              <ul className="flex flex-col gap-2.5 text-sm text-text-muted">
                <li>
                  <Link to="/about" className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-orange/60" />
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/connect-us" className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-orange/60" />
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-orange/60" />
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-brand-orange/60" />
                    Terms of Use
                  </Link>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* Copyright bar */}
        <div className="border-t border-white/[0.06] bg-bg-canvas/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
            <span>
              © {new Date().getFullYear()} <span className="font-semibold text-[#D4AF37]">PAVY Academy</span> — PAVY Consultancy Services Pvt Ltd. All rights reserved.
            </span>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <span className="text-white/20">·</span>
              <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
              <span className="text-white/20">·</span>
              <Link to="/connect-us" className="hover:text-white transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── FLOATING WIDGETS (bottom-right, stacked vertically) ─── */}
      <div
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 12,
        }}
      >
        <WhatsAppWidget />
        <VoiceAgentWidget />
      </div>
    </div>
  );
};

export default PublicLayout;
