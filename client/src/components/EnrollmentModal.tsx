import { useState, useEffect } from 'react';
import { X, Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  programName?: string;
}

const PROGRAM_OPTIONS = [
  'Data Analytics and AI',
  'Database Management',
  'Cyber Security',
  'Generative AI Internship',
  'Agentic AI Internship',
  'Data Analytics Internship',
  'Database Management Internship',
  'AI Training (Corporate)',
  'AI Consultation (Corporate)',
  'Technical Job Support',
  'General Inquiry',
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]*[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/;

export default function EnrollmentModal({ isOpen, onClose, programName }: EnrollmentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    program: programName || PROGRAM_OPTIONS[0],
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (programName) {
      setFormData((f) => ({ ...f, program: programName }));
    }
  }, [programName]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSuccess(false);
      setApiError(null);
      setErrors({});
    }
  }, [isOpen]);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!formData.name || formData.name.trim().length < 2) e.name = 'Full name is required (min 2 chars).';
    if (!EMAIL_REGEX.test(formData.email.trim())) e.email = 'Please enter a valid email.';
    if (!PHONE_REGEX.test(formData.phone.trim().replace(/\s+/g, ''))) e.phone = 'Please enter a valid phone number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/certifications/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificationName: `[Enrollment] ${formData.program}`,
          userName: formData.name,
          userEmail: formData.email,
          userPhone: formData.phone,
          message: formData.message || `Interested in enrolling for ${formData.program}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setFormData({ name: '', email: '', phone: '', program: programName || PROGRAM_OPTIONS[0], message: '' });
      } else {
        setApiError(data.message || 'Failed to submit. Please try again.');
      }
    } catch {
      setApiError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-3xl border border-white/[0.12] bg-bg-surface shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-white font-display">Enroll Now</h2>
            <p className="text-xs text-text-muted mt-0.5">Fill in your details and we'll get in touch</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/[0.1] p-2 text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="py-8 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Enrollment Request Received!</h3>
              <p className="text-sm text-text-muted max-w-xs mx-auto">
                Thank you! Our team will contact you within 24 hours to complete your enrollment.
              </p>
              <button
                onClick={onClose}
                className="rounded-xl bg-brand-orange px-6 py-2.5 text-xs font-bold text-white hover:bg-orange-600 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {apiError && (
                <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-semibold text-red-400">
                  <AlertCircle size={15} />
                  <span>{apiError}</span>
                </div>
              )}

              {/* Program */}
              <div>
                <label className="text-xs font-bold text-white block mb-1">Program or Services *</label>
                <select
                  value={formData.program}
                  onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.1] bg-bg-card px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                >
                  {PROGRAM_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="bg-bg-surface text-white">{opt}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Name */}
                <div>
                  <label className="text-xs font-bold text-white block mb-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ravi Paul"
                    value={formData.name}
                    onChange={(e) => { setFormData({ ...formData, name: e.target.value }); if (errors.name) setErrors({ ...errors, name: '' }); }}
                    className={`w-full rounded-xl border bg-bg-card px-3.5 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none transition-colors ${errors.name ? 'border-red-500' : 'border-white/[0.1] focus:border-brand-orange'}`}
                  />
                  {errors.name && <span className="text-[11px] text-red-400 mt-1 block">{errors.name}</span>}
                </div>

                {/* Email */}
                <div>
                  <label className="text-xs font-bold text-white block mb-1">Email *</label>
                  <input
                    type="email"
                    placeholder="name@domain.com"
                    value={formData.email}
                    onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (errors.email) setErrors({ ...errors, email: '' }); }}
                    className={`w-full rounded-xl border bg-bg-card px-3.5 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none transition-colors ${errors.email ? 'border-red-500' : 'border-white/[0.1] focus:border-brand-orange'}`}
                  />
                  {errors.email && <span className="text-[11px] text-red-400 mt-1 block">{errors.email}</span>}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-bold text-white block mb-1">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+91 96730-04500"
                  value={formData.phone}
                  onChange={(e) => { setFormData({ ...formData, phone: e.target.value }); if (errors.phone) setErrors({ ...errors, phone: '' }); }}
                  className={`w-full rounded-xl border bg-bg-card px-3.5 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none transition-colors ${errors.phone ? 'border-red-500' : 'border-white/[0.1] focus:border-brand-orange'}`}
                />
                {errors.phone && <span className="text-[11px] text-red-400 mt-1 block">{errors.phone}</span>}
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-bold text-white block mb-1">Message (optional)</label>
                <textarea
                  rows={3}
                  placeholder="Tell us about your goals or questions..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full rounded-xl border border-white/[0.1] bg-bg-card px-3.5 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-brand-orange resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange to-orange-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-xl hover:from-orange-600 hover:to-brand-orange transition-all hover:scale-[1.01] disabled:opacity-50"
              >
                {loading ? <span>Submitting...</span> : <><span>Submit Enrollment</span><Send size={13} /></>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
