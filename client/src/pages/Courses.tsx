import { useState, useEffect } from 'react';
import { coursesAPI } from '../services/api';
import {
  Clock,
  CheckCircle2,
  X,
  Layers,
  Lightbulb,
  Users,
  Hammer,
  GraduationCap,
  Briefcase,
  UserCheck,
  Award,
  Bot,
  Handshake,
  Sparkles,
} from 'lucide-react';
import { clsx } from 'clsx';

interface Module {
  id: string;
  title: string;
  duration: string;
  topics: string[];
}

interface Course {
  id: string;
  title: string;
  slug: string;
  category: 'AI' | 'DATABASE';
  shortDesc: string | null;
  description: string;
  duration: string | null;
  prerequisites: string | null;
  careerOutcomes: string | null;
  modules: Module[] | null;
}

const WHY_CHOOSE_ITEMS = [
  {
    icon: Lightbulb,
    title: 'Scenario-Based Learning',
    description: 'Gain practical expertise through real-world projects and case studies.',
  },
  {
    icon: Users,
    title: 'Expert-Led Training',
    description: 'Learn from certified instructors with extensive industry experience.',
  },
  {
    icon: Hammer,
    title: '100% Hands-On Approach',
    description: 'Build real skills with practical, project-focused training.',
  },
  {
    icon: GraduationCap,
    title: 'Real-Time Capstone Projects',
    description: 'Work on industry-relevant projects to showcase your expertise.',
  },
  {
    icon: Briefcase,
    title: 'Professional Profile Building',
    description: 'Create a standout resume and LinkedIn profile with expert guidance.',
  },
  {
    icon: UserCheck,
    title: 'Interview Readiness',
    description: 'Get interview-ready with mock sessions and personalized feedback.',
  },
  {
    icon: Award,
    title: 'Global Recognized Certifications',
    description: 'Earn certifications that are valued worldwide.',
  },
  {
    icon: Bot,
    title: '24/7 AI Support',
    description: 'Get instant help and guidance anytime, anywhere.',
  },
  {
    icon: Handshake,
    title: 'Technical Job Support',
    description: 'Get job support with expert guidance and personalized feedback.',
  },
];

