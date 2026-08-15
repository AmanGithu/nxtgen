import { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  Search,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  ArrowRight,
  Filter,
  Tag,
  ShieldCheck,
  Layers,
  FileCode,
  Building2,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  CERTIFICATIONS_CATALOG,
  POPULAR_PROVIDERS,
  ROLE_CATEGORIES,
  type CertificationItem,
  type RoleCategory,
} from '../data/certificationsData';
import { certificationsAPI } from '../services/api';
import { ProviderLogo } from '../components/ProviderLogo';

type AudienceMode = 'individual' | 'corporate';
type SortOption = 'popular' | 'prereq_none';

const ITEMS_PER_PAGE = 12;

const Certifications = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Audience Controller Mode
  const [audience, setAudience] = useState<AudienceMode>('individual');

  // Search & Auto-Suggest
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Filters State
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<RoleCategory[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [currentPage, setCurrentPage] = useState(1);

  // Slide-Over Detail Drawer
  const [selectedCertForDrawer, setSelectedCertForDrawer] = useState<CertificationItem | null>(null);

  // Dual Lead Modal Form State (pop-sales.png layout)
  const [selectedCertForModal, setSelectedCertForModal] = useState<CertificationItem | null>(null);
  const [modalFunding, setModalFunding] = useState<'My employer' | 'I will' | 'Not sure'>('My employer');
  const [modalForm, setModalForm] = useState({
    fullName: '',
    email: '',
    countryCode: '+91',
    mobile: '',
    jobTitle: '',
    companyOrInstitute: '',
    teamSize: '',
    message: '',
  });
  const [submittingModal, setSubmittingModal] = useState(false);
  const [modalSubmitted, setModalSubmitted] = useState(false);

  // Banner & Global Config (Loaded dynamically from Admin)
  const [bannerConfig, setBannerConfig] = useState({
    CERT_BANNER_ACTIVE: 'true',
    CERT_BANNER_DISCOUNT_PERCENT: '40',
    CERT_BANNER_PROMO_CODE: 'CERT40',
    CERT_BANNER_TITLE: 'Mega Certification Sale! Save up to 40% on Official Exam Vouchers & Prep Packs',
    CERT_BANNER_SUBTITLE: 'Guaranteed voucher activation with pass guidance for individual professionals and corporate teams.',
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

  // Sync provider from URL query parameter
  useEffect(() => {
    const providerParam = searchParams.get('provider');
    if (providerParam) {
      setSelectedProviders([providerParam]);
      window.scrollTo({ top: 580, behavior: 'smooth' });
    }
  }, [searchParams]);

  // Load public banner & CTA configurations
  useEffect(() => {
    certificationsAPI.getConfig()
      .then((res) => {
        if (res.data.success && res.data.config) {
          setBannerConfig((prev) => ({ ...prev, ...res.data.config }));
        }
      })
      .catch((err) => console.error('Failed to load cert banner config:', err));
  }, []);

  // Close auto-suggest on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toggle Provider Filter
  const toggleProviderFilter = (providerName: string) => {
    setSelectedProviders((prev) =>
      prev.includes(providerName) ? prev.filter((p) => p !== providerName) : [...prev, providerName]
    );
    setCurrentPage(1);
  };

  // Toggle Level Filter
  const toggleLevelFilter = (level: string) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
    setCurrentPage(1);
  };

  // Toggle Role Category Filter
  const toggleRoleFilter = (role: RoleCategory) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
    setCurrentPage(1);
  };

  // ─── REAL-TIME SEARCH & FILTERING MEMO ───
  const filteredCertifications = useMemo(() => {
    return CERTIFICATIONS_CATALOG.filter((cert) => {
      // 1. Text Search Query (Only title, provider, code, shortName)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = cert.title.toLowerCase().includes(q);
        const matchesCode = cert.code.toLowerCase().includes(q);
        const matchesProvider = cert.provider.toLowerCase().includes(q);
        const matchingProviderMeta = POPULAR_PROVIDERS.find((p) => p.name.toLowerCase() === cert.provider.toLowerCase());
        const matchesShortName = matchingProviderMeta ? matchingProviderMeta.shortName.toLowerCase().includes(q) : false;

        if (!matchesTitle && !matchesCode && !matchesProvider && !matchesShortName) {
          return false;
        }
      }

      // 2. Provider Filter
      if (selectedProviders.length > 0) {
        if (!selectedProviders.includes(cert.provider)) {
          return false;
        }
      }

      // 3. Level Filter
      if (selectedLevels.length > 0) {
        if (!selectedLevels.includes(cert.level)) {
          return false;
        }
      }

      // 4. Role Category Filter
      if (selectedRoles.length > 0) {
        if (!selectedRoles.includes(cert.roleCategory)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'popular') {
        return b.popularityScore - a.popularityScore;
      }
      if (sortBy === 'prereq_none') {
        const aHasPrereq = a.prerequisites && a.prerequisites.length > 0 ? 1 : 0;
        const bHasPrereq = b.prerequisites && b.prerequisites.length > 0 ? 1 : 0;
        if (aHasPrereq !== bHasPrereq) {
          return aHasPrereq - bHasPrereq;
        }
        return b.popularityScore - a.popularityScore;
      }
      return 0;
    });
  }, [searchQuery, selectedProviders, selectedLevels, selectedRoles, sortBy]);

  // Pagination Slice
  const totalPages = Math.max(1, Math.ceil(filteredCertifications.length / ITEMS_PER_PAGE));
  const paginatedCertifications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCertifications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCertifications, currentPage]);

  // Dynamic Provider Counts
  const providerCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CERTIFICATIONS_CATALOG.forEach((item) => {
      counts[item.provider] = (counts[item.provider] || 0) + 1;
    });
    return counts;
  }, []);

  // Level Counts
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = { Beginner: 0, Intermediate: 0, Advanced: 0 };
    CERTIFICATIONS_CATALOG.forEach((item) => {
      if (counts[item.level] !== undefined) {
        counts[item.level] += 1;
      }
    });
    return counts;
  }, []);

  // Role Category Counts
  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    ROLE_CATEGORIES.forEach((cat) => {
      counts[cat] = 0;
    });
    CERTIFICATIONS_CATALOG.forEach((item) => {
      if (counts[item.roleCategory] !== undefined) {
        counts[item.roleCategory] += 1;
      }
    });
    return counts;
  }, []);

  // Streamlined Auto-Suggest (Only Providers & Exam Codes)
  const autoSuggestResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase().trim();

    const matchingProviders = POPULAR_PROVIDERS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.shortName.toLowerCase().includes(q)
    );

    const matchingCodes = CERTIFICATIONS_CATALOG.filter((c) =>
      c.code.toLowerCase().includes(q)
    ).slice(0, 5);

    if (matchingProviders.length === 0 && matchingCodes.length === 0) {
      return null;
    }

    return {
      providers: matchingProviders,
      codes: matchingCodes,
    };
  }, [searchQuery]);

  // Modal Open Handlers
  const handleOpenLeadModal = (cert: CertificationItem) => {
    setSelectedCertForModal(cert);
    setModalSubmitted(false);
  };

  const handleOpenPromoModal = () => {
    setSelectedCertForModal(CERTIFICATIONS_CATALOG[0]);
    setModalSubmitted(false);
  };

  // Submit Modal Lead
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingModal(true);
    try {
      await certificationsAPI.submitInquiry({
        certificationId: selectedCertForModal?.id,
        certificationName: selectedCertForModal?.title || 'Global Certification Voucher Inquiry',
        userName: modalForm.fullName || modalForm.companyOrInstitute || 'Valued Client',
        userEmail: modalForm.email,
        userPhone: `${modalForm.countryCode} ${modalForm.mobile}`,
        message: `[Audience: ${audience.toUpperCase()}] [Funding: ${modalFunding}] [Company/Institute: ${modalForm.companyOrInstitute}] [Team Size: ${modalForm.teamSize}] [Job Title: ${modalForm.jobTitle}] [Message: ${modalForm.message}]`,
      });
      setModalSubmitted(true);
    } catch (err) {
      console.error('Lead submission error:', err);
      setModalSubmitted(true);
    } finally {
      setSubmittingModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-canvas text-strong">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ═══════════════════════════════════════════════════════════════════
            1. TOP SHOWCASE: 70-80% LOGO PRESENCE WITH SHINING GOLDEN BORDERS
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-8">
          <div className="mb-5 text-center">
            <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Most Popular Certification Providers
            </h2>
          </div>

          {/* 12 Bold Tiles Grid (Display Only, 70-80% Logo Fill, Shining Golden Border) */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {POPULAR_PROVIDERS.map((provider) => (
              <div
                key={provider.id}
                className="group relative flex flex-col items-center justify-center rounded-2xl border border-amber-400/35 bg-gradient-to-b from-amber-500/[0.08] via-bg-surface to-bg-card p-5 text-center shadow-[0_0_15px_rgba(245,158,11,0.12)] transition-all duration-300 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.3)] hover:scale-[1.03]"
              >
                {/* Enlarged 70-80% Provider Logo */}
                <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl bg-white/[0.04] p-3 shadow-inner">
                  <ProviderLogo provider={provider.name} size="2xl" />
                </div>

                <div className="mt-3">
                  <h3 className="font-display text-sm sm:text-base font-bold text-white group-hover:text-brand-orange transition-colors">
                    {provider.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            2. HORIZONTAL PROMOTIONAL SALES BANNER
        ═══════════════════════════════════════════════════════════════════ */}
        {bannerConfig.CERT_BANNER_ACTIVE === 'true' && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-brand-orange/40 bg-gradient-to-r from-orange-950/70 via-bg-surface to-amber-950/40 p-5 shadow-xl relative">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-orange/15 blur-2xl pointer-events-none" />
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
              <div className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-orange text-white shadow-lg shadow-orange-500/20">
                  <Tag size={24} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white sm:text-xl">
                    {bannerConfig.CERT_BANNER_TITLE}
                  </h3>
                  <p className="mt-1 text-xs text-text-muted sm:text-sm">
                    {bannerConfig.CERT_BANNER_SUBTITLE}
                  </p>
                </div>
              </div>

              <div className="shrink-0">
                <button
                  onClick={handleOpenPromoModal}
                  className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-orange px-6 py-3 font-display text-sm font-bold text-white shadow-lg shadow-brand-orange/25 transition-all hover:bg-orange-600 hover:scale-105 active:scale-95"
                >
                  <Sparkles size={16} />
                  Grab Now
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            3. AUDIENCE DIVISION TOGGLE (Prominent & Wider)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="my-8 flex flex-col items-center justify-center gap-2 border-y border-white/[0.08] py-5">
          <div className="inline-flex rounded-2xl border border-white/[0.12] bg-bg-surface/90 p-1.5 shadow-inner backdrop-blur-md">
            <button
              onClick={() => setAudience('individual')}
              className={clsx(
                'flex items-center gap-2.5 rounded-xl px-8 py-3 text-sm font-bold transition-all duration-200',
                audience === 'individual'
                  ? 'bg-brand-orange text-white shadow-lg shadow-orange-500/20 scale-[1.02]'
                  : 'text-text-muted hover:text-white'
              )}
            >
              <Award size={17} />
              For Individuals
            </button>
            <button
              onClick={() => setAudience('corporate')}
              className={clsx(
                'flex items-center gap-2.5 rounded-xl px-8 py-3 text-sm font-bold transition-all duration-200',
                audience === 'corporate'
                  ? 'bg-brand-orange text-white shadow-lg shadow-orange-500/20 scale-[1.02]'
                  : 'text-text-muted hover:text-white'
              )}
            >
              <Building2 size={17} />
              For Teams & Corporates
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            4. HEADER SEARCH & STREAMLINED AUTO-SUGGEST
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-6 w-full" ref={searchContainerRef}>
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-text-muted" />
              <input
                type="text"
                placeholder="Search certifications by name, exam code (e.g. AZ-900, CCNA), or provider..."
                value={searchQuery}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-2xl border border-white/[0.12] bg-bg-surface/95 py-4 pl-12 pr-10 text-base text-strong placeholder:text-text-muted/60 shadow-lg focus:border-brand-orange focus:outline-hidden focus:ring-2 focus:ring-brand-orange/30 backdrop-blur-md"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 text-text-muted hover:text-white"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* AUTO-SUGGEST DROPDOWN */}
            {isSearchFocused && autoSuggestResults && (
              <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-[380px] overflow-y-auto rounded-2xl border border-white/[0.12] bg-bg-surface/98 p-4 shadow-2xl backdrop-blur-2xl">
                <div className="space-y-4">
                  {/* Providers */}
                  {autoSuggestResults.providers.length > 0 && (
                    <div>
                      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-orange">
                        <Award size={12} /> Providers
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-2">
                        {autoSuggestResults.providers.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              toggleProviderFilter(p.name);
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-bg-card px-3 py-1.5 text-xs font-semibold text-white hover:border-brand-orange hover:text-brand-orange"
                          >
                            <ProviderLogo provider={p.name} size="sm" />
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Exam Codes */}
                  {autoSuggestResults.codes.length > 0 && (
                    <div>
                      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                        <FileCode size={12} /> Exam Codes
                      </span>
                      <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                        {autoSuggestResults.codes.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => {
                              setSearchQuery(c.code);
                              setIsSearchFocused(false);
                            }}
                            className="flex items-center justify-between rounded-lg bg-bg-card p-2 text-left text-xs hover:bg-white/[0.06]"
                          >
                            <span className="font-mono font-bold text-cyan-300">{c.code}</span>
                            <span className="truncate text-text-muted ml-2">{c.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            5. CENTER-ALIGNED PROVIDER FILTER STRIP (Golden Shining Borders)
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="mb-8 overflow-x-auto pb-2">
          <div className="flex items-center justify-center gap-2.5 min-w-max">
            {POPULAR_PROVIDERS.map((provider) => {
              const isSelected = selectedProviders.includes(provider.name);
              const count = providerCounts[provider.name] || 0;

              return (
                <button
                  key={provider.id}
                  onClick={() => toggleProviderFilter(provider.name)}
                  title={`${provider.name} (${count} certifications)`}
                  className={clsx(
                    'flex items-center gap-2.5 rounded-xl border px-3.5 py-2 transition-all duration-150',
                    isSelected
                      ? 'border-amber-400 bg-amber-500/20 ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'border-amber-400/35 bg-bg-surface/90 hover:border-amber-400 hover:bg-bg-surface shadow-[0_0_8px_rgba(245,158,11,0.08)]'
                  )}
                >
                  <ProviderLogo provider={provider.name} size="md" />
                  <span className={clsx(
                    'rounded-full px-2 py-0.5 text-[11px] font-bold font-mono',
                    isSelected ? 'bg-brand-orange text-white' : 'bg-white/[0.08] text-amber-200'
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            6. MAIN CONTENT: SIDEBAR FILTERS + 3-COLUMN CLEAN TILES
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          
          {/* ─── LEFT STICKY FILTERING SIDEBAR ─── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-5 rounded-2xl border border-white/[0.08] bg-bg-surface/90 p-5 backdrop-blur-md shadow-lg">
              
              {/* Sidebar Header & Reset */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3.5">
                <div className="flex items-center gap-2">
                  <Filter size={16} className="text-brand-orange" />
                  <h3 className="font-display text-sm font-bold text-white">Filter Catalog</h3>
                </div>
                {(selectedProviders.length > 0 || selectedLevels.length > 0 || selectedRoles.length > 0 || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedProviders([]);
                      setSelectedLevels([]);
                      setSelectedRoles([]);
                      setSearchQuery('');
                      setSortBy('popular');
                    }}
                    className="text-xs text-brand-orange hover:underline font-semibold"
                  >
                    Reset All
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="border-b border-white/[0.08] pb-4">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full rounded-xl border border-white/[0.12] bg-bg-card px-3 py-2.5 text-xs font-semibold text-strong focus:border-brand-orange focus:outline-hidden"
                >
                  <option value="popular">Most Popular First</option>
                  <option value="prereq_none">Prerequisite: None First</option>
                </select>
              </div>

              {/* Difficulty Level Checkboxes */}
              <div className="border-b border-white/[0.08] pb-4">
                <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-white">
                  Certification Level
                </label>
                <div className="space-y-2">
                  {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => {
                    const isChecked = selectedLevels.includes(level);
                    return (
                      <label
                        key={level}
                        className="flex items-center justify-between cursor-pointer rounded-lg p-1.5 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleLevelFilter(level)}
                            className="h-4 w-4 rounded border-white/[0.2] bg-bg-card text-brand-orange focus:ring-0"
                          />
                          <span className="text-xs font-medium text-white">{level}</span>
                        </div>
                        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-text-muted font-bold">
                          {levelCounts[level]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Provider Checkboxes */}
              <div className="border-b border-white/[0.08] pb-4">
                <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-white">
                  Vendors & Providers
                </label>
                <div className="max-h-52 space-y-1.5 overflow-y-auto pr-1">
                  {POPULAR_PROVIDERS.map((p) => {
                    const isChecked = selectedProviders.includes(p.name);
                    const count = providerCounts[p.name] || 0;
                    return (
                      <label
                        key={p.id}
                        className="flex items-center justify-between cursor-pointer rounded-lg p-1.5 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleProviderFilter(p.name)}
                            className="h-4 w-4 rounded border-white/[0.2] bg-bg-card text-brand-orange focus:ring-0"
                          />
                          <span className="text-xs font-medium text-white">{p.name}</span>
                        </div>
                        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-text-muted font-bold">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Career Domain Filters */}
              <div className="border-b border-white/[0.08] pb-4">
                <label className="mb-2.5 block text-xs font-bold uppercase tracking-wider text-white">
                  Career Track & Job Domain
                </label>
                <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                  {ROLE_CATEGORIES.map((role) => {
                    const isChecked = selectedRoles.includes(role);
                    const count = roleCounts[role] || 0;
                    return (
                      <label
                        key={role}
                        className="flex items-center justify-between cursor-pointer rounded-lg p-1.5 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleRoleFilter(role)}
                            className="h-4 w-4 rounded border-white/[0.2] bg-bg-card text-brand-orange focus:ring-0"
                          />
                          <span className="text-xs font-medium text-white leading-tight">{role}</span>
                        </div>
                        <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-text-muted font-bold">
                          {count}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Voucher Assurance Notice */}
              <div className="rounded-xl border border-white/[0.06] bg-bg-card/60 p-3 text-xs text-text-muted">
                <p className="font-semibold text-white flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-brand-orange" />
                  Official Exam Vouchers
                </p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Every certification registration includes verified exam vouchers, pass blueprints, and mentoring.
                </p>
              </div>

            </div>
          </div>

          {/* ─── RIGHT 3-COLUMN CERTIFICATION GRID ─── */}
          <div className="lg:col-span-3">
            
            {/* Results Counter Header */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold text-text-muted">
                Showing <span className="text-white font-bold">{filteredCertifications.length}</span> certifications
                {selectedProviders.length > 0 && ` for ${selectedProviders.join(', ')}`}
              </p>
              <span className="text-xs text-text-muted">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            {filteredCertifications.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.08] bg-bg-surface p-12 text-center">
                <Award className="mx-auto h-12 w-12 text-text-muted/40" />
                <h3 className="mt-4 font-display text-lg font-bold text-white">No certifications match your filters</h3>
                <p className="mt-1 text-sm text-text-muted">
                  Try clearing some filter tags or searching with a different term.
                </p>
                <button
                  onClick={() => {
                    setSelectedProviders([]);
                    setSelectedLevels([]);
                    setSelectedRoles([]);
                    setSearchQuery('');
                  }}
                  className="mt-4 rounded-xl bg-brand-orange px-4 py-2 text-xs font-bold text-white hover:bg-orange-600 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <>
                {/* 3-Column Responsive Grid (Clean Minimalist Cards) */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {paginatedCertifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-bg-surface/90 p-5 shadow-lg transition-all duration-200 hover:border-brand-orange/40 hover:shadow-orange-500/5 hover:-translate-y-0.5"
                    >
                      <div>
                        {/* Partner Logo & Provider Tag */}
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] p-1">
                            <ProviderLogo provider={cert.provider} size="sm" />
                          </div>
                          <span className="text-xs font-bold text-white">
                            {cert.provider}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="mt-3.5 font-display text-base font-bold text-white line-clamp-2 group-hover:text-brand-orange transition-colors">
                          {cert.title}
                        </h3>

                        {/* Role Tag */}
                        <div className="mt-2.5 flex items-center gap-2 text-[11px]">
                          <span className="rounded-md bg-bg-card px-2.5 py-1 text-text-muted">
                            {cert.jobRole}
                          </span>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="mt-6 space-y-2 border-t border-white/[0.08] pt-4">
                        {/* Primary CTA (Contextual) */}
                        <button
                          onClick={() => handleOpenLeadModal(cert)}
                          className={clsx(
                            'flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-white shadow-md transition-all',
                            'bg-brand-orange hover:bg-orange-600 shadow-brand-orange/20'
                          )}
                        >
                          {audience === 'corporate' ? (
                            <>
                              <Building2 size={14} />
                              Connect with Advisor
                            </>
                          ) : (
                            <>
                              <Sparkles size={14} />
                              Book Consultation
                            </>
                          )}
                        </button>

                        {/* Secondary CTA: View Details */}
                        <button
                          onClick={() => setSelectedCertForDrawer(cert)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.12] bg-white/[0.04] py-2 text-xs font-semibold text-white hover:bg-white/[0.08] transition-colors"
                        >
                          <span>View Details</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ─── NUMBERED PAGINATION CONTROLS ─── */}
                {totalPages > 1 && (
                  <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
                    <p className="text-xs text-text-muted">
                      Showing page <span className="text-white font-bold">{currentPage}</span> of {totalPages} ({filteredCertifications.length} total entries)
                    </p>

                    <div className="flex items-center gap-1.5">
                      {/* Previous Page */}
                      <button
                        disabled={currentPage === 1}
                        onClick={() => {
                          setCurrentPage((p) => Math.max(1, p - 1));
                          window.scrollTo({ top: 580, behavior: 'smooth' });
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.12] bg-bg-surface text-white disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
                        title="Previous Page"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {/* Numbered Page Buttons */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => {
                            setCurrentPage(pageNum);
                            window.scrollTo({ top: 580, behavior: 'smooth' });
                          }}
                          className={clsx(
                            'h-9 min-w-[36px] rounded-xl px-2 text-xs font-bold transition-all',
                            currentPage === pageNum
                              ? 'bg-brand-orange text-white shadow-md shadow-orange-500/20 scale-105'
                              : 'border border-white/[0.08] bg-bg-surface text-text-muted hover:text-white hover:bg-white/[0.06]'
                          )}
                        >
                          {pageNum}
                        </button>
                      ))}

                      {/* Next Page */}
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => {
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                          window.scrollTo({ top: 580, behavior: 'smooth' });
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.12] bg-bg-surface text-white disabled:opacity-30 hover:bg-white/[0.06] transition-colors"
                        title="Next Page"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

          </div>
        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          7. EXPANDED SLIDE-OVER DETAILED DRAWER (Wider max-w-2xl)
      ═══════════════════════════════════════════════════════════════════ */}
      {selectedCertForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop Overlay */}
          <div
            onClick={() => setSelectedCertForDrawer(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity animate-in fade-in"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl border-l border-white/[0.12] bg-bg-surface/98 shadow-2xl backdrop-blur-2xl p-6 sm:p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
              
              {/* Drawer Header */}
              <div className="flex items-start justify-between border-b border-white/[0.08] pb-5">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] p-2">
                    <ProviderLogo provider={selectedCertForDrawer.provider} size="md" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-brand-orange/15 px-2.5 py-0.5 text-xs font-bold text-brand-orange border border-brand-orange/30">
                        {selectedCertForDrawer.provider}
                      </span>
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded">
                        {selectedCertForDrawer.code}
                      </span>
                      <span className="rounded bg-white/[0.08] px-2 py-0.5 text-xs font-semibold text-text-muted">
                        {selectedCertForDrawer.level}
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-xl font-bold text-white sm:text-2xl">
                      {selectedCertForDrawer.title}
                    </h2>
                    <p className="text-xs text-text-muted mt-1">{selectedCertForDrawer.jobRole}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCertForDrawer(null)}
                  className="rounded-lg p-2 text-text-muted hover:bg-white/[0.06] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Prerequisites Callout */}
              <div className="mt-6">
                {selectedCertForDrawer.prerequisites && selectedCertForDrawer.prerequisites.length > 0 ? (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                      <AlertTriangle size={15} />
                      <span>Recommended Prerequisites</span>
                    </div>
                    <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-amber-200/90">
                      {selectedCertForDrawer.prerequisites.map((pr, idx) => (
                        <li key={idx}>{pr}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 size={16} />
                    <span>Prerequisite: None (Direct Entry)</span>
                  </div>
                )}
              </div>

              {/* Exam Blueprint Overview */}
              <div className="mt-6 space-y-4">
                <h3 className="flex items-center gap-2 font-display text-sm font-bold text-white">
                  <Clock size={16} className="text-brand-orange" />
                  Official Exam Overview
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/[0.06] bg-bg-card p-3.5">
                    <span className="text-[10px] uppercase text-text-muted font-bold">Exam Code</span>
                    <p className="mt-0.5 font-mono text-xs font-bold text-white">{selectedCertForDrawer.overview.examCode}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-bg-card p-3.5">
                    <span className="text-[10px] uppercase text-text-muted font-bold">Time Limit</span>
                    <p className="mt-0.5 text-xs font-bold text-white">{selectedCertForDrawer.overview.timeLimitMinutes} Minutes</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-bg-card p-3.5">
                    <span className="text-[10px] uppercase text-text-muted font-bold">Passing Score</span>
                    <p className="mt-0.5 text-xs font-bold text-emerald-400">{selectedCertForDrawer.overview.passingScore || '700 / 1000'}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-bg-card p-3.5">
                  <span className="text-[10px] uppercase text-text-muted font-bold">Languages Supported</span>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {selectedCertForDrawer.overview.languages.map((lang, idx) => (
                      <span key={idx} className="rounded-md bg-white/[0.06] px-2.5 py-1 text-[11px] text-white">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Syllabus Summary & Module Distributions */}
              <div className="mt-6 space-y-4">
                <h3 className="flex items-center gap-2 font-display text-sm font-bold text-white">
                  <Layers size={16} className="text-brand-orange" />
                  Curriculum & Syllabus Distributions
                </h3>
                <div className="space-y-3">
                  {selectedCertForDrawer.syllabus.map((mod, idx) => (
                    <div key={idx} className="rounded-xl border border-white/[0.06] bg-bg-card p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>{mod.moduleTitle}</span>
                        <span className="text-brand-orange font-mono">{mod.weightagePercent}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-orange to-amber-400"
                          style={{ width: `${mod.weightagePercent}%` }}
                        />
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {mod.topics.map((t, tidx) => (
                          <span key={tidx} className="rounded bg-white/[0.04] px-2 py-0.5 text-[10px] text-text-muted">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drawer Bottom Actions */}
              <div className="mt-8 border-t border-white/[0.08] pt-5 space-y-3">
                <button
                  onClick={() => {
                    const cert = selectedCertForDrawer;
                    setSelectedCertForDrawer(null);
                    handleOpenLeadModal(cert);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-orange py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 transition-colors"
                >
                  <Sparkles size={16} />
                  Book Prep Guidance / Request Voucher
                </button>

                {selectedCertForDrawer.link && (
                  <a
                    href={selectedCertForDrawer.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/[0.12] py-2.5 text-xs font-semibold text-text-muted hover:text-white transition-colors"
                  >
                    <span>View Vendor Official Documentation</span>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          8. DUAL-CTA LEAD MODAL (Golden & Red Shining Borders, Center Aligned)
      ═══════════════════════════════════════════════════════════════════ */}
      {selectedCertForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-4xl rounded-2xl border border-amber-400/50 border-b-4 border-b-rose-500 bg-bg-surface shadow-[0_0_35px_rgba(245,158,11,0.25),0_6px_25px_rgba(244,63,94,0.4)] overflow-hidden relative">
            
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedCertForModal(null)}
              className="absolute right-4 top-4 z-20 rounded-full bg-black/50 p-1.5 text-white hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>

            {modalSubmitted ? (
              <div className="p-12 text-center space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="font-display text-2xl font-bold text-white">Inquiry Successfully Registered!</h4>
                <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
                  Thank you for submitting your details. Our certification consultants will contact you shortly with voucher options and pass blueprints.
                </p>
                <div className="rounded-xl bg-bg-card p-3 border border-white/[0.06] text-xs text-white font-mono max-w-sm mx-auto">
                  {selectedCertForModal.code} - {modalForm.email}
                </div>
                <button
                  onClick={() => setSelectedCertForModal(null)}
                  className="rounded-xl bg-brand-orange px-8 py-3 text-xs font-bold text-white hover:bg-orange-600 transition-colors"
                >
                  Back to Certifications Hub
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
                
                {/* ─── LEFT COLUMN: CONTEXTUAL INQUIRY FORM ─── */}
                <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                  <form onSubmit={handleModalSubmit} className="space-y-4">
                    
                    {/* Header Label */}
                    <div className="border-b border-white/[0.08] pb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-brand-orange">
                        {audience === 'corporate' ? 'Corporate Team & Institute Proposal' : 'Individual Certification Consultation'}
                      </span>
                      <h3 className="font-display text-lg font-bold text-white">
                        {selectedCertForModal.title}
                      </h3>
                      <p className="font-mono text-xs text-cyan-400">Exam Code: {selectedCertForModal.code}</p>
                    </div>

                    {/* FORM VARIANT 1: INDIVIDUAL VIEW */}
                    {audience === 'individual' ? (
                      <>
                        {/* Who Will Be Funding Question */}
                        <div>
                          <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                            * Who Will Be Funding The Course?
                          </label>
                          <div className="mt-1.5 grid grid-cols-3 gap-2">
                            {(['My employer', 'I will', 'Not sure'] as const).map((opt) => (
                              <button
                                type="button"
                                key={opt}
                                onClick={() => setModalFunding(opt)}
                                className={clsx(
                                  'rounded-lg border py-2 text-xs font-bold transition-all',
                                  modalFunding === opt
                                    ? 'border-brand-orange bg-brand-orange text-white shadow-md'
                                    : 'border-white/[0.12] bg-bg-card text-text-muted hover:text-white'
                                )}
                              >
                                {opt}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Full Name & Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-text-muted">* Full Name</label>
                            <input
                              type="text"
                              required
                              placeholder="John Doe"
                              value={modalForm.fullName}
                              onChange={(e) => setModalForm({ ...modalForm, fullName: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-white/[0.12] bg-bg-card p-2.5 text-xs text-white focus:border-brand-orange focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-text-muted">* Email</label>
                            <input
                              type="email"
                              required
                              placeholder="me@email.com"
                              value={modalForm.email}
                              onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-white/[0.12] bg-bg-card p-2.5 text-xs text-white focus:border-brand-orange focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Mobile & Job Title */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-text-muted">* Mobile</label>
                            <div className="mt-1 flex rounded-xl border border-white/[0.12] bg-bg-card overflow-hidden">
                              <select
                                value={modalForm.countryCode}
                                onChange={(e) => setModalForm({ ...modalForm, countryCode: e.target.value })}
                                className="bg-transparent px-2 text-xs text-text-muted focus:outline-hidden border-r border-white/[0.1]"
                              >
                                <option value="+91">IN +91</option>
                                <option value="+1">US +1</option>
                                <option value="+44">UK +44</option>
                                <option value="+971">UAE +971</option>
                                <option value="+65">SG +65</option>
                              </select>
                              <input
                                type="tel"
                                required
                                placeholder="98765 43210"
                                value={modalForm.mobile}
                                onChange={(e) => setModalForm({ ...modalForm, mobile: e.target.value })}
                                className="w-full bg-transparent p-2.5 text-xs text-white focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-text-muted">* Job Title</label>
                            <input
                              type="text"
                              required
                              placeholder="Cloud Architect / Developer"
                              value={modalForm.jobTitle}
                              onChange={(e) => setModalForm({ ...modalForm, jobTitle: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-white/[0.12] bg-bg-card p-2.5 text-xs text-white focus:border-brand-orange focus:outline-hidden"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      /* FORM VARIANT 2: INSTITUTE / CORPORATE VIEW */
                      <>
                        {/* Company / Institute Name */}
                        <div>
                          <label className="text-xs font-semibold text-text-muted">* Company Name / Institute Name</label>
                          <input
                            type="text"
                            required
                            placeholder="Acme University / Tech Corp"
                            value={modalForm.companyOrInstitute}
                            onChange={(e) => setModalForm({ ...modalForm, companyOrInstitute: e.target.value })}
                            className="mt-1 w-full rounded-xl border border-white/[0.12] bg-bg-card p-2.5 text-xs text-white focus:border-brand-orange focus:outline-hidden"
                          />
                        </div>

                        {/* Full Name & Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-text-muted">* Full Name</label>
                            <input
                              type="text"
                              required
                              placeholder="Jane Smith"
                              value={modalForm.fullName}
                              onChange={(e) => setModalForm({ ...modalForm, fullName: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-white/[0.12] bg-bg-card p-2.5 text-xs text-white focus:border-brand-orange focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-text-muted">* Email</label>
                            <input
                              type="email"
                              required
                              placeholder="lead@company.com"
                              value={modalForm.email}
                              onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-white/[0.12] bg-bg-card p-2.5 text-xs text-white focus:border-brand-orange focus:outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Mobile & Direct Clean Numeric Team Size Input (No suggestion pills) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-text-muted">* Mobile</label>
                            <div className="mt-1 flex rounded-xl border border-white/[0.12] bg-bg-card overflow-hidden">
                              <select
                                value={modalForm.countryCode}
                                onChange={(e) => setModalForm({ ...modalForm, countryCode: e.target.value })}
                                className="bg-transparent px-2 text-xs text-text-muted focus:outline-hidden border-r border-white/[0.1]"
                              >
                                <option value="+91">IN +91</option>
                                <option value="+1">US +1</option>
                                <option value="+44">UK +44</option>
                                <option value="+971">UAE +971</option>
                                <option value="+65">SG +65</option>
                              </select>
                              <input
                                type="tel"
                                required
                                placeholder="98765 43210"
                                value={modalForm.mobile}
                                onChange={(e) => setModalForm({ ...modalForm, mobile: e.target.value })}
                                className="w-full bg-transparent p-2.5 text-xs text-white focus:outline-hidden"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-semibold text-text-muted">* Team Size (Learners)</label>
                            <input
                              type="number"
                              min="1"
                              required
                              placeholder="e.g. 15"
                              value={modalForm.teamSize}
                              onChange={(e) => setModalForm({ ...modalForm, teamSize: e.target.value })}
                              className="mt-1 w-full rounded-xl border border-white/[0.12] bg-bg-card p-2.5 text-xs text-white focus:border-brand-orange focus:outline-hidden"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {/* Message Optional */}
                    <div>
                      <label className="text-xs font-semibold text-text-muted">Message (Optional)</label>
                      <textarea
                        rows={2}
                        placeholder={audience === 'corporate' ? "Mention specific department goals or cohort timelines..." : "Mention your exam target timeline..."}
                        value={modalForm.message}
                        onChange={(e) => setModalForm({ ...modalForm, message: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-white/[0.12] bg-bg-card p-2 text-xs text-white focus:border-brand-orange focus:outline-hidden"
                      />
                    </div>

                    {/* Disclaimer */}
                    <p className="text-[11px] text-text-muted leading-tight">
                      By submitting your details you agree to be contacted in order to respond to your enquiry.
                    </p>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={submittingModal}
                      className="w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-black py-3.5 font-display text-sm font-extrabold tracking-wide uppercase shadow-lg transition-all active:scale-98 disabled:opacity-50"
                    >
                      {submittingModal
                        ? 'Submitting Request...'
                        : audience === 'corporate'
                        ? 'Connect with Advisor'
                        : 'Book Consultation'}
                    </button>
                  </form>
                </div>

                {/* ─── RIGHT COLUMN: PROFESSIONAL TAILORED AD BANNER ─── */}
                <div className="md:col-span-5 bg-gradient-to-br from-[#0e0c1f] via-[#1a1235] to-[#120e28] p-6 sm:p-8 flex flex-col items-center justify-between text-center relative overflow-hidden border-t md:border-t-0 md:border-l border-white/[0.1]">
                  
                  {/* Subtle Background Lighting & Grid Texture */}
                  <div className="absolute -top-24 -right-24 h-60 w-60 rounded-full bg-brand-orange/15 blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-purple-600/20 blur-3xl pointer-events-none" />
                  <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                  {audience === 'corporate' ? (
                    /* ─── CORPORATE / INSTITUTE AD SECTION ─── */
                    <>
                      {bannerConfig.CERT_CORPORATE_AD_IMAGE ? (
                        <div className="relative z-10 w-full mb-4 overflow-hidden rounded-xl border border-white/10 shadow-lg">
                          <img
                            src={bannerConfig.CERT_CORPORATE_AD_IMAGE}
                            alt="Enterprise Cohort"
                            className="w-full h-36 object-cover"
                          />
                        </div>
                      ) : null}

                      <div className="relative z-10 space-y-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-1 text-[10px] font-extrabold text-amber-300 border border-amber-400/40 uppercase tracking-wider shadow-inner">
                          <Building2 size={12} className="text-brand-orange" />
                          {bannerConfig.CERT_CORPORATE_AD_BADGE || 'Enterprise Training Cohorts'}
                        </span>
                        <h4 className="mt-2 font-display text-2xl font-black text-white tracking-tight">
                          {bannerConfig.CERT_CORPORATE_AD_TITLE || 'Upskill Your Team.'}
                        </h4>
                        <p className="font-display text-xl font-extrabold text-amber-200/90">
                          {bannerConfig.CERT_CORPORATE_AD_SUBTITLE || `Save up to ${bannerConfig.CERT_CORPORATE_AD_DISCOUNT || '40'}%.`}
                        </p>
                      </div>

                      {/* Glassmorphic Professional Badge Box */}
                      <div className="my-5 relative z-10 w-full max-w-[240px]">
                        <div className="rounded-2xl border border-amber-400/30 bg-white/[0.04] p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.08] to-purple-500/[0.08] pointer-events-none" />
                          
                          <span className="inline-block rounded-md bg-black/50 px-2.5 py-0.5 text-[10px] font-extrabold tracking-widest text-amber-400 uppercase border border-amber-400/20 shadow-sm">
                            {bannerConfig.CERT_CORPORATE_AD_CARD_BADGE || 'Group Volume Discount'}
                          </span>

                          <div className="my-2.5 font-display text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-amber-200 to-orange-400 tracking-tighter drop-shadow-md">
                            -{bannerConfig.CERT_CORPORATE_AD_DISCOUNT || '40'}%
                          </div>

                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500 text-black px-3.5 py-1 text-xs font-black tracking-wide uppercase shadow-md">
                            <Users size={12} />
                            {bannerConfig.CERT_CORPORATE_AD_CTA || 'Unlock Group Pricing'}
                          </span>
                        </div>
                      </div>

                      <div className="relative z-10 text-[11px] font-semibold text-purple-200/80 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-amber-400" />
                        <span>{bannerConfig.CERT_CORPORATE_AD_FOOTER || 'Corporate cohorts & bulk exam vouchers'}</span>
                      </div>
                    </>
                  ) : (
                    /* ─── INDIVIDUAL AD SECTION ─── */
                    <>
                      {bannerConfig.CERT_INDIVIDUAL_AD_IMAGE ? (
                        <div className="relative z-10 w-full mb-4 overflow-hidden rounded-xl border border-white/10 shadow-lg">
                          <img
                            src={bannerConfig.CERT_INDIVIDUAL_AD_IMAGE}
                            alt="Individual Promo"
                            className="w-full h-36 object-cover"
                          />
                        </div>
                      ) : null}

                      <div className="relative z-10 space-y-1.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-orange/20 to-purple-500/20 px-3 py-1 text-[10px] font-extrabold text-amber-300 border border-brand-orange/40 uppercase tracking-wider shadow-inner">
                          <Sparkles size={12} className="text-brand-orange" />
                          Individual Fast-Track
                        </span>
                        <h4 className="mt-2 font-display text-2xl font-black text-white tracking-tight">
                          {bannerConfig.CERT_INDIVIDUAL_AD_TITLE || 'Upgrade Your Skills.'}
                        </h4>
                        <p className="font-display text-xl font-extrabold text-purple-200">
                          {bannerConfig.CERT_INDIVIDUAL_AD_SUBTITLE || 'Save More Today.'}
                        </p>
                      </div>

                      {/* Glassmorphic Badge Box */}
                      <div className="my-5 relative z-10 w-full max-w-[240px]">
                        <div className="rounded-2xl border border-purple-400/30 bg-white/[0.04] p-5 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.08] to-orange-500/[0.08] pointer-events-none" />

                          <span className="inline-block rounded-md bg-black/50 px-2.5 py-0.5 text-[10px] font-extrabold tracking-widest text-amber-400 uppercase border border-white/10 shadow-sm">
                            {bannerConfig.CERT_INDIVIDUAL_AD_BADGE || 'SUPER SALE'}
                          </span>

                          <div className="my-2.5 font-display text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-amber-300 tracking-tighter drop-shadow-md">
                            -{bannerConfig.CERT_INDIVIDUAL_AD_DISCOUNT || '40'}%
                          </div>

                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500 text-black px-3.5 py-1 text-xs font-black tracking-wide uppercase shadow-md">
                            <Sparkles size={12} />
                            {bannerConfig.CERT_INDIVIDUAL_AD_CTA || 'Shop Now'}
                          </span>
                        </div>
                      </div>

                      <div className="relative z-10 text-[11px] font-semibold text-purple-200/80 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-amber-400" />
                        <span>Unlock up to {bannerConfig.CERT_INDIVIDUAL_AD_DISCOUNT || '40'}% off today!</span>
                        <Sparkles size={14} className="text-amber-400" />
                      </div>
                    </>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Certifications;
