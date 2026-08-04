import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, CheckCircle, ChevronRight, Play, Clock, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { coursesAPI, certificationsAPI, internshipsAPI, siteAPI } from '../services/api';
import { CAREER_TOOLS } from '../lib/tools';

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  ctaText: string | null;
  ctaLink: string | null;
}

interface Course {
  id: string;
  title: string;
  slug: string;
  category: 'AI' | 'DATABASE';
  shortDesc: string | null;
  description: string;
  duration: string | null;
}

interface Certification {
  id: string;
  name: string;
  provider: string;
}

interface ProjectHighlight {
  title: string;
  description: string;
}

interface Internship {
  id: string;
  title: string;
  programType: 'GENERATIVE_AI' | 'AGENTIC_AI';
  duration: string | null;
  projectHighlights: ProjectHighlight[] | null;
}

const HOME_COURSE_COUNT = 4;
const HOME_CERTIFICATION_COUNT = 6;

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const [courses, setCourses] = useState<Course[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [banners, setBanners] = useState<Banner[]>([]);

  // Auto-play hero carousel
  const slideCount = Math.max(banners.length, 1);
  useEffect(() => {
    if (slideCount < 2) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideCount);
    }, 5000);
    return () => clearInterval(timer);
  }, [slideCount]);

  /* Hero slides are admin-managed via /dashboard/admin/banners. With none
     configured the built-in hero copy below is used unchanged. */
  useEffect(() => {
    siteAPI
      .getBanners()
      .then((res) => setBanners(res.data?.banners ?? []))
      .catch((err) => console.error('Failed to load hero banners:', err));
  }, []);

  // One pass for all three showcase sections so the page settles together
  // rather than popping in section by section.
  useEffect(() => {
    const fetchShowcase = async () => {
      setLoading(true);
      const [coursesRes, certificationsRes, internshipsRes] = await Promise.allSettled([
        coursesAPI.getAll(),
        certificationsAPI.getAll({ limit: HOME_CERTIFICATION_COUNT }),
        internshipsAPI.getAll(),
      ]);

      if (coursesRes.status === 'fulfilled' && coursesRes.value.data.success) {
        setCourses(coursesRes.value.data.courses.slice(0, HOME_COURSE_COUNT));
      } else if (coursesRes.status === 'rejected') {
        console.error('Failed to fetch courses:', coursesRes.reason);
      }

      if (certificationsRes.status === 'fulfilled' && certificationsRes.value.data.success) {
        setCertifications(certificationsRes.value.data.certifications);
      } else if (certificationsRes.status === 'rejected') {
        console.error('Failed to fetch certifications:', certificationsRes.reason);
      }

      if (internshipsRes.status === 'fulfilled' && internshipsRes.value.data.success) {
        setInternships(internshipsRes.value.data.internships);
      } else if (internshipsRes.status === 'rejected') {
        console.error('Failed to fetch internships:', internshipsRes.reason);
      }

      setLoading(false);
    };

    fetchShowcase();
  }, []);

  const activeBanner = banners[currentSlide] ?? null;

  return (
    <div className="flex flex-col gap-24 pb-24">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 lg:pt-24">
        {/* Gradient overlays */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 -ml-[39rem] w-[152.5rem] max-w-none transform-gpu opacity-50 blur-3xl sm:ml-[-50rem]">
          <div className="aspect-[1097/845] w-[68.5625rem] bg-gradient-to-tr from-[#f5820b] to-[#111118] opacity-20"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 items-center min-h-[60vh]">
            <div className="flex flex-col gap-6 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-orange/30 bg-brand-orange/10 px-3 py-1 text-sm font-medium text-brand-orange w-fit">
                <Star size={16} />
                STAR OF THE MENU
              </div>

              {activeBanner ? (
                <>
                  <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-strong">
                    {activeBanner.title}
                  </h1>
                  {activeBanner.subtitle && (
                    <p className="text-xl text-text-muted">{activeBanner.subtitle}</p>
                  )}
                </>
              ) : (
                <>
                  <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                    <span className="text-brand-orange">NxtGen</span>
                    <span className="text-strong ml-2">Academy</span>
                  </h1>

                  <p className="text-xl text-text-muted">
                    Where Careers Are Born, Not Found. Master AI, development, and engineering with industry-leading experts.
                  </p>
                </>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-4">
                <Link
                  to={activeBanner?.ctaLink || '/courses'}
                  className="rounded-lg bg-brand-orange px-6 py-3 font-medium text-on-brand transition-all hover:scale-105 hover:bg-orange-600 shadow-lg shadow-brand-orange/20"
                >
                  {activeBanner?.ctaText || 'Explore Courses'}
                </Link>
                <Link to="/corporate" className="rounded-lg border border-line-strong bg-elevate px-6 py-3 font-medium text-strong transition-all hover:bg-elevate backdrop-blur-sm">
                  Corporate Training
                </Link>
              </div>
            </div>

            <div className="relative h-full min-h-[400px] rounded-2xl border border-line bg-bg-card p-2 shadow-2xl animate-slide-in-right">
              {/* Placeholder for Hero Graphic */}
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-bg-surface to-bg-canvas overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Y2EzYWYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djIwaC0ydi0yMGgtdjMyaC0ydjI0aDJ2MjRoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30 mix-blend-overlay"></div>
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-brand-orange/20 text-brand-orange backdrop-blur-md border border-brand-orange/30 shadow-xl shadow-brand-orange/20">
                  <Play size={40} className="ml-2" />
                </div>
              </div>

              {/* Carousel Indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                {Array.from({ length: slideCount }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={clsx(
                      "h-1.5 rounded-full transition-all duration-300",
                      currentSlide === i ? "w-8 bg-brand-orange" : "w-2 bg-elevate"
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-strong sm:text-4xl">Master the Technologies of Tomorrow</h2>
            <p className="mt-2 text-text-muted">Industry-relevant curriculum designed by experts.</p>
          </div>
          <Link to="/courses" className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-orange hover:underline">
            View All Courses <ChevronRight size={16} />
          </Link>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar">
          {loading
            ? [1, 2, 3, 4].map((i) => (
                <div key={i} className="h-72 min-w-[300px] max-w-[320px] flex-none animate-pulse rounded-xl border border-line bg-bg-surface" />
              ))
            : courses.map((course) => (
                <div key={course.id} className="group relative flex min-w-[300px] max-w-[320px] flex-none flex-col justify-between snap-start rounded-xl border border-line bg-bg-card p-4 transition-all duration-300 hover:scale-[1.02] hover:border-line-strong hover:shadow-xl">
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-medium text-brand-orange">
                        <Layers size={14} />
                        {course.category === 'AI' ? 'AI Track' : 'Database Track'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-text-muted">
                        <Clock size={14} />
                        {course.duration || '8 Weeks'}
                      </span>
                    </div>
                    <h3 className="mb-2 font-bold text-lg text-strong">{course.title}</h3>
                    <p className="mb-4 text-sm text-text-muted line-clamp-3">
                      {course.shortDesc || course.description}
                    </p>
                  </div>
                  <Link
                    to="/courses"
                    className="mt-auto block rounded-lg bg-brand-orange py-2 text-center text-sm font-medium text-on-brand transition-colors hover:bg-orange-600"
                  >
                    Explore Curriculum
                  </Link>
                </div>
              ))}
        </div>
      </section>

      {/* Certifications Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-strong sm:text-4xl">200+ Industry-Recognized Certifications</h2>
          <p className="mt-2 text-text-muted">Validate your skills and stand out to employers.</p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {loading
            ? [1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 animate-pulse rounded-xl border border-line bg-bg-surface" />
              ))
            : certifications.map((certification) => (
                <div key={certification.id} className="flex flex-col items-center gap-3 rounded-xl border border-line bg-bg-card p-6 text-center transition-all hover:scale-105 hover:border-brand-orange/30">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                    <CheckCircle size={24} />
                  </div>
                  <h4 className="text-sm font-medium text-strong line-clamp-3">{certification.name}</h4>
                  <p className="text-xs text-text-muted">{certification.provider}</p>
                </div>
              ))}
        </div>
        <div className="mt-8 text-center">
          <Link to="/certifications" className="inline-flex items-center gap-2 text-brand-orange font-medium hover:underline">
            Explore All Certifications <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Internships Section */}
      <section className="bg-bg-surface py-20 border-y border-line">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-strong sm:text-4xl">Launch Your AI Career — Real-World Internships That Matter</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {loading
              ? [1, 2].map((i) => (
                  <div key={i} className="h-80 animate-pulse rounded-2xl border border-line bg-bg-card" />
                ))
              : internships.map((internship) => {
                  const isAgentic = internship.programType === 'AGENTIC_AI';
                  return (
                    <div
                      key={internship.id}
                      className={clsx(
                        "relative flex flex-col overflow-hidden rounded-2xl border bg-bg-card p-8 transition-transform hover:-translate-y-1",
                        isAgentic ? "border-brand-orange/20" : "border-line"
                      )}
                    >
                      {isAgentic && (
                        <div className="absolute top-0 right-0 bg-brand-orange px-4 py-1 rounded-bl-lg text-xs font-bold text-on-brand">MOST POPULAR</div>
                      )}
                      <h3 className="mb-2 text-2xl font-bold text-strong">{internship.title}</h3>
                      {internship.duration && (
                        <p className="mb-4 flex items-center gap-1.5 text-sm text-text-muted">
                          <Clock size={14} />
                          {internship.duration}
                        </p>
                      )}
                      <ul className="mb-8 space-y-3">
                        {(internship.projectHighlights ?? []).slice(0, 3).map((project) => (
                          <li key={project.title} className="flex items-start gap-3 text-text-muted">
                            <CheckCircle size={20} className="text-brand-orange shrink-0 mt-0.5" />
                            <span>{project.title}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        to="/internship"
                        className={clsx(
                          "mt-auto block rounded-lg py-3 text-center font-medium text-strong transition-colors",
                          isAgentic
                            ? "bg-brand-orange hover:bg-orange-600 shadow-lg shadow-brand-orange/20"
                            : "bg-elevate border border-line hover:bg-elevate"
                        )}
                      >
                        Apply Now
                      </Link>
                    </div>
                  );
                })}
          </div>
        </div>
      </section>

      {/* Tools Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-strong sm:text-4xl">AI-Powered Career Toolkit — From Resume to Job Offer</h2>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar snap-x">
          {CAREER_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.name}
                to={tool.path}
                className="min-w-[220px] flex-none snap-start rounded-xl border border-line bg-bg-card p-5 transition-all hover:border-brand-orange/30 hover:bg-elevate"
              >
                <div className="mb-4 h-10 w-10 rounded bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                  <Icon size={20} />
                </div>
                <h4 className="font-medium text-strong">{tool.name}</h4>
                <p className="mt-1 text-xs text-text-muted leading-tight">{tool.desc}</p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Home;
