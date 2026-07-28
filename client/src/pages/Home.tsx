import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, CheckCircle, ChevronRight, Play, FileText } from 'lucide-react';
import { clsx } from 'clsx';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-play hero carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
              
              <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                <span className="text-brand-orange">NxtGen</span>
                <span className="text-white ml-2">Academy</span>
              </h1>
              
              <p className="text-xl text-text-muted">
                Where Careers Are Born, Not Found. Master AI, development, and engineering with industry-leading experts.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <Link to="/courses" className="rounded-lg bg-brand-orange px-6 py-3 font-medium text-white transition-all hover:scale-105 hover:bg-orange-600 shadow-lg shadow-brand-orange/20">
                  Explore Courses
                </Link>
                <Link to="/corporate" className="rounded-lg border border-white/[0.15] bg-white/[0.05] px-6 py-3 font-medium text-white transition-all hover:bg-white/[0.1] backdrop-blur-sm">
                  Corporate Training
                </Link>
              </div>
            </div>
            
            <div className="relative h-full min-h-[400px] rounded-2xl border border-white/[0.08] bg-bg-card p-2 shadow-2xl animate-slide-in-right">
              {/* Placeholder for Hero Graphic */}
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gradient-to-br from-bg-surface to-bg-canvas overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5Y2EzYWYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djIwaC0ydi0yMGgtdjMyaC0ydjI0aDJ2MjRoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30 mix-blend-overlay"></div>
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-brand-orange/20 text-brand-orange backdrop-blur-md border border-brand-orange/30 shadow-xl shadow-brand-orange/20">
                  <Play size={40} className="ml-2" />
                </div>
              </div>
              
              {/* Carousel Indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={clsx(
                      "h-1.5 rounded-full transition-all duration-300",
                      currentSlide === i ? "w-8 bg-brand-orange" : "w-2 bg-white/30"
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
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Master the Technologies of Tomorrow</h2>
            <p className="mt-2 text-text-muted">Industry-relevant curriculum designed by experts.</p>
          </div>
          <Link to="/courses" className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-orange hover:underline">
            View All Courses <ChevronRight size={16} />
          </Link>
        </div>
        
        <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbar">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="group relative min-w-[300px] max-w-[320px] flex-none snap-start rounded-xl border border-white/[0.08] bg-bg-card p-4 transition-all duration-300 hover:scale-[1.02] hover:border-white/[0.2] hover:shadow-xl">
              <div className="mb-4 aspect-video w-full rounded-lg bg-bg-surface flex items-center justify-center border border-white/[0.04]">
                <span className="text-text-muted/50 font-mono text-sm">Course Preview</span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex text-brand-orange"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
                <span className="text-xs text-text-muted">(4.9/5)</span>
              </div>
              <h3 className="mb-2 font-bold text-lg text-white">Full Stack AI Developer</h3>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="rounded bg-white/[0.05] px-2 py-1 text-xs text-text-muted">React</span>
                <span className="rounded bg-white/[0.05] px-2 py-1 text-xs text-text-muted">Node.js</span>
                <span className="rounded bg-white/[0.05] px-2 py-1 text-xs text-text-muted">OpenAI</span>
              </div>
              <div className="flex gap-3 mt-auto">
                <button className="flex-1 rounded-lg border border-white/[0.1] py-2 text-sm font-medium transition-colors hover:bg-white/[0.05]">Explore</button>
                <button className="flex-1 rounded-lg bg-brand-orange py-2 text-sm font-medium text-white transition-colors hover:bg-orange-600">Enroll Now</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">200+ Industry-Recognized Certifications</h2>
          <p className="mt-2 text-text-muted">Validate your skills and stand out to employers.</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3 rounded-xl border border-white/[0.08] bg-bg-card p-6 text-center transition-all hover:scale-105 hover:border-brand-orange/30">
              <div className="h-12 w-12 rounded-full bg-brand-orange/10 flex items-center justify-center text-brand-orange">
                <CheckCircle size={24} />
              </div>
              <h4 className="text-sm font-medium text-white">AWS Cloud Practitioner</h4>
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
      <section className="bg-bg-surface py-20 border-y border-white/[0.08]">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Launch Your AI Career — Real-World Internships That Matter</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-white/[0.08] bg-bg-card p-8 transition-transform hover:-translate-y-1">
              <h3 className="mb-4 text-2xl font-bold text-white">Generative AI Internship</h3>
              <ul className="mb-8 space-y-3">
                <li className="flex items-start gap-3 text-text-muted">
                  <CheckCircle size={20} className="text-brand-orange shrink-0 mt-0.5" />
                  <span>Build an AI Call Center with LiveKit</span>
                </li>
                <li className="flex items-start gap-3 text-text-muted">
                  <CheckCircle size={20} className="text-brand-orange shrink-0 mt-0.5" />
                  <span>Master RAG and Vector Databases</span>
                </li>
              </ul>
              <button className="w-full rounded-lg bg-white/[0.05] py-3 font-medium text-white border border-white/[0.1] hover:bg-white/[0.1] transition-colors">Apply Now</button>
            </div>
            
            <div className="rounded-2xl border border-brand-orange/20 bg-bg-card p-8 relative overflow-hidden transition-transform hover:-translate-y-1">
              <div className="absolute top-0 right-0 bg-brand-orange px-4 py-1 rounded-bl-lg text-xs font-bold text-white">MOST POPULAR</div>
              <h3 className="mb-4 text-2xl font-bold text-white">Agentic AI Internship</h3>
              <ul className="mb-8 space-y-3">
                <li className="flex items-start gap-3 text-text-muted">
                  <CheckCircle size={20} className="text-brand-orange shrink-0 mt-0.5" />
                  <span>Make Your Own AI Receptionist with ElevenLabs</span>
                </li>
                <li className="flex items-start gap-3 text-text-muted">
                  <CheckCircle size={20} className="text-brand-orange shrink-0 mt-0.5" />
                  <span>Deploy autonomous agents for real businesses</span>
                </li>
              </ul>
              <button className="w-full rounded-lg bg-brand-orange py-3 font-medium text-white hover:bg-orange-600 transition-colors shadow-lg shadow-brand-orange/20">Apply Now</button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Tools Section */}
      <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 mb-12">
        <div className="mb-10 text-center">
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">AI-Powered Career Toolkit — From Resume to Job Offer</h2>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-6 hide-scrollbar snap-x">
          {['Resume Builder', 'Cover Letter AI', 'Interview Prep', 'Portfolio Maker', 'LinkedIn Optimizer', 'Salary Estimator', 'Job Tracker', 'Skill Analyzer'].map((tool, i) => (
            <div key={i} className="min-w-[200px] flex-none snap-start rounded-xl border border-white/[0.08] bg-bg-card p-5 transition-all hover:bg-white/[0.05] cursor-pointer">
              <div className="mb-4 h-10 w-10 rounded bg-white/[0.05] flex items-center justify-center text-text-muted">
                <FileText size={20} />
              </div>
              <h4 className="font-medium text-white">{tool}</h4>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
