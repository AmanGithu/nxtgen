import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  Save,
  CheckCircle2,
  Image as ImageIcon,
  Cpu,
  BookOpen,
  Calendar,
  Award,
  Sparkles,
  FileEdit,
  Globe,
  Tag,
  Eye,
  Check,
} from 'lucide-react';

interface SiteSection {
  pageSlug: string;
  sectionKey: string;
  title: string;
  contentJson: any;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  isPublished: boolean;
  version: number;
}

const QUICK_MANAGEMENT_LINKS = [
  { label: 'Theme Assets & Hero Banners', path: '/dashboard/admin/theme-assets', icon: ImageIcon },
  { label: 'AI Voice & Avatar Config', path: '/dashboard/admin/about-us', icon: Cpu },
  { label: 'Batch Schedules & Config', path: '/dashboard/admin/batches', icon: Calendar },
  { label: 'Study Materials Drive', path: '/dashboard/admin/materials', icon: BookOpen },
  { label: 'Upcoming Batches Marketing', path: '/dashboard/admin/upcoming-batches', icon: Sparkles },
  { label: 'Certification Inquiries', path: '/dashboard/admin/cert-inquiries', icon: Award },
];

export default function SiteManagerDashboard() {
  const [selectedPage, setSelectedPage] = useState('home');
  const [selectedSection, setSelectedSection] = useState('hero');
  const [title, setTitle] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [version, setVersion] = useState(1);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchContent();
  }, [selectedPage, selectedSection]);

  const fetchContent = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/site-manager/content', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.contents)) {
        const item = data.contents.find(
          (c: SiteSection) => c.pageSlug === selectedPage && c.sectionKey === selectedSection
        );
        if (item) {
          setTitle(item.title || '');
          setSeoTitle(item.seoTitle || '');
          setSeoDescription(item.seoDescription || '');
          setSeoKeywords(item.seoKeywords || '');
          setIsPublished(item.isPublished ?? true);
          setVersion(item.version || 1);
        } else {
          setTitle('');
          setSeoTitle('');
          setSeoDescription('');
          setSeoKeywords('');
          setIsPublished(true);
          setVersion(1);
        }
      }
    } catch (err) {
      console.warn('Failed to load site content:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/site-manager/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          pageSlug: selectedPage,
          sectionKey: selectedSection,
          title,
          seoTitle,
          seoDescription,
          seoKeywords,
          isPublished,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedSuccess(true);
        setVersion(data.content.version);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save content:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="border-b border-white/[0.08] pb-4">
        <h1 className="text-2xl font-extrabold font-display text-white">Site Manager CMS</h1>
        <p className="text-xs text-text-muted mt-1">
          Edit website page contents, section headers, SEO tags, draft/publish workflow, and site assets.
        </p>
      </div>

      {/* Quick Management Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {QUICK_MANAGEMENT_LINKS.map((link, i) => {
          const Icon = link.icon;
          return (
            <Link
              key={i}
              to={link.path}
              className="flex flex-col items-center text-center p-3 rounded-2xl border border-white/[0.08] bg-bg-card hover:border-[#D4AF37]/40 hover:bg-white/[0.03] transition-all group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 mb-2 group-hover:scale-110 transition-transform">
                <Icon size={16} />
              </div>
              <span className="text-[11px] font-bold text-white group-hover:text-[#D4AF37] leading-tight transition-colors">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>

      {/* CMS Page Content & SEO Editor Form */}
      <form onSubmit={handleSave} className="rounded-2xl border border-white/[0.08] bg-bg-card p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2">
            <FileEdit size={18} className="text-[#D4AF37]" />
            <h2 className="text-base font-bold text-white">Page Content & SEO Metadata Editor</h2>
          </div>
          <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1 rounded-full">
            Version v{version}
          </span>
        </div>

        {/* Select Page and Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-white block mb-1">Target Page</label>
            <select
              value={selectedPage}
              onChange={(e) => setSelectedPage(e.target.value)}
              className="w-full rounded-xl border border-white/[0.1] bg-bg-surface p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="home">Home Page (/)</option>
              <option value="courses">Courses Page (/courses)</option>
              <option value="certifications">Certifications Page (/certifications)</option>
              <option value="internship">Internships Page (/internship)</option>
              <option value="tools">AI Tools Page (/tools)</option>
              <option value="job-support">Job Support Page (/job-support)</option>
              <option value="corporate">Corporate Page (/corporate)</option>
              <option value="connect-us">Connect Us Page (/connect-us)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-white block mb-1">Section Key</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full rounded-xl border border-white/[0.1] bg-bg-surface p-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            >
              <option value="hero">Hero Banner Section</option>
              <option value="why_choose">Why Choose Section</option>
              <option value="testimonials">Testimonials Section</option>
              <option value="features">Features / Highlights</option>
              <option value="cta_banner">CTA Banner Section</option>
            </select>
          </div>
        </div>

        {/* Section Title */}
        <div>
          <label className="text-xs font-bold text-white block mb-1">Section Heading Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Master the Technologies of Tomorrow"
            className="w-full rounded-xl border border-white/[0.1] bg-bg-surface px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        {/* SEO Meta Tags */}
        <div className="space-y-4 pt-2 border-t border-white/[0.06]">
          <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider block">
            SEO Meta Tags & URL Optimization
          </span>

          <div>
            <label className="text-xs font-bold text-white block mb-1">SEO Title Tag</label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="PAVY Academy — Leading AI & Database Masterclasses"
              className="w-full rounded-xl border border-white/[0.1] bg-bg-surface px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-white block mb-1">SEO Meta Description</label>
            <textarea
              rows={3}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Join PAVY Academy for enterprise Generative AI, Agentic AI, and Azure DBA certifications with guaranteed 1-on-1 mentorship."
              className="w-full rounded-xl border border-white/[0.1] bg-bg-surface px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-white block mb-1">Keywords (Comma Separated)</label>
            <input
              type="text"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="PAVY Academy, AI Courses, Agentic AI, Azure DBA, Job Support"
              className="w-full rounded-xl border border-white/[0.1] bg-bg-surface px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        {/* Publish Status Toggle */}
        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="isPublished"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 rounded border-white/[0.2] bg-bg-surface text-[#D4AF37] focus:ring-0"
          />
          <label htmlFor="isPublished" className="text-xs font-bold text-white cursor-pointer">
            Publish Section Live (Uncheck for Draft state)
          </label>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.08]">
          {savedSuccess && (
            <span className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <CheckCircle2 size={16} /> Saved and published content successfully!
            </span>
          )}
          <div className="ml-auto">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-brand-orange px-6 py-2.5 text-xs font-black text-black shadow-lg hover:opacity-90 transition-all"
            >
              <Save size={14} />
              <span>{saving ? 'Saving…' : 'Save Section Content'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
