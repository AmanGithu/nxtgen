import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, EyeOff, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { adminBannersAPI } from '../../services/api';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  ctaText: string | null;
  ctaLink: string | null;
  sortOrder: number;
  isActive: boolean;
}

const emptyForm = { title: '', subtitle: '', imageUrl: '', ctaText: '', ctaLink: '' };

const HeroBanners = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await adminBannersAPI.getAll();
      if (res.data.success) setBanners(res.data.banners);
    } catch (err) {
      console.error('Failed to fetch banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await adminBannersAPI.create({ ...form, sortOrder: banners.length });
      setForm(emptyForm);
      await fetchBanners();
    } catch (err) {
      console.error('Failed to create banner:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (banner: Banner) => {
    try {
      await adminBannersAPI.update(banner.id, { isActive: !banner.isActive });
      await fetchBanners();
    } catch (err) {
      console.error('Failed to toggle banner:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminBannersAPI.remove(id);
      await fetchBanners();
    } catch (err) {
      console.error('Failed to delete banner:', err);
    }
  };

  const field = (key: keyof typeof emptyForm, label: string, placeholder: string) => (
    <div className="flex-1 min-w-[180px]">
      <label className="mb-1 block text-xs font-medium text-text-muted">{label}</label>
      <input
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
      />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-strong">Hero Banners</h2>
        <p className="mt-1 text-sm text-text-muted">
          Slides for the home page hero carousel, shown in order. Hidden banners are skipped.
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-4 rounded-xl border border-line bg-bg-surface p-4">
        <div className="flex flex-wrap gap-3">
          {field('title', 'Title', 'Where Careers Are Born')}
          {field('subtitle', 'Subtitle', 'Master AI with industry experts')}
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {field('imageUrl', 'Image URL', 'https://…')}
          {field('ctaText', 'CTA Text', 'Explore Courses')}
          {field('ctaLink', 'CTA Link', '/courses')}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand transition-colors hover:bg-orange-600 disabled:opacity-50"
          >
            <Plus size={16} />
            Add Banner
          </button>
        </div>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-line bg-bg-surface" />
          ))}
        </div>
      ) : banners.length === 0 ? (
        <p className="rounded-xl border border-line bg-bg-surface p-8 text-center text-sm text-text-muted">
          No banners yet. The home page hero will keep its built-in default slide.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={clsx(
                'flex gap-4 rounded-xl border bg-bg-surface p-4',
                banner.isActive ? 'border-line' : 'border-line-subtle opacity-60'
              )}
            >
              <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line bg-bg-card">
                {banner.imageUrl ? (
                  <img src={banner.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={20} className="text-text-muted" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-strong">{banner.title}</h3>
                {banner.subtitle && <p className="mt-0.5 line-clamp-2 text-xs text-text-muted">{banner.subtitle}</p>}
                {banner.ctaText && (
                  <span className="mt-2 inline-block rounded bg-brand-orange/10 px-2 py-0.5 text-xs text-brand-orange">
                    {banner.ctaText} → {banner.ctaLink || '#'}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <button
                  onClick={() => toggleActive(banner)}
                  title={banner.isActive ? 'Hide banner' : 'Show banner'}
                  className="rounded p-1.5 text-text-muted transition-colors hover:bg-elevate hover:text-strong"
                >
                  {banner.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  title="Delete"
                  className="rounded p-1.5 text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroBanners;
