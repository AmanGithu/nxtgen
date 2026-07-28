import { useState, useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, Play, Pause, Award, Clock, Sparkles, RefreshCw } from 'lucide-react';

const LiveInterviewStage = () => {
  const [activeTab, setActiveTab] = useState<'voice' | 'avatar'>('voice');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(900); // 15:00 min countdown
  const [showReport, setShowReport] = useState(false);

  // Timer countdown hook
  useEffect(() => {
    let interval: any;
    if (isSessionActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setIsSessionActive(false);
      setShowReport(true);
    }
    return () => clearInterval(interval);
  }, [isSessionActive, timerSeconds]);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainderSec = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSec.toString().padStart(2, '0')}`;
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
    setShowReport(true);
  };

  return (
    <div className="p-6 text-white max-w-7xl mx-auto space-y-6">
      
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Sparkles className="text-brand-orange" size={24} />
            Live AI Interview Stage
          </h1>
          <p className="text-xs text-text-muted">Simulate real-time technical interview rounds with AI voice or 3D digital avatars.</p>
        </div>

        {/* Tab Mode Switcher */}
        <div className="flex rounded-lg border border-white/[0.08] bg-bg-surface p-1">
          <button
            onClick={() => { setActiveTab('voice'); setShowReport(false); }}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'voice' ? 'bg-brand-orange text-white' : 'text-text-muted hover:text-white'
            }`}
          >
            Voice-Only Mode (Gemini 2.0)
          </button>
          <button
            onClick={() => { setActiveTab('avatar'); setShowReport(false); }}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'avatar' ? 'bg-brand-orange text-white' : 'text-text-muted hover:text-white'
            }`}
          >
            LiveKit 3D Avatar Stage
          </button>
        </div>
      </div>

      {/* Control Bar: Timer & Session Start */}
      <div className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-bg-surface p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-bold text-brand-orange">
            <Clock size={18} />
            <span>Time Remaining: {formatTimer(timerSeconds)}</span>
          </div>

          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            isSessionActive ? 'bg-green-500/20 text-green-400' : 'bg-text-muted/20 text-text-muted'
          }`}>
            <span className={`h-2 w-2 rounded-full ${isSessionActive ? 'bg-green-400 animate-ping' : 'bg-text-muted'}`} />
            {isSessionActive ? 'Interview Session Live' : 'Session Ready'}
          </span>
        </div>

        <div>
          {!isSessionActive ? (
            <button
              onClick={() => { setIsSessionActive(true); setShowReport(false); }}
              className="rounded-lg bg-brand-orange px-6 py-2.5 text-xs font-bold text-white hover:bg-brand-orange/90 shadow-md"
            >
              Start Live Interview Session →
            </button>
          ) : (
            <button
              onClick={handleEndSession}
              className="rounded-lg bg-red-500 px-6 py-2.5 text-xs font-bold text-white hover:bg-red-600 shadow-md"
            >
              End Interview & View Score Report
            </button>
          )}
        </div>
      </div>

      {/* ─── TAB A: VOICE-ONLY MODE ─── */}
      {activeTab === 'voice' && !showReport && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Audio Waveform Canvas */}
          <div className="lg:col-span-2 flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-bg-surface p-10 min-h-[400px] space-y-6">
            <div className="relative flex h-40 w-40 items-center justify-center rounded-full bg-brand-orange/10 border-4 border-brand-orange/40 shadow-2xl">
              <div className="h-24 w-24 rounded-full bg-brand-orange flex items-center justify-center text-white animate-pulse">
                <Mic size={40} />
              </div>
            </div>

            {/* Audio Waveform Animation Bar */}
            <div className="flex items-center gap-1.5 h-12">
              {[40, 75, 30, 90, 60, 100, 45, 80, 55, 95, 35, 70].map((h, i) => (
                <div
                  key={i}
                  style={{ height: isSessionActive ? `${h}%` : '20%' }}
                  className="w-1.5 rounded-full bg-brand-orange transition-all duration-300"
                />
              ))}
            </div>

            <p className="text-sm font-semibold text-text-muted">
              {isSessionActive ? 'Gemini 2.0 Live Voice Stream: "Tell me about a time you optimized slow queries under heavy write load."' : 'Click "Start Session" to connect voice stream.'}
            </p>
          </div>

          {/* Right Notes Pane */}
          <div className="rounded-xl border border-white/[0.08] bg-bg-surface p-6 space-y-4">
            <h3 className="font-display text-base font-bold">Session Notes & Feedback</h3>
            <textarea
              rows={12}
              placeholder="Take notes during your interview..."
              className="w-full rounded-lg border border-white/[0.08] bg-bg-card p-3 text-xs text-white focus:border-brand-orange"
            />
          </div>

        </div>
      )}

      {/* ─── TAB B: WEBRTC 3D AVATAR STAGE ─── */}
      {activeTab === 'avatar' && !showReport && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Avatar Screen (2 Cols) */}
          <div className="lg:col-span-2 relative flex flex-col justify-between rounded-xl border border-white/[0.08] bg-black min-h-[450px] p-6 overflow-hidden">
            
            {/* Top Question Banner */}
            <div className="z-10 rounded-lg bg-bg-surface/80 backdrop-blur-md p-4 border border-white/[0.08]">
              <span className="text-[10px] font-bold text-brand-orange uppercase">Question 1 of 5</span>
              <p className="text-sm font-semibold text-white mt-1">
                "Can you walk me through how you architect high-throughput RAG retrieval systems with Pinecone and Cohere reranking?"
              </p>
            </div>

            {/* Avatar Video Mock */}
            <div className="absolute inset-0 flex items-center justify-center opacity-40">
              <div className="text-center space-y-2">
                <Video size={64} className="mx-auto text-brand-orange" />
                <p className="text-xs text-text-muted">LiveKit Avatar WebRTC Video Stream Active</p>
              </div>
            </div>

            {/* Candidate PIP Webcam Preview Bottom Right */}
            <div className="z-10 self-end h-28 w-44 rounded-lg border-2 border-brand-orange bg-bg-surface p-2 shadow-2xl flex flex-col justify-between">
              <span className="text-[9px] font-bold text-white">Your Webcam</span>
              <div className="flex justify-end gap-1">
                <Mic size={12} className="text-green-400" />
                <Video size={12} className="text-green-400" />
              </div>
            </div>

          </div>

          {/* Right Question Checklist Pane */}
          <div className="rounded-xl border border-white/[0.08] bg-bg-surface p-6 space-y-4">
            <h3 className="font-display text-base font-bold">Interview Stages</h3>
            <div className="space-y-3 text-xs">
              <div className="rounded-lg bg-brand-orange/10 border border-brand-orange/40 p-3 font-semibold text-brand-orange">
                1. System Architecture & RAG Pipelines (Active)
              </div>
              <div className="rounded-lg bg-bg-card border border-white/[0.05] p-3 text-text-muted">
                2. Distributed Lock Handling & Deadlocks
              </div>
              <div className="rounded-lg bg-bg-card border border-white/[0.05] p-3 text-text-muted">
                3. Model Fine-Tuning (LoRA/QLoRA)
              </div>
              <div className="rounded-lg bg-bg-card border border-white/[0.05] p-3 text-text-muted">
                4. STAR Behavioral Scenario
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ─── POST-INTERVIEW EVALUATION REPORT CARD ─── */}
      {showReport && (
        <div className="rounded-xl border-2 border-brand-orange bg-bg-surface p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div>
              <span className="text-xs font-bold text-brand-orange uppercase">Post-Interview Performance Scorecard</span>
              <h2 className="font-display text-3xl font-bold text-white">Overall Score: 92/100</h2>
            </div>
            <Award size={48} className="text-brand-orange" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="rounded-lg bg-bg-card p-4 border border-white/[0.08] space-y-1">
              <span className="text-text-muted uppercase">Technical Clarity</span>
              <p className="font-display text-2xl font-bold text-green-400">95%</p>
            </div>
            <div className="rounded-lg bg-bg-card p-4 border border-white/[0.08] space-y-1">
              <span className="text-text-muted uppercase">STAR Answer Structure</span>
              <p className="font-display text-2xl font-bold text-brand-orange">88%</p>
            </div>
            <div className="rounded-lg bg-bg-card p-4 border border-white/[0.08] space-y-1">
              <span className="text-text-muted uppercase">Confidence & Pace</span>
              <p className="font-display text-2xl font-bold text-green-400">93%</p>
            </div>
          </div>

          <div className="rounded-lg bg-bg-card p-4 border border-white/[0.08] text-xs space-y-2">
            <h4 className="font-semibold text-white">Key Recruiter Feedback</h4>
            <p className="text-text-muted leading-relaxed">
              Exceptional depth in explaining RAG pipelines and vector database optimization. Strong STAR format answers with specific metrics. Recommend elaborating slightly more on fault tolerance.
            </p>
          </div>

          <button
            onClick={() => { setShowReport(false); setTimerSeconds(900); }}
            className="flex items-center gap-2 rounded-lg bg-brand-orange px-6 py-2.5 text-xs font-bold text-white hover:bg-brand-orange/90"
          >
            <RefreshCw size={14} /> Start New Practice Session
          </button>
        </div>
      )}

    </div>
  );
};

export default LiveInterviewStage;