const Courses = () => {
  const [activeTab, setActiveTab] = useState<'AI' | 'DATABASE'>('AI');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Drawer state
  const [selectedCourseForDrawer, setSelectedCourseForDrawer] = useState<Course | null>(null);

  // Enroll Modal state
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState<Course | null>(null);
  const [enrollForm, setEnrollForm] = useState({
    batch: 'Batch 18 - Starts Aug 3, 2026',
    fullName: '',
    email: '',
    phone: '',
  });
  const [enrollSubmitted, setEnrollSubmitted] = useState(false);

  useEffect(() => {
    fetchCourses(activeTab);
  }, [activeTab]);

  const fetchCourses = async (category: 'AI' | 'DATABASE') => {
    setLoading(true);
    try {
      const res = await coursesAPI.getAll(category);
      if (res.data.success) {
        setCourses(res.data.courses);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollSubmitted(true);

    // Auto-log lead to Lead Manager
    try {
      await fetch('/api/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ctaType: 'COURSE',
          sourceCategory: selectedCourseForEnroll?.category || 'COURSE',
          fullName: enrollForm.fullName,
          email: enrollForm.email,
          phone: enrollForm.phone,
          metadata: {
            courseTitle: selectedCourseForEnroll?.title,
            batch: enrollForm.batch,
          },
        }),
      });
    } catch (err) {
      console.warn('Lead logging error:', err);
    }

    setTimeout(() => {
      setEnrollSubmitted(false);
      setSelectedCourseForEnroll(null);
      setEnrollForm({ batch: 'Batch 18 - Starts Aug 3, 2026', fullName: '', email: '', phone: '' });
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-bg-canvas py-8 text-strong">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
        {/* ─── 1. TOP SECTION ANIMATION: BRIDGING THE GAP ─── */}
        <div className="relative rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#14120c] via-black to-[#0d0d12] p-8 sm:p-12 overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.12)]">
          {/* Background glowing particles */}
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#D4AF37]/15 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-orange-500/15 blur-3xl" />

          <div className="relative z-10 text-center max-w-4xl mx-auto space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#D4AF37]/10 px-4 py-1.5 text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/25 tracking-widest uppercase">
              <Sparkles size={14} /> PAVY Academy Career Transformation
            </span>

            <h1 className="font-display text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              "We are bridging the gap between <span className="text-[#D4AF37]">You</span> and <span className="text-brand-orange">Success</span>."
            </h1>

            {/* Dynamic Animated Canvas / SVG Bridge Illustration */}
            <div className="relative my-8 h-40 sm:h-52 w-full max-w-2xl mx-auto flex items-center justify-between px-4 sm:px-12">
              {/* Left Cliff: You */}
              <div className="flex flex-col items-center gap-2 z-10">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-[#1f1d16] to-[#3a3422] border border-[#D4AF37]/40 flex items-center justify-center shadow-lg animate-bounce">
                  <span className="text-2xl sm:text-3xl font-black text-[#D4AF37]">YOU</span>
                </div>
                <span className="text-xs font-semibold text-text-muted">Aspiring Engineer</span>
              </div>

              {/* Animated Drawing Pencil & Glowing Bridge Line */}
              <div className="relative flex-1 mx-4 sm:mx-8 h-12 flex items-center justify-center">
                {/* Dashed background track */}
                <div className="absolute inset-x-0 h-1 border-b-2 border-dashed border-white/20" />

                {/* Animated glowing bridge beam */}
                <div className="absolute left-0 h-1.5 bg-gradient-to-r from-[#D4AF37] via-amber-400 to-brand-orange shadow-[0_0_15px_#D4AF37] animate-[pencilBridge_3s_ease-in-out_infinite]" />

                {/* Pencil SVG drawing tip */}
                <div className="absolute z-20 flex items-center gap-1 animate-[pencilMove_3s_ease-in-out_infinite]">
                  <div className="text-2xl transform -rotate-45 drop-shadow-[0_0_10px_#D4AF37]">✏️</div>
                  <span className="text-[10px] font-bold text-amber-300 bg-black/80 px-2 py-0.5 rounded-full border border-amber-400/40 backdrop-blur-md">
                    Bridging…
                  </span>
                </div>
              </div>

              {/* Right Cliff: Success */}
              <div className="flex flex-col items-center gap-2 z-10">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-brand-orange/30 to-amber-500/20 border border-brand-orange/50 flex items-center justify-center shadow-lg shadow-brand-orange/20">
                  <span className="text-2xl sm:text-3xl">🏆</span>
                </div>
                <span className="text-xs font-bold text-brand-orange">SUCCESS</span>
              </div>
            </div>

            <p className="text-sm sm:text-base text-text-muted max-w-2xl mx-auto leading-relaxed">
              Bridge the gap between traditional software development and modern Generative & Agentic AI architecture with PAVY Academy's industry-proven curriculum.
            </p>
          </div>
        </div>

        {/* ─── 2. WHY CHOOSE PAVY ACADEMY? (9 COLUMNS SECTION) ─── */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white">
              Why Choose <span className="text-[#D4AF37]">PAVY Academy</span>?
            </h2>
            <p className="mt-2 text-sm text-text-muted">
              Built for high-impact technical careers through 9 core pillars of excellence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHY_CHOOSE_ITEMS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="group flex items-start gap-4 rounded-2xl border border-white/[0.08] bg-bg-surface p-5 transition-all duration-300 hover:border-[#D4AF37]/50 hover:bg-white/[0.03] hover:scale-[1.02] shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20 group-hover:scale-110 transition-transform">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-[#D4AF37] transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-text-muted leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── 3. COURSE CATEGORY TABS ─── */}
        <div className="pt-4 space-y-6">
          <div className="flex justify-center border-b border-line">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('AI')}
                className={clsx(
                  'pb-4 text-base font-bold transition-colors relative',
                  activeTab === 'AI' ? 'text-[#D4AF37]' : 'text-text-muted hover:text-strong'
                )}
              >
                Artificial Intelligence & GenAI
                {activeTab === 'AI' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]" />}
              </button>
              <button
                onClick={() => setActiveTab('DATABASE')}
                className={clsx(
                  'pb-4 text-base font-bold transition-colors relative',
                  activeTab === 'DATABASE' ? 'text-[#D4AF37]' : 'text-text-muted hover:text-strong'
                )}
              >
                Database Administrator (DBA)
                {activeTab === 'DATABASE' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]" />}
              </button>
            </div>
          </div>

          {/* Course Grid */}
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-bg-surface border border-line" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="group flex flex-col justify-between rounded-2xl border border-line bg-bg-surface p-6 transition-all duration-200 hover:border-[#D4AF37]/40 hover:scale-[1.01] shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D4AF37]/10 px-3 py-1 text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/20">
                        <Layers size={14} />
                        {course.category === 'AI' ? 'AI & GenAI Track' : 'Database Track'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock size={14} />
                        {course.duration || '8 Weeks'}
                      </span>
                    </div>

                    <h3 className="mt-4 font-display text-2xl font-bold text-strong group-hover:text-[#D4AF37] transition-colors">
                      {course.title}
                    </h3>
                    <p className="mt-2 text-sm text-text-muted line-clamp-2 leading-relaxed">
                      {course.shortDesc || course.description}
                    </p>

                    {course.prerequisites && (
                      <p className="mt-3 text-xs text-text-muted">
                        <strong className="text-strong font-medium">Prerequisites:</strong> {course.prerequisites}
                      </p>
                    )}
                  </div>

                  {/* Dual CTAs */}
                  <div className="mt-6 flex items-center gap-3 border-t border-line pt-4">
                    <button
                      onClick={() => setSelectedCourseForDrawer(course)}
                      className="flex-1 rounded-xl border border-line-strong px-4 py-2.5 text-center text-xs font-bold text-strong transition-colors hover:bg-white/[0.06]"
                    >
                      Explore Curriculum →
                    </button>
                    <button
                      onClick={() => setSelectedCourseForEnroll(course)}
                      className="flex-1 rounded-xl bg-gradient-to-r from-[#D4AF37] to-brand-orange px-4 py-2.5 text-center text-xs font-black text-black transition-all hover:opacity-90 shadow-md"
                    >
                      Enroll Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── SLIDING CURRICULUM DRAWER ─── */}
      {selectedCourseForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm">
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-xl bg-bg-surface border-l border-line p-6 shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between border-b border-line pb-4">
                <div>
                  <span className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Curriculum Overview</span>
                  <h2 className="font-display text-2xl font-bold text-strong">{selectedCourseForDrawer.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedCourseForDrawer(null)}
                  className="rounded-lg p-2 text-text-muted hover:bg-white/[0.06] hover:text-strong"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-strong">Description</h4>
                  <p className="mt-1 text-sm text-text-muted">{selectedCourseForDrawer.description}</p>
                </div>

                {selectedCourseForDrawer.careerOutcomes && (
                  <div>
                    <h4 className="text-sm font-bold text-strong">Career Outcomes</h4>
                    <p className="mt-1 text-sm text-text-muted">{selectedCourseForDrawer.careerOutcomes}</p>
                  </div>
                )}

                <div>
                  <h4 className="mb-3 text-sm font-bold text-strong">Modules & Topics</h4>
                  <div className="space-y-3">
                    {(selectedCourseForDrawer.modules || []).map((mod, idx) => (
                      <div key={idx} className="rounded-xl border border-line bg-bg-card p-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-strong text-sm">{mod.title}</h5>
                          <span className="text-xs text-[#D4AF37] font-semibold">{mod.duration}</span>
                        </div>
                        <ul className="mt-2 space-y-1 pl-4 text-xs text-text-muted list-disc">
                          {mod.topics?.map((topic, tidx) => (
                            <li key={tidx}>{topic}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-line">
                  <button
                    onClick={() => {
                      const course = selectedCourseForDrawer;
                      setSelectedCourseForDrawer(null);
                      setSelectedCourseForEnroll(course);
                    }}
                    className="w-full rounded-xl bg-gradient-to-r from-[#D4AF37] to-brand-orange py-3 text-center text-sm font-black text-black shadow-lg"
                  >
                    Enroll in Next Cohort →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ENROLLMENT POPUP MODAL ─── */}
      {selectedCourseForEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-line bg-bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <h3 className="font-display text-xl font-bold text-strong">Course Enrollment</h3>
              <button onClick={() => setSelectedCourseForEnroll(null)} className="text-text-muted hover:text-strong">
                <X size={20} />
              </button>
            </div>

            {enrollSubmitted ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-[#D4AF37]" />
                <h4 className="mt-4 text-lg font-bold text-strong">Enrollment Request Received!</h4>
                <p className="mt-2 text-sm text-text-muted">
                  Our academic advisor will reach out to confirm your slot for{' '}
                  <strong className="text-strong">{selectedCourseForEnroll.title}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEnrollSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted">Selected Course</label>
                  <p className="text-sm font-bold text-[#D4AF37]">{selectedCourseForEnroll.title}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Select Preferred Batch</label>
                  <select
                    value={enrollForm.batch}
                    onChange={(e) => setEnrollForm({ ...enrollForm, batch: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-bg-card p-2.5 text-sm text-strong focus:border-[#D4AF37] focus:outline-none"
                  >
                    <option value="Batch 18 - Starts Aug 3, 2026">Batch 18 — Starts Aug 3, 2026 (Mon/Wed/Fri)</option>
                    <option value="Batch 19 - Starts Sep 1, 2026">Batch 19 — Starts Sep 1, 2026 (Sat/Sun Weekend)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={enrollForm.fullName}
                    onChange={(e) => setEnrollForm({ ...enrollForm, fullName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-bg-card p-2.5 text-sm text-strong focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="john@example.com"
                    value={enrollForm.email}
                    onChange={(e) => setEnrollForm({ ...enrollForm, email: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-bg-card p-2.5 text-sm text-strong focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={enrollForm.phone}
                    onChange={(e) => setEnrollForm({ ...enrollForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-bg-card p-2.5 text-sm text-strong focus:border-[#D4AF37] focus:outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-[#D4AF37] to-brand-orange py-2.5 text-sm font-black text-black hover:opacity-90"
                  >
                    Confirm Enrollment Slot
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Keyframe animations for bridge pencil */}
      <style>{`
        @keyframes pencilBridge {
          0%   { width: 0%; }
          70%  { width: 100%; }
          100% { width: 100%; }
        }
        @keyframes pencilMove {
          0%   { left: 0%; }
          70%  { left: 100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Courses;
