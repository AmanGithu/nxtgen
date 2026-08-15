import React, { useState } from 'react';
import {
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  InstagramIcon,
  YoutubeIcon,
} from '../components/SocialIcons';
import NxtGenVoiceAgent from '../components/NxtGenVoiceAgent';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]*[(]?[0-9]{1,4}[)]?[-\s./0-9]{7,15}$/;

const PROGRAM_OPTIONS = [
  'Data Analytics and AI',
  'Database Management',
  'Cyber Security',
  'Generative AI Internship',
  'Agentic AI Internship',
  'Data Analytics Internship',
  'AI Consultation (Corporate)',
  'Corporate Training',
  'AI Tools Store',
  'Technical Job Support',
  'General Career Guidance / Other',
];

const SOCIAL_MEDIA = [
  { name: 'Facebook', icon: FacebookIcon, href: 'https://facebook.com/nxtgenacademy', color: '#1877F2', bg: '#1877F220' },
  { name: 'Twitter / X', icon: TwitterIcon, href: 'https://twitter.com/nxtgenacademy', color: '#1DA1F2', bg: '#1DA1F220' },
  { name: 'LinkedIn', icon: LinkedinIcon, href: 'https://linkedin.com/company/nxtgenacademy', color: '#0A66C2', bg: '#0A66C220' },
  { name: 'Instagram', icon: InstagramIcon, href: 'https://instagram.com/nxtgenacademy', color: '#E4405F', bg: '#E4405F20' },
  { name: 'YouTube', icon: YoutubeIcon, href: 'https://youtube.com/@nxtgenacademy', color: '#FF0000', bg: '#FF000020' },
];

