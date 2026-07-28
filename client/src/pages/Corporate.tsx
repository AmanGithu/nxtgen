import { useState } from 'react';
import { corporateAPI } from '../services/api';
import { Building2, CheckCircle2, Send, Users, Shield, Award } from 'lucide-react';

const Corporate = () => {
  const [form, setForm] = useState({
    companyName: '',
    contactName: '',
    workEmail: '',
    phone: '',
    teamSize: '10-50 employees',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await corporateAPI.inquire(form);
      setSubmitted(true);
    } catch (err) {
      console.error('Corporate inquiry failed:', err);
    }
  };

  const corporateFeatures = [
    { title: 'Customized Curriculum', desc: 'Tailor AI and Database courses to your company tech stack (Azure, AWS, PyTorch, LangChain).' },
    { title: 'Dedicated Cohort Mentors', desc: '1-on-1 feedback on real company projects from experienced AI architects.' },
    { title: 'Enterprise Dashboard', desc: 'Track employee attendance, quiz benchmarks, and code submission metrics in real time.' },
    { title: 'Flexible Schedules', desc: 'Choose between weekend bootcamps, evening workshops, or self-paced video modules.' },
  ];

  return (
    <div className="min-h-screen bg-bg-canvas py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Hero */}
        <div className="mb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-orange/10 px-4 py-1.5 text-xs font-semibold text-brand-orange">
            <Building2 size={14} />
            Enterprise Talent Upskilling
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Upskill Your Workforce at <span className="text-brand-orange">Enterprise Scale</span>
          </h1>
          <p className="mt-4 text-lg text-text-muted">
            Transform your engineering teams into GenAI & Database performance experts with accredited corporate training.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mb-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {corporateFeatures.map((feat, idx) => (
            <div key={idx} className="rounded-xl border border-white/[0.08] bg-bg-surface p-6">
              <CheckCircle2 className="h-8 w-8 text-brand-orange" />
              <h3 className="mt-4 font-display text-lg font-bold text-white">{feat.title}</h3>
              <p className="mt-2 text-xs text-text-muted leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

        {/* Form & Info Section */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          
          {/* Info */}
          <div className="space-y-6 rounded-xl border border-white/[0.08] bg-bg-surface p-8">
            <h2 className="font-display text-2xl font-bold text-white">Why Global Tech Teams Trust NxtGen Academy</h2>
            <p className="text-sm text-text-muted leading-relaxed">
              We partner with Fortune 500 enterprises and hyper-growth startups to bridge critical skills gaps in Generative AI, RAG architecture, vector search, and database high-availability.
            </p>

            <div className="space-y-4 pt-4 border-t border-white/[0.08]">
              <div className="flex items-center gap-4">
                <Users className="h-6 w-6 text-brand-orange" />
                <div>
                  <h4 className="font-bold text-sm text-white">10,000+ Engineers Trained</h4>
                  <p className="text-xs text-text-muted">Over 94% course completion rate across corporate cohorts.</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Shield className="h-6 w-6 text-brand-orange" />
                <div>
                  <h4 className="font-bold text-sm text-white">SOC2 & Enterprise Data Protection</h4>
                  <p className="text-xs text-text-muted">All hands-on labs run in secure, isolated sandbox environments.</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Award className="h-6 w-6 text-brand-orange" />
                <div>
                  <h4 className="font-bold text-sm text-white">Vendor Certified Instructors</h4>
                  <p className="text-xs text-text-muted">Curricula delivered exclusively by certified cloud architects.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lead Form */}
          <div className="rounded-xl border border-white/[0.08] bg-bg-surface p-8">
            <h2 className="font-display text-2xl font-bold text-white">Request a Custom Corporate Quote</h2>
            <p className="mt-1 text-xs text-text-muted">Fill out the form below to receive customized pricing and curriculum proposals.</p>

            {submitted ? (
              <div className="my-12 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-brand-orange" />
                <h4 className="mt-4 text-xl font-bold text-white">Proposal Request Submitted!</h4>
                <p className="mt-2 text-sm text-text-muted">
                  An enterprise account manager will contact <strong className="text-white">{form.workEmail}</strong> within 4 business hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-text-muted">Company Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Acme Corp"
                      value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2.5 text-sm text-white focus:border-brand-orange focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-muted">Contact Person Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Sarah Jenkins"
                      value={form.contactName}
                      onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2.5 text-sm text-white focus:border-brand-orange focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-text-muted">Work Email</label>
                    <input
                      type="email"
                      required
                      placeholder="sarah@acme.com"
                      value={form.workEmail}
                      onChange={(e) => setForm({ ...form, workEmail: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2.5 text-sm text-white focus:border-brand-orange focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-muted">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2.5 text-sm text-white focus:border-brand-orange focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Team Size to Upskill</label>
                  <select
                    value={form.teamSize}
                    onChange={(e) => setForm({ ...form, teamSize: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2.5 text-sm text-white focus:border-brand-orange focus:outline-hidden"
                  >
                    <option value="1-10 employees">1 – 10 Engineers</option>
                    <option value="10-50 employees">10 – 50 Engineers</option>
                    <option value="50-200 employees">50 – 200 Engineers</option>
                    <option value="200+ employees">200+ Enterprise Team</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Training Objectives & Requirements</label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about your target technology stack and timeline..."
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2.5 text-sm text-white focus:border-brand-orange focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-lg bg-brand-orange py-3 text-sm font-semibold text-white hover:bg-brand-orange/90 shadow-lg"
                >
                  Request Enterprise Training Proposal →
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default Corporate;
