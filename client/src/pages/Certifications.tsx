import { useState, useEffect } from 'react';
import { certificationsAPI } from '../services/api';
import { Award, Search, ExternalLink, MessageSquare, X, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

interface Certification {
  id: string;
  name: string;
  provider: string | null;
  link: string | null;
  prerequisite: string | null;
  isActive: boolean;
  ctaEnabled: boolean;
}

const Certifications = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Inquiry Modal state
  const [selectedCertForModal, setSelectedCertForModal] = useState<Certification | null>(null);
  const [inquiryForm, setInquiryForm] = useState({
    userName: '',
    userEmail: '',
    userPhone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchCertifications();
  }, [search, providerFilter, page]);

  const fetchCertifications = async () => {
    setLoading(true);
    try {
      const res = await certificationsAPI.getAll({
        search: search || undefined,
        provider: providerFilter || undefined,
        page,
        limit: 12,
      });
      if (res.data.success) {
        setCertifications(res.data.certifications);
        setTotalPages(res.data.pagination.totalPages);
        setTotalCount(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch certifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCertForModal) return;

    try {
      await certificationsAPI.submitInquiry({
        certificationId: selectedCertForModal.id,
        certificationName: selectedCertForModal.name,
        ...inquiryForm,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedCertForModal(null);
        setInquiryForm({ userName: '', userEmail: '', userPhone: '', message: '' });
      }, 2500);
    } catch (err) {
      console.error('Failed to submit inquiry:', err);
    }
  };

  const providers = ['Amazon Web Services', 'Microsoft', 'Google Cloud', 'Databricks', 'DeepLearning.AI', 'Oracle', 'EnterpriseDB'];

  return (
    <div className="min-h-screen bg-bg-canvas py-12 text-strong">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            200+ <span className="text-brand-orange">Industry-Recognized</span> Certifications
          </h1>
          <p className="mt-4 text-lg text-text-muted">
            Prepare for world-class vendor certifications across AWS, Azure, GCP, Databricks, Oracle, and PostgreSQL.
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-line bg-bg-surface p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search certifications by name or skill..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-line bg-bg-card pl-10 pr-4 py-2.5 text-sm text-strong focus:border-brand-orange focus:outline-hidden"
            />
          </div>

          <div className="flex gap-3">
            <select
              value={providerFilter}
              onChange={(e) => { setProviderFilter(e.target.value); setPage(1); }}
              className="rounded-lg border border-line bg-bg-card px-4 py-2.5 text-sm text-strong focus:border-brand-orange focus:outline-hidden"
            >
              <option value="">All Providers</option>
              {providers.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Certifications Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl bg-bg-surface border border-line" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {certifications.map((cert) => (
                <div
                  key={cert.id}
                  className="flex flex-col justify-between rounded-xl border border-line bg-bg-surface p-6 transition-all hover:border-brand-orange/40 hover:scale-[1.01]"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-xs font-semibold text-brand-orange">
                        <Award size={12} />
                        {cert.provider || 'Global Cert'}
                      </span>
                      {cert.link && (
                        <a
                          href={cert.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-muted hover:text-strong"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>

                    <h3 className="mt-3 font-display text-lg font-bold text-strong">
                      {cert.name}
                    </h3>
                    
                    {cert.prerequisite && (
                      <p className="mt-2 text-xs text-text-muted">
                        <strong className="text-strong font-medium">Prerequisite:</strong> {cert.prerequisite}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 border-t border-line pt-4">
                    <button
                      onClick={() => setSelectedCertForModal(cert)}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange/10 px-4 py-2 text-sm font-semibold text-brand-orange hover:bg-brand-orange hover:text-on-brand transition-colors"
                    >
                      <MessageSquare size={16} />
                      Contact Us for Prep Guidance
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
                <p className="text-xs text-text-muted">
                  Showing page {page} of {totalPages} ({totalCount} total certifications)
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-strong disabled:opacity-40 hover:bg-elevate"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-strong disabled:opacity-40 hover:bg-elevate"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>

      {/* ─── CONTACT US INQUIRY POPUP MODAL ─── */}
      {selectedCertForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-line bg-bg-surface p-6 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <span className="text-xs font-semibold text-brand-orange uppercase">Certification Prep Inquiry</span>
                <h3 className="font-display text-lg font-bold text-strong">{selectedCertForModal.name}</h3>
              </div>
              <button
                onClick={() => setSelectedCertForModal(null)}
                className="text-text-muted hover:text-strong"
              >
                <X size={20} />
              </button>
            </div>

            {submitted ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-brand-orange" />
                <h4 className="mt-4 text-lg font-bold text-strong">Inquiry Received!</h4>
                <p className="mt-2 text-sm text-text-muted">
                  Our certification experts will send you exam prep notes and voucher details shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Jane Smith"
                    value={inquiryForm.userName}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, userName: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2.5 text-sm text-strong focus:border-brand-orange focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="jane@example.com"
                    value={inquiryForm.userEmail}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, userEmail: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2.5 text-sm text-strong focus:border-brand-orange focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43211"
                    value={inquiryForm.userPhone}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, userPhone: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2.5 text-sm text-strong focus:border-brand-orange focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Message / Question (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Ask about exam voucher discounts or practice test access..."
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-line bg-bg-card p-2.5 text-sm text-strong focus:border-brand-orange focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand-orange py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-orange/90"
                >
                  Submit Certification Inquiry
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Certifications;
