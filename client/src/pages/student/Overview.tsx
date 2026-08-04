import { useState, useEffect } from 'react';
import { BookOpen, Video, Lock, Layers, Award, Sparkles } from 'lucide-react';
import api from '../../services/api';

const StudentOverview = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const res = await api.get('/student/overview');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch student overview:', err);
    } finally {
      setLoading(false);
    }
  };

  const moduleBars = [
    { title: 'LLMs & Transformer Architectures', progress: 85 },
    { title: 'Vector Databases & RAG Pipelines', progress: 72 },
    { title: 'Multi-Agent Systems (LangGraph & CrewAI)', progress: 45 },
  ];

  return (
    <div className="space-y-8 p-6 text-strong">
      <div>
        <h1 className="font-display text-3xl font-bold">Student Learning Portal</h1>
        <p className="text-sm text-text-muted mt-1">Track cohort progress, upcoming live Zoom classes, and access protected study materials.</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        
        {/* Course Progress Donut Chart & Module Bars */}
        <div className="lg:col-span-2 space-y-6 rounded-xl border border-line bg-bg-surface p-6">
          <h3 className="font-display text-lg font-bold">Generative AI Masterclass — Progress</h3>

          <div className="flex flex-col sm:flex-row items-center gap-8 border-b border-line pb-6">
            {/* Donut Chart Visual */}
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-brand-orange border-t-white/10 shadow-lg">
              <div className="text-center">
                <span className="font-display text-3xl font-bold text-brand-orange">68%</span>
                <p className="text-[10px] uppercase text-text-muted">Completed</p>
              </div>
            </div>

            <div className="space-y-3 flex-1 w-full">
              {moduleBars.map((mod, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-strong">{mod.title}</span>
                    <span className="text-brand-orange">{mod.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-bg-card overflow-hidden">
                    <div
                      className="h-full bg-brand-orange transition-all duration-500"
                      style={{ width: `${mod.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Class */}
          <div className="flex items-center justify-between rounded-lg border border-brand-orange/30 bg-brand-orange/10 p-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-brand-orange uppercase">Next Live Class</span>
              <h4 className="font-semibold text-strong text-sm">Module 3: Multi-Agent Orchestration with LangGraph</h4>
              <p className="text-xs text-text-muted">Tomorrow, 7:00 PM IST (Live Zoom Session)</p>
            </div>

            <button
              onClick={() => window.open('https://zoom.us', '_blank')}
              className="rounded-lg bg-brand-orange px-4 py-2 text-xs font-semibold text-on-brand hover:bg-brand-orange/90 shadow-md shrink-0"
            >
              Join Class (Zoom) →
            </button>
          </div>

        </div>

        {/* Subscription & Credits Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-line bg-bg-surface p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase text-text-muted">Active Plan</span>
              <span className="rounded bg-brand-orange/20 px-2.5 py-0.5 text-xs font-bold text-brand-orange">
                {data?.subscription?.plan || 'PRO PLAN'}
              </span>
            </div>

            <div className="border-t border-line pt-3 text-xs text-text-muted space-y-2">
              <div className="flex justify-between">
                <span>AI Credits Available:</span>
                <span className="font-bold text-strong">85 / 100</span>
              </div>
              <div className="flex justify-between">
                <span>Access End Date:</span>
                <span className="font-bold text-strong">Dec 31, 2026</span>
              </div>
            </div>

            <a
              href="/dashboard/student/unlock"
              className="block w-full rounded-lg border border-brand-orange/40 bg-brand-orange/10 py-2.5 text-center text-xs font-semibold text-brand-orange hover:bg-brand-orange hover:text-on-brand transition-colors"
            >
              Unlock All Tools & Package Upgrades →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StudentOverview;
