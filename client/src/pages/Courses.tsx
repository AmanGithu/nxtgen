import { useState, useEffect } from 'react';
import { coursesAPI } from '../services/api';
import { Star, Clock, CheckCircle2, ArrowRight, X, User, Phone, Mail, BookOpen, Layers } from 'lucide-react';
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

  const handleEnrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnrollSubmitted(true);
    setTimeout(() => {
      setEnrollSubmitted(false);
      setSelectedCourseForEnroll(null);
      setEnrollForm({ batch: 'Batch 18 - Starts Aug 3, 2026', fullName: '', email: '', phone: '' });
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-bg-canvas py-12 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Explore <span className="text-brand-orange">AI & Database</span> Mastery
          </h1>
          <p className="mt-4 text-lg text-text-muted">
            Bridge the gap between traditional engineering and the generative future with specialized curricula designed for modern architects.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex justify-center border-b border-white/[0.08]">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('AI')}
              className={clsx(
                "pb-4 text-base font-semibold transition-colors relative",
                activeTab === 'AI' ? "text-brand-orange" : "text-text-muted hover:text-white"
              )}
            >
              Artificial Intelligence
              {activeTab === 'AI' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('DATABASE')}
              className={clsx(
                "pb-4 text-base font-semibold transition-colors relative",
                activeTab === 'DATABASE' ? "text-brand-orange" : "text-text-muted hover:text-white"
              )}
            >
              Database Administrator (DBA)
              {activeTab === 'DATABASE' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />
              )}
            </button>
          </div>
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl bg-bg-surface border border-white/[0.08]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2">
            {courses.map((course) => (
              <div
                key={course.id}
                className="group flex flex-col justify-between rounded-xl border border-white/[0.08] bg-bg-surface p-6 transition-all duration-200 hover:border-brand-orange/40 hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-medium text-brand-orange">
                      <Layers size={14} />
                      {course.category === 'AI' ? 'AI Track' : 'Database Track'}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock size={14} />
                      {course.duration || '8 Weeks'}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-2xl font-bold text-white group-hover:text-brand-orange transition-colors">
                    {course.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-muted line-clamp-2">
                    {course.shortDesc || course.description}
                  </p>

                  {/* Prerequisites preview */}
                  {course.prerequisites && (
                    <p className="mt-3 text-xs text-text-muted">
                      <strong className="text-white font-medium">Prerequisites:</strong> {course.prerequisites}
                    </p>
                  )}
                </div>

                {/* Dual CTAs */}
                <div className="mt-6 flex items-center gap-3 border-t border-white/[0.08] pt-4">
                  <button
                    onClick={() => setSelectedCourseForDrawer(course)}
                    className="flex-1 rounded-lg border border-white/20 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-white/[0.08]"
                  >
                    Explore Curriculum →
                  </button>
                  <button
                    onClick={() => setSelectedCourseForEnroll(course)}
                    className="flex-1 rounded-lg bg-brand-orange px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-orange/90"
                  >
                    Enroll Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ─── SLIDING CURRICULUM DRAWER (Explore CTA) ─── */}
      {selectedCourseForDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs">
          <div className="absolute inset-y-0 right-0 flex max-w-full pl-10">
            <div className="w-screen max-w-xl bg-bg-surface border-l border-white/[0.08] p-6 shadow-2xl overflow-y-auto">
              
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div>
                  <span className="text-xs font-semibold text-brand-orange uppercase tracking-wider">Curriculum Overview</span>
                  <h2 className="font-display text-2xl font-bold text-white">{selectedCourseForDrawer.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedCourseForDrawer(null)}
                  className="rounded-lg p-2 text-text-muted hover:bg-white/[0.08] hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-white">Description</h4>
                  <p className="mt-1 text-sm text-text-muted">{selectedCourseForDrawer.description}</p>
                </div>

                {selectedCourseForDrawer.careerOutcomes && (
                  <div>
                    <h4 className="text-sm font-semibold text-white">Career Outcomes</h4>
                    <p className="mt-1 text-sm text-text-muted">{selectedCourseForDrawer.careerOutcomes}</p>
                  </div>
                )}

                {/* Modules list */}
                <div>
                  <h4 className="mb-3 text-sm font-semibold text-white">Modules (1 – 6)</h4>
                  <div className="space-y-3">
                    {(selectedCourseForDrawer.modules || []).map((mod, idx) => (
                      <div key={idx} className="rounded-lg border border-white/[0.08] bg-bg-card p-4">
                        <div className="flex items-center justify-between">
                          <h5 className="font-semibold text-white text-sm">{mod.title}</h5>
                          <span className="text-xs text-brand-orange">{mod.duration}</span>
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

                <div className="pt-4 border-t border-white/[0.08]">
                  <button
                    onClick={() => {
                      const course = selectedCourseForDrawer;
                      setSelectedCourseForDrawer(null);
                      setSelectedCourseForEnroll(course);
                    }}
                    className="w-full rounded-lg bg-brand-orange py-3 text-center text-sm font-semibold text-white shadow-lg hover:bg-brand-orange/90"
                  >
                    Enroll in Next Batch →
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ─── ENROLLMENT POPUP MODAL (Enroll CTA) ─── */}
      {selectedCourseForEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-bg-surface p-6 shadow-2xl">
            
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <h3 className="font-display text-xl font-bold text-white">Course Enrollment</h3>
              <button
                onClick={() => setSelectedCourseForEnroll(null)}
                className="text-text-muted hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {enrollSubmitted ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-brand-orange" />
                <h4 className="mt-4 text-lg font-bold text-white">Enrollment Request Received!</h4>
                <p className="mt-2 text-sm text-text-muted">
                  Our academic counselor will reach out to confirm your slot for <strong className="text-white">{selectedCourseForEnroll.title}</strong>.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEnrollSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-text-muted">Selected Course</label>
                  <p className="text-sm font-bold text-brand-orange">{selectedCourseForEnroll.title}</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-text-muted">Select Preferred Batch</label>
                  <select
                    value={enrollForm.batch}
                    onChange={(e) => setEnrollForm({ ...enrollForm, batch: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2.5 text-sm text-white focus:border-brand-orange focus:outline-hidden"
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
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2.5 text-sm text-white focus:border-brand-orange focus:outline-hidden"
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
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2.5 text-sm text-white focus:border-brand-orange focus:outline-hidden"
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
                    className="mt-1 w-full rounded-lg border border-white/[0.08] bg-bg-card p-2.5 text-sm text-white focus:border-brand-orange focus:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full rounded-lg bg-brand-orange py-2.5 text-sm font-semibold text-white hover:bg-brand-orange/90"
                  >
                    Confirm Enrollment Slot
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default Courses;
