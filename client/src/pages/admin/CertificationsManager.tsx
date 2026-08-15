import { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Eye, EyeOff, Award, Search, Pencil, Check, X, Tag, Sparkles, Save, Building2, User, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';
import api, { adminCertConfigAPI } from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';

interface Certification {
  id: string;
  name: string;
  provider: string | null;
  link: string | null;
  prerequisite: string | null;
  isActive: boolean;
  ctaEnabled: boolean;
}

const emptyForm = { name: '', provider: '', link: '', prerequisite: '' };

const field =
  'w-full rounded-lg border border-line bg-bg-card px-3 py-2 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none';

const PAGE_SIZE = 25;

const CertificationsManager = () => {
  const [items, setItems] = useState<Certification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [pendingDelete, setPendingDelete] = useState<Certification | null>(null);

  // Active Tab for Configuration Section
  const [configTab, setConfigTab] = useState<'banner' | 'individual' | 'corporate'>('banner');

  // Promo Banner & Dual CTA Configuration State
  const [bannerConfig, setBannerConfig] = useState({
    CERT_BANNER_ACTIVE: 'true',
    CERT_BANNER_DISCOUNT_PERCENT: '40',
    CERT_BANNER_PROMO_CODE: 'CERT40',
    CERT_BANNER_TITLE: 'Mega Certification Sale! Save up to 40% on Official Exam Vouchers & Prep Packs',
    CERT_BANNER_SUBTITLE: 'Instant voucher activation & guaranteed pass guarantee. Limited time discount.',
    CERT_SHOW_PRICES: 'false',

    // Individual CTA Ad Configuration
    CERT_INDIVIDUAL_AD_TITLE: 'Upgrade Your Skills.',
    CERT_INDIVIDUAL_AD_SUBTITLE: 'Save More Today.',
    CERT_INDIVIDUAL_AD_DISCOUNT: '40',
    CERT_INDIVIDUAL_AD_BADGE: 'SUPER SALE',
    CERT_INDIVIDUAL_AD_CTA: 'Shop Now',
    CERT_INDIVIDUAL_AD_IMAGE: '',

    // Corporate CTA Ad Configuration
    CERT_CORPORATE_AD_BADGE: 'Enterprise Training Cohorts',
    CERT_CORPORATE_AD_TITLE: 'Upskill Your Team.',
    CERT_CORPORATE_AD_SUBTITLE: 'Save up to 40%.',
    CERT_CORPORATE_AD_DISCOUNT: '40',
    CERT_CORPORATE_AD_CARD_BADGE: 'Group Volume Discount',
    CERT_CORPORATE_AD_CTA: 'Unlock Group Pricing',
    CERT_CORPORATE_AD_FOOTER: 'Corporate cohorts & bulk exam vouchers',
    CERT_CORPORATE_AD_IMAGE: '',
  });

  const [configSaving, setConfigSaving] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);

  useEffect(() => {
    fetchCertifications();
    fetchConfig();
  }, [page, search]);

  const fetchConfig = async () => {
    try {
      const res = await adminCertConfigAPI.getConfig();
      if (res.data.success && res.data.config) {
        setBannerConfig(prev => ({ ...prev, ...res.data.config }));
      }
    } catch (err) {
      console.error('Failed to load cert config:', err);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    try {
      await adminCertConfigAPI.saveConfig(bannerConfig);
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2500);
    } catch (err) {
      console.error('Failed to save cert config:', err);
    } finally {
      setConfigSaving(false);
    }
  };

  const fetchCertifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/certifications', {
        params: { page, limit: PAGE_SIZE, search: search || undefined },
      });
      if (res.data.success) {
        setItems(res.data.certifications);
        setTotal(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load certifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await api.post('/admin/certifications', form);
      setForm(emptyForm);
      setFormOpen(false);
      await fetchCertifications();
    } catch (err) {
      console.error('Failed to create certification:', err);
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (id: string) => {
    try {
      await api.patch(`/admin/certifications/${id}`, editForm);
      setEditingId(null);
      await fetchCertifications();
    } catch (err) {
      console.error('Failed to update certification:', err);
    }
  };

  const toggle = async (cert: Certification, key: 'isActive' | 'ctaEnabled') => {
    try {
      await api.patch(`/admin/certifications/${cert.id}`, { [key]: !cert[key] });
      await fetchCertifications();
    } catch (err) {
      console.error('Failed to update certification:', err);
    }
  };

  const remove = async (cert: Certification) => {
    try {
      await api.delete(`/admin/certifications/${cert.id}`);
      setPendingDelete(null);
      await fetchCertifications();
    } catch (err) {
      console.error('Failed to delete certification:', err);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-8">
      {pendingDelete && (
        <ConfirmDialog
          title={`Remove "${pendingDelete.name}"?`}
          message="It will no longer appear in the catalogue or be selectable for courses."
          confirmLabel="Remove"
          onConfirm={() => remove(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      {/* ─── PROMO BANNER & DUAL CTA CONFIGURATION SECTION ─── */}
      <div className="rounded-xl border border-brand-orange/30 bg-bg-surface p-5 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-brand-orange/10 p-2 text-brand-orange">
              <Tag size={20} />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-strong">Certification Banner & Dual CTA Configuration</h2>
              <p className="text-xs text-text-muted">Configure the promo sales banner and separate ad visuals/texts for Individual and Corporate CTA popups.</p>
            </div>
          </div>
          {configSaved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-green-400">
              <Check size={14} /> Settings Saved Successfully!
            </span>
          )}
        </div>

        {/* Configuration Sub-Tabs */}
        <div className="mt-4 flex gap-2 border-b border-line pb-3">
          <button
            type="button"
            onClick={() => setConfigTab('banner')}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all',
              configTab === 'banner'
                ? 'bg-brand-orange text-white shadow-sm'
                : 'text-text-muted hover:text-white hover:bg-white/[0.05]'
            )}
          >
            <Tag size={13} />
            Sales Banner & Prices
          </button>
          <button
            type="button"
            onClick={() => setConfigTab('individual')}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all',
              configTab === 'individual'
                ? 'bg-brand-orange text-white shadow-sm'
                : 'text-text-muted hover:text-white hover:bg-white/[0.05]'
            )}
          >
            <User size={13} />
            Individual CTA Ad
          </button>
          <button
            type="button"
            onClick={() => setConfigTab('corporate')}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all',
              configTab === 'corporate'
                ? 'bg-brand-orange text-white shadow-sm'
                : 'text-text-muted hover:text-white hover:bg-white/[0.05]'
            )}
          >
            <Building2 size={13} />
            Enterprise CTA Ad
          </button>
        </div>

        <form onSubmit={handleSaveConfig} className="mt-4 space-y-4">
          {/* TAB 1: SALES BANNER & GLOBAL PRICING */}
          {configTab === 'banner' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Banner Visibility</label>
                  <select
                    value={bannerConfig.CERT_BANNER_ACTIVE}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_BANNER_ACTIVE: e.target.value })}
                    className={field}
                  >
                    <option value="true">Active (Show on /certifications)</option>
                    <option value="false">Hidden (Turn Off)</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Banner Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={bannerConfig.CERT_BANNER_DISCOUNT_PERCENT}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_BANNER_DISCOUNT_PERCENT: e.target.value })}
                    placeholder="40"
                    className={field}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Promo Code</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_BANNER_PROMO_CODE}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_BANNER_PROMO_CODE: e.target.value.toUpperCase() })}
                    placeholder="CERT40"
                    className={field}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Catalog Price Visibility</label>
                  <select
                    value={bannerConfig.CERT_SHOW_PRICES}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_SHOW_PRICES: e.target.value })}
                    className={field}
                  >
                    <option value="false">Disabled / Hidden (Recommended for Leads)</option>
                    <option value="true">Enabled (Show Prices on Cards & Drawers)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Banner Headline</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_BANNER_TITLE}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_BANNER_TITLE: e.target.value })}
                    placeholder="Mega Certification Sale! Save up to 40% on Official Exam Vouchers"
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Banner Subtitle / Description</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_BANNER_SUBTITLE}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_BANNER_SUBTITLE: e.target.value })}
                    placeholder="Limited time voucher discount & practice prep notes."
                    className={field}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INDIVIDUAL CTA POPUP AD CONFIGURATION */}
          {configTab === 'individual' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Main Title Headline</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_INDIVIDUAL_AD_TITLE}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_INDIVIDUAL_AD_TITLE: e.target.value })}
                    placeholder="Upgrade Your Skills."
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Subtitle Tagline</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_INDIVIDUAL_AD_SUBTITLE}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_INDIVIDUAL_AD_SUBTITLE: e.target.value })}
                    placeholder="Save More Today."
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Discount Percentage (%)</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_INDIVIDUAL_AD_DISCOUNT}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_INDIVIDUAL_AD_DISCOUNT: e.target.value })}
                    placeholder="40"
                    className={field}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Top Badge Text</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_INDIVIDUAL_AD_BADGE}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_INDIVIDUAL_AD_BADGE: e.target.value })}
                    placeholder="SUPER SALE"
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Inner CTA Button Text</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_INDIVIDUAL_AD_CTA}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_INDIVIDUAL_AD_CTA: e.target.value })}
                    placeholder="Shop Now"
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Ad Background / Graphic Image URL</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_INDIVIDUAL_AD_IMAGE}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_INDIVIDUAL_AD_IMAGE: e.target.value })}
                    placeholder="https://... or /assets/ad-individual.jpg"
                    className={field}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ENTERPRISE / INSTITUTE CTA POPUP AD CONFIGURATION */}
          {configTab === 'corporate' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Header Pill Badge</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_CORPORATE_AD_BADGE}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_CORPORATE_AD_BADGE: e.target.value })}
                    placeholder="Enterprise Training Cohorts"
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Main Title Headline</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_CORPORATE_AD_TITLE}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_CORPORATE_AD_TITLE: e.target.value })}
                    placeholder="Upskill Your Team."
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Subtitle / Discount Text</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_CORPORATE_AD_SUBTITLE}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_CORPORATE_AD_SUBTITLE: e.target.value })}
                    placeholder="Save up to 40%."
                    className={field}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Discount Value (%)</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_CORPORATE_AD_DISCOUNT}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_CORPORATE_AD_DISCOUNT: e.target.value })}
                    placeholder="40"
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Card Pill Badge</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_CORPORATE_AD_CARD_BADGE}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_CORPORATE_AD_CARD_BADGE: e.target.value })}
                    placeholder="Group Volume Discount"
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Card CTA Button</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_CORPORATE_AD_CTA}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_CORPORATE_AD_CTA: e.target.value })}
                    placeholder="Unlock Group Pricing"
                    className={field}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-text-muted">Footer Tagline</label>
                  <input
                    type="text"
                    value={bannerConfig.CERT_CORPORATE_AD_FOOTER}
                    onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_CORPORATE_AD_FOOTER: e.target.value })}
                    placeholder="Corporate cohorts & bulk exam vouchers"
                    className={field}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text-muted">Enterprise Graphic / Image URL (Optional upload/URL)</label>
                <input
                  type="text"
                  value={bannerConfig.CERT_CORPORATE_AD_IMAGE}
                  onChange={(e) => setBannerConfig({ ...bannerConfig, CERT_CORPORATE_AD_IMAGE: e.target.value })}
                  placeholder="https://... or /assets/enterprise-banner.png"
                  className={field}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-line">
            <button
              type="submit"
              disabled={configSaving}
              className="flex items-center gap-2 rounded-lg bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-md"
            >
              <Save size={16} />
              {configSaving ? 'Saving Changes...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* ─── CERTIFICATION CATALOG CRUD SECTION ─── */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Award className="text-brand-orange" size={24} />
            <h1 className="font-display text-xl font-bold text-strong">Certification Catalog ({total})</h1>
          </div>
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="flex items-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-on-brand hover:bg-orange-600 transition-colors"
          >
            {formOpen ? <Minus size={16} /> : <Plus size={16} />}
            {formOpen ? 'Close Form' : 'Add Certification'}
          </button>
        </div>

        {/* Add Certification Inline Form */}
        {formOpen && (
          <form onSubmit={create} className="rounded-xl border border-line bg-bg-surface p-4 space-y-3">
            <h3 className="text-sm font-bold text-strong">Add New Certification</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                placeholder="Certification Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={field}
                required
              />
              <input
                placeholder="Provider (e.g. Microsoft, AWS)"
                value={form.provider}
                onChange={(e) => setForm({ ...form, provider: e.target.value })}
                className={field}
              />
              <input
                placeholder="Official Documentation Link"
                value={form.link}
                onChange={(e) => setForm({ ...form, link: e.target.value })}
                className={field}
              />
              <input
                placeholder="Prerequisite(s)"
                value={form.prerequisite}
                onChange={(e) => setForm({ ...form, prerequisite: e.target.value })}
                className={field}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                className="rounded-lg border border-line px-3 py-1.5 text-xs text-text-muted hover:text-strong"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand-orange px-4 py-1.5 text-xs font-semibold text-on-brand hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? 'Creating...' : 'Create Entry'}
              </button>
            </div>
          </form>
        )}

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search certifications by name, provider, code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-line bg-bg-surface py-2.5 pl-9 pr-4 text-sm text-strong placeholder:text-text-muted/50 focus:border-brand-orange focus:outline-none"
          />
        </div>

        {/* Certifications Table */}
        <div className="rounded-xl border border-line bg-bg-surface overflow-x-auto shadow-md">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-bg-card font-bold text-text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Certification Title</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Prerequisites</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    Loading certifications...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-text-muted">
                    No certifications found.
                  </td>
                </tr>
              ) : (
                items.map((cert) => (
                  <tr key={cert.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-semibold text-strong max-w-xs">
                      {editingId === cert.id ? (
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className={field}
                        />
                      ) : (
                        <div className="space-y-0.5">
                          <span>{cert.name}</span>
                          {cert.link && (
                            <a
                              href={cert.link}
                              target="_blank"
                              rel="noreferrer"
                              className="block text-[10px] text-brand-orange hover:underline truncate"
                            >
                              {cert.link}
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted">
                      {editingId === cert.id ? (
                        <input
                          value={editForm.provider || ''}
                          onChange={(e) => setEditForm({ ...editForm, provider: e.target.value })}
                          className={field}
                        />
                      ) : (
                        <span className="rounded bg-bg-card px-2 py-0.5 font-medium text-strong">
                          {cert.provider || 'Generic'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-text-muted max-w-xs truncate">
                      {editingId === cert.id ? (
                        <input
                          value={editForm.prerequisite || ''}
                          onChange={(e) => setEditForm({ ...editForm, prerequisite: e.target.value })}
                          className={field}
                        />
                      ) : (
                        cert.prerequisite || 'None'
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggle(cert, 'isActive')}
                        className={clsx(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                          cert.isActive
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        )}
                      >
                        {cert.isActive ? <Eye size={11} /> : <EyeOff size={11} />}
                        {cert.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {editingId === cert.id ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => saveEdit(cert.id)}
                            className="rounded p-1 text-green-400 hover:bg-green-400/10"
                            title="Save"
                          >
                            <Check size={15} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded p-1 text-text-muted hover:bg-white/[0.06]"
                            title="Cancel"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingId(cert.id);
                              setEditForm({
                                name: cert.name,
                                provider: cert.provider || '',
                                link: cert.link || '',
                                prerequisite: cert.prerequisite || '',
                              });
                            }}
                            className="rounded p-1 text-text-muted hover:bg-white/[0.06] hover:text-strong"
                            title="Edit"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => setPendingDelete(cert)}
                            className="rounded p-1 text-text-muted hover:bg-red-500/10 hover:text-red-400"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-text-muted">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-line bg-bg-surface px-3 py-1.5 text-xs text-text-muted disabled:opacity-40 hover:bg-white/[0.04]"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-lg border border-line bg-bg-surface px-3 py-1.5 text-xs text-text-muted disabled:opacity-40 hover:bg-white/[0.04]"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificationsManager;
