import { Link } from 'react-router-dom';
import {
  Brain,
  Database,
  Server,
  ArrowRight,
  CheckCircle,
  Briefcase,
  Shield,
  Sparkles,
  Users,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { useState } from 'react';
import EnrollmentModal from '../components/EnrollmentModal';

const SERVICES = [
  {
    id: 'data-ai',
    title: 'Data Analytics & Artificial Intelligence',
    icon: Brain,
    image: '/assets/job-support/data-ai.png',
    color: 'from-brand-orange/20 to-amber-500/10 border-brand-orange/30',
    iconColor: 'text-brand-orange',
    items: [
      { name: 'Data Analytics', desc: 'Advanced analytics, dashboards, and reporting solutions' },
      { name: 'Excel & Power Query', desc: 'Complex formulas, pivot tables, and automation' },
      { name: 'Power BI', desc: 'Custom dashboards, DAX formulas, and data modeling' },
      { name: 'Tableau', desc: 'Visualization, calculations, and publishing' },
      { name: 'Python', desc: 'Data manipulation, scripting, and automation' },
      { name: 'Machine Learning', desc: 'Model building, evaluation, and deployment' },
      { name: 'Deep Learning', desc: 'Neural networks, NLP, and computer vision' },
      { name: 'Generative AI', desc: 'LLM integration, RAG pipelines, and prompt engineering' },
    ],
    description: 'Expert on-the-job technical support for data and AI professionals dealing with complex analytical and machine learning challenges at work.',
    whoFor: 'Data Analysts, Data Scientists, BI Developers, ML Engineers',
  },
  {
    id: 'data-engineering',
    title: 'Data Engineering',
    icon: Server,
    image: '/assets/job-support/data-engineering.png',
    color: 'from-blue-500/20 to-cyan-500/10 border-blue-500/30',
    iconColor: 'text-blue-400',
    items: [
      { name: 'Microsoft Fabric', desc: 'Lakehouses, pipelines, and real-time analytics' },
      { name: 'Databricks', desc: 'Delta Lake, Spark optimization, and MLflow' },
      { name: 'Azure Data Factory', desc: 'ETL/ELT pipeline design and debugging' },
      { name: 'Data Pipeline Design', desc: 'Architecture, orchestration, and monitoring' },
    ],
    description: 'Resolve tough data engineering challenges — from pipeline failures and performance bottlenecks to complex ETL orchestration on enterprise platforms.',
    whoFor: 'Data Engineers, Platform Engineers, Azure Architects',
  },
  {
    id: 'database-mgmt',
    title: 'Database Management',
    icon: Database,
    image: '/assets/job-support/database-mgmt.png',
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30',
    iconColor: 'text-emerald-400',
    items: [
      { name: 'SQL & Azure DBA', desc: 'Query optimization, HA/DR, and Azure SQL management' },
      { name: 'Oracle Database Admin', desc: 'RAC, Data Guard, performance tuning' },
      { name: 'PostgreSQL DBA', desc: 'Replication, partitioning, and vacuum tuning' },
      { name: 'Performance Tuning', desc: 'Execution plans, indexing, and query optimization' },
    ],
    description: 'Hands-on production DBA support for managing mission-critical databases, resolving outages, optimizing performance, and ensuring high availability.',
    whoFor: 'DBAs, Database Architects, SQL Developers, Cloud DBAs',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Book a Session', desc: 'Choose your technical domain and describe the challenge you\'re facing at work.' },
  { step: '02', title: 'Expert Review', desc: 'Our senior expert reviews your problem and prepares a targeted solution approach.' },
  { step: '03', title: 'Live Support', desc: 'Join a 1-on-1 live session to resolve the issue, debug code, or architect a solution.' },
  { step: '04', title: 'Documentation', desc: 'Receive a written summary and solution documentation after the session.' },
];

export default function JobSupport() {
  const [enrollModal, setEnrollModal] = useState<{ open: boolean; program: string }>({ open: false, program: '' });

  const openEnroll = (program: string) => setEnrollModal({ open: true, program });
  const closeEnroll = () => setEnrollModal({ open: false, program: '' });

  return (
    <div className="min-h-screen bg-bg-canvas text-white">
      {/* ─── HERO ─── */}
      <div className="relative overflow-hidden pt-28 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-full max-w-7xl bg-gradient-to-b from-brand-orange/10 via-amber-500/5 to-transparent blur-3xl" />

        <div className="relative mx-auto max-w-7xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-4 py-1.5 text-xs font-bold text-brand-orange mb-6">
            <Briefcase size={14} />
            <span>STRICTLY FOR WORKING PROFESSIONALS</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
            Technical Job Support
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-orange via-amber-400 to-orange-500 mt-2">
              For Working Professionals
            </span>
          </h1>

          <p className="text-base sm:text-lg text-text-muted max-w-3xl mx-auto leading-relaxed mb-8">
            Real expert help for the real technical challenges you face at work every day. Our specialists assist you
            resolve production issues, debug complex code, optimize databases, and architect robust solutions — so you can
            excel in your role.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => openEnroll('Technical Job Support')}
              className="flex items-center gap-2 rounded-xl bg-brand-orange px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-orange/25 hover:bg-orange-600 transition-all hover:scale-105"
            >
              <span>Get Technical Support</span>
              <ArrowRight size={16} />
            </button>
            <Link
              to="/connect-us"
              className="flex items-center gap-2 rounded-xl border border-white/[0.2] bg-white/[0.06] px-7 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/[0.1]"
            >
              <MessageSquare size={16} />
              <span>Talk to an Advisor</span>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {[
              { icon: Users, label: 'Working Professionals Only' },
              { icon: Clock, label: 'Same-Day Support Available' },
              { icon: Shield, label: 'NDA & Confidential' },
              { icon: CheckCircle, label: 'Production-Ready Solutions' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-2 text-center">
                  <Icon size={20} className="text-brand-orange" />
                  <span className="text-xs text-text-muted font-medium">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── SERVICES ─── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Our Support Services</h2>
            <p className="mt-2 text-text-muted max-w-2xl mx-auto">
              Expert technical assistance across three core domains — tailored to complex, real-world professional challenges.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {SERVICES.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.id}
                  className={`group rounded-3xl border bg-gradient-to-br ${service.color} p-0 overflow-hidden transition-all hover:scale-[1.01] hover:shadow-2xl flex flex-col`}
                >
                  {/* Image */}
                  <div className="relative w-full aspect-video overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-card/90 to-transparent pointer-events-none" />
                    <div className="absolute top-4 left-4 flex h-10 w-10 items-center justify-center rounded-xl bg-bg-card/80 border border-white/[0.1] backdrop-blur-sm">
                      <Icon size={20} className={service.iconColor} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{service.title}</h3>
                    <p className="text-sm text-text-muted mb-4 leading-relaxed">{service.description}</p>

                    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 mb-5">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1.5">Who This Is For</p>
                      <p className="text-xs text-white font-medium">{service.whoFor}</p>
                    </div>

                    <div className="space-y-2.5 mb-6">
                      {service.items.map((item) => (
                        <div key={item.name} className="flex items-start gap-2.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand-orange shrink-0 mt-1.5" />
                          <div>
                            <span className="text-xs font-bold text-white">{item.name}</span>
                            <span className="text-xs text-text-muted ml-1.5">— {item.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => openEnroll(`Technical Job Support — ${service.title}`)}
                      className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-brand-orange py-2.5 text-xs font-bold text-white transition-colors hover:bg-orange-600"
                    >
                      <span>Get Support for This</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="bg-bg-surface py-20 border-y border-white/[0.08] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">How It Works</h2>
            <p className="mt-2 text-text-muted">Simple, fast, and effective technical support process</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange text-xl font-black mb-4">
                  {step.step}
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(50%+28px)] right-0 h-px border-t border-dashed border-brand-orange/30" />
                )}
                <h3 className="text-sm font-bold text-white mb-1">{step.title}</h3>
                <p className="text-xs text-text-muted leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ─── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-4 py-1.5 text-xs font-bold text-brand-orange mb-6">
            <Sparkles size={14} />
            <span>PROFESSIONALS ONLY</span>
          </div>
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl mb-4">
            Facing a Tough Technical Challenge at Work?
          </h2>
          <p className="text-text-muted mb-8 leading-relaxed">
            Don't struggle alone. Our experienced mentors have seen it all — from production outages to complex AI integrations.
            Get targeted, expert help that lets you deliver results confidently.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => openEnroll('Technical Job Support')}
              className="flex items-center gap-2 rounded-xl bg-brand-orange px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-orange/25 hover:bg-orange-600 transition-all hover:scale-105"
            >
              <span>Request Technical Support</span>
              <ArrowRight size={16} />
            </button>
            <Link
              to="/connect-us"
              className="flex items-center gap-2 rounded-xl border border-white/[0.2] bg-white/[0.06] px-7 py-3.5 text-sm font-bold text-white hover:bg-white/[0.1] transition-all"
            >
              Contact Our Team
            </Link>
          </div>
        </div>
      </section>

      <EnrollmentModal
        isOpen={enrollModal.open}
        onClose={closeEnroll}
        programName={enrollModal.program}
      />
    </div>
  );
}