export default function ConnectUs() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    program: PROGRAM_OPTIONS[0],
    message: '',
  });

  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [contactInfo, setContactInfo] = useState({
    emailPrimary: 'contact@nxtgenacademy.in',
    emailAdmissions: 'admissions@nxtgenacademy.in',
    phone: '+91 96730-04500',
    address: 'PAVY Consultancy Services Pvt Ltd, Tech Park Campus, Hyderabad, India',
  });

  React.useEffect(() => {
    fetch('/api/guest/about-us-config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config) {
          setContactInfo({
            emailPrimary: data.config.CONTACT_EMAIL_PRIMARY || 'contact@nxtgenacademy.in',
            emailAdmissions: data.config.CONTACT_EMAIL_ADMISSIONS || 'admissions@nxtgenacademy.in',
            phone: data.config.CONTACT_PHONE || '+91 96730-04500',
            address: data.config.CONTACT_ADDRESS || 'PAVY Consultancy Services Pvt Ltd, Tech Park Campus, Hyderabad, India',
          });
        }
      })
      .catch(() => {});
  }, []);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Full Name is required (minimum 2 letters).';
    }

    if (!formData.email || !EMAIL_REGEX.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address (e.g. name@domain.com).';
    }

    if (!formData.phone || !PHONE_REGEX.test(formData.phone.trim().replace(/\s+/g, ''))) {
      errors.phone = 'Please enter a valid phone number (e.g. +91-9876543210 or 10-digit number).';
    }

    if (!formData.message || formData.message.trim().length < 3) {
      errors.message = 'Please describe your thoughts and expectations.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/certifications/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificationName: `[Connect Us] ${formData.program}`,
          userName: formData.name,
          userEmail: formData.email,
          userPhone: formData.phone,
          message: formData.message,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Also log to Lead Manager dashboard
        try {
          await fetch('/api/leads/public', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ctaType: 'FORM',
              sourceCategory: formData.program,
              fullName: formData.name,
              email: formData.email,
              phone: formData.phone,
              notes: formData.message,
            }),
          });
        } catch { /* non-blocking */ }

        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          program: PROGRAM_OPTIONS[0],
          message: '',
        });
        setFieldErrors({});
      } else {
        setApiError(data.message || data.error || 'Failed to submit inquiry. Please try again.');
      }
    } catch (err: any) {
      setApiError('A network connection error occurred. Please check your internet and retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-bg-canvas text-white pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      {/* Background Decorative Glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-full max-w-7xl bg-gradient-to-b from-brand-orange/10 via-amber-500/5 to-transparent blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* ─── HERO HEADER ─── */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-4 py-1.5 text-xs font-bold text-brand-orange mb-4 shadow-sm backdrop-blur-md">
            <Sparkles size={14} />
            <span>NXTGEN ACADEMY</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display tracking-tight text-white mb-4 leading-tight">
            Unlocking Your Potential to Powerful Moves—<br className="hidden sm:block" />
            <span className="text-brand-orange">Craft Your Professional Legacy</span>
          </h1>
          <p className="text-sm sm:text-base text-white mb-1 font-medium">Welcome to PAVY Academy.</p>
          <p className="text-text-muted text-sm sm:text-base leading-relaxed">
            Connect with our Live AI Co-ordinator, Career Advisors or Corporates Upskilling Architects.
          </p>
        </div>

        {/* ─── AI CO-ORDINATOR SECTION ─── */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white font-display">Live AI Co-ordinator</h2>
            <p className="text-xs text-text-muted mt-1">Talk to our AI Co-ordinator via voice or text — available 24/7</p>
          </div>
          <NxtGenVoiceAgent />
        </div>

        {/* ─── SOCIAL MEDIA SECTION ─── */}
        <div className="mb-12">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-white font-display">Connect on Social Media</h2>
            <p className="text-xs text-text-muted mt-1">Follow NxtGen Academy on our social platforms</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {SOCIAL_MEDIA.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] px-5 py-3 transition-all hover:scale-105 hover:border-white/20 shadow-md"
                  style={{ backgroundColor: social.bg }}
                >
                  <Icon size={20} style={{ color: social.color }} />
                  <span className="text-sm font-semibold text-white">{social.name}</span>
                </a>
              );
            })}
          </div>
        </div>

        {/* ─── MAIN GRID: Direct Consultation Info & Form ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Left Column: Direct Consultation */}
          <div className="lg:col-span-5 space-y-6 rounded-3xl border border-white/[0.1] bg-bg-surface/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div>
              <h2 className="text-2xl font-bold font-display text-white">Direct Consultation</h2>
              <p className="mt-2 text-xs sm:text-sm text-text-muted leading-relaxed">
                Whether you are an individual engineer looking to master Generative AI, a database professional leveling up on Azure, or an enterprise seeking custom team cohorts — our advisors are ready.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
                  <MapPin size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Academy Headquarters</h4>
                  <p className="text-xs text-text-muted mt-0.5">{contactInfo.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
                  <Mail size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Email Inquiries</h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    <a href={`mailto:${contactInfo.emailPrimary}`} className="hover:text-brand-orange transition-colors">{contactInfo.emailPrimary}</a>
                  </p>
                  <p className="text-xs text-text-muted">
                    <a href={`mailto:${contactInfo.emailAdmissions}`} className="hover:text-brand-orange transition-colors">{contactInfo.emailAdmissions}</a>
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange">
                  <Phone size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">Executive Desk</h4>
                  <p className="text-xs text-text-muted mt-0.5">
                    <a href={`tel:${contactInfo.phone.replace(/[^0-[#9+]/g, '')}`} className="hover:text-brand-orange transition-colors">{contactInfo.phone}</a>
                  </p>
                </div>
              </div>
            </div>

            {/* NDA badge */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
              <p className="text-[11px] text-text-muted leading-tight">
                Enterprise NDA compliant. All student and client inquiries are handled strictly under corporate confidentiality standards.
              </p>
            </div>
          </div>

          {/* Right Column: Connect With Us Form */}
          <div className="lg:col-span-7 rounded-3xl border border-white/[0.12] bg-bg-card/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            {success ? (
              <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="text-2xl font-bold font-display text-white">Message Sent Successfully!</h3>
                <p className="text-sm text-text-muted max-w-md mx-auto leading-relaxed">
                  Thank you for connecting with NxtGen Academy. Your message has been saved and our team will get back to you as soon as possible.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setSuccess(false)}
                    className="rounded-xl bg-brand-orange px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg hover:bg-orange-600 transition-all hover:scale-105"
                  >
                    Send Another Message
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold font-display text-white">Connect With Us</h3>
                  <p className="text-xs text-text-muted mt-1">
                    We would love to hear from you. Please fill the form below and we will get back to you as soon as possible.
                  </p>
                </div>

                {apiError && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs font-semibold text-red-400">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{apiError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="text-xs font-bold text-white block mb-1">Full Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Ravi Paul"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: '' });
                      }}
                      className={`w-full rounded-xl border bg-bg-surface px-3.5 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none transition-colors ${
                        fieldErrors.name ? 'border-red-500 bg-red-500/5' : 'border-white/[0.1] focus:border-brand-orange'
                      }`}
                    />
                    {fieldErrors.name && (
                      <span className="text-[11px] font-semibold text-red-400 mt-1 block">{fieldErrors.name}</span>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-bold text-white block mb-1">Email Address *</label>
                    <input
                      type="email"
                      placeholder="e.g. name@domain.com"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' });
                      }}
                      className={`w-full rounded-xl border bg-bg-surface px-3.5 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none transition-colors ${
                        fieldErrors.email ? 'border-red-500 bg-red-500/5' : 'border-white/[0.1] focus:border-brand-orange'
                      }`}
                    />
                    {fieldErrors.email && (
                      <span className="text-[11px] font-semibold text-red-400 mt-1 block">{fieldErrors.email}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label className="text-xs font-bold text-white block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="e.g. +91 96730-04500"
                      value={formData.phone}
                      onChange={(e) => {
                        setFormData({ ...formData, phone: e.target.value });
                        if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' });
                      }}
                      className={`w-full rounded-xl border bg-bg-surface px-3.5 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none transition-colors ${
                        fieldErrors.phone ? 'border-red-500 bg-red-500/5' : 'border-white/[0.1] focus:border-brand-orange'
                      }`}
                    />
                    {fieldErrors.phone && (
                      <span className="text-[11px] font-semibold text-red-400 mt-1 block">{fieldErrors.phone}</span>
                    )}
                  </div>

                  {/* Program or Services */}
                  <div>
                    <label className="text-xs font-bold text-white block mb-1">Program or Services Interested *</label>
                    <select
                      value={formData.program}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value })}
                      className="w-full rounded-xl border border-white/[0.1] bg-bg-surface px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                    >
                      {PROGRAM_OPTIONS.map((opt, idx) => (
                        <option key={idx} value={opt} className="bg-bg-surface text-white">
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Describe Thoughts */}
                <div>
                  <label className="text-xs font-bold text-white block mb-1">Describe your Thoughts and Expectations *</label>
                  <textarea
                    rows={4}
                    placeholder="Tell us about your learning goals, cohort size, or technical questions..."
                    value={formData.message}
                    onChange={(e) => {
                      setFormData({ ...formData, message: e.target.value });
                      if (fieldErrors.message) setFieldErrors({ ...fieldErrors, message: '' });
                    }}
                    className={`w-full rounded-xl border bg-bg-surface px-3.5 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none transition-colors ${
                      fieldErrors.message ? 'border-red-500 bg-red-500/5' : 'border-white/[0.1] focus:border-brand-orange'
                    }`}
                  />
                  {fieldErrors.message && (
                    <span className="text-[11px] font-semibold text-red-400 mt-1 block">{fieldErrors.message}</span>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange to-orange-600 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-brand-orange/20 hover:from-orange-600 hover:to-brand-orange transition-all hover:scale-[1.01] active:scale-98 disabled:opacity-50"
                >
                  {loading ? (
                    <span>Sending Message...</span>
                  ) : (
                    <>
                      <span>Send Message</span>
                      <Send size={13} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
