import { useState, useEffect } from 'react';
import { Cpu, Save, Mic, Activity, Users, Clock, MessageSquare, Zap } from 'lucide-react';
import api from '../../services/api';

interface IAssistStats {
  totalSessions: number;
  completedSessions: number;
  totalAssistants: number;
  totalDocuments: number;
  activeUsers: number;
  totalQuestions: number;
  totalTokens: number;
  totalDurationSeconds: number;
  avgDurationSeconds: number;
  avgQuestions: number;
}

const AIConfig = () => {
  const [geminiConfig, setGeminiConfig] = useState({
    GEMINI_PRIMARY_MODEL: 'gemini-1.5-flash',
    GEMINI_FALLBACK_MODEL: 'gemini-1.5-pro',
    GEMINI_VOICE_MODEL: 'gemini-2.0-flash-exp',
  });

  const [iassistConfig, setIassistConfig] = useState({
    IASSIST_TRANSCRIPTION_MODEL: 'gemini-2.0-flash',
    IASSIST_QUERY_MODEL: 'gemini-2.5-flash',
    IASSIST_MAX_HISTORY: '40',
    IASSIST_MAX_TOKENS: '8192',
    IASSIST_VAD_SILENCE_MS: '1500',
    IASSIST_VAD_AMPLITUDE_THRESHOLD: '0.015',
    IASSIST_VAD_MIN_SPEECH_MS: '500',
  });

  const [stats, setStats] = useState<IAssistStats | null>(null);
  const [geminiSaved, setGeminiSaved] = useState(false);
  const [iassistSaved, setIassistSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'career-tools' | 'i-assist'>('career-tools');

  useEffect(() => {
    fetchGeminiConfig();
    fetchIAssistConfig();
    fetchStats();
  }, []);

  const fetchGeminiConfig = async () => {
    try {
      const res = await api.get('/admin/ai-config');
      if (res.data.success) setGeminiConfig(res.data.config);
    } catch (err) {
      console.error('Failed to fetch AI config:', err);
    }
  };

  const fetchIAssistConfig = async () => {
    try {
      const res = await api.get('/admin/iassist-config');
      if (res.data.success) setIassistConfig(res.data.config);
    } catch (err) {
      console.error('Failed to fetch I-Assist config:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/iassist-stats');
      if (res.data.success) setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to fetch I-Assist stats:', err);
    }
  };

  const handleGeminiSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/ai-config', geminiConfig);
      setGeminiSaved(true);
      setTimeout(() => setGeminiSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save AI config:', err);
    }
  };

  const handleIAssistSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/iassist-config', iassistConfig);
      setIassistSaved(true);
      setTimeout(() => setIassistSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save I-Assist config:', err);
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatNumber = (n: number) => n.toLocaleString();

  const selectClass = 'mt-2 w-full rounded-lg border border-line bg-bg-card p-3 text-sm text-strong focus:border-brand-orange focus:outline-none';
  const inputClass = 'mt-2 w-full rounded-lg border border-line bg-bg-card p-3 text-sm text-strong focus:border-brand-orange focus:outline-none';
  const labelClass = 'text-xs font-semibold text-text-muted';
  const hintClass = 'mt-1 text-[11px] text-text-muted/60';

  return (
    <div className="max-w-4xl space-y-6 p-6 text-strong">
      <div>
        <h1 className="font-display text-2xl font-bold">AI Configuration</h1>
        <p className="text-xs text-text-muted">Manage model routing, I-Assist settings, and monitor usage across all AI-powered tools.</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg border border-line bg-bg-surface p-1">
        <button
          onClick={() => setActiveTab('career-tools')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'career-tools'
              ? 'bg-brand-orange/15 text-brand-orange'
              : 'text-text-muted hover:text-strong'
          }`}
        >
          <Cpu size={14} className="mr-2 inline-block" />
          Career Tools
        </button>
        <button
          onClick={() => setActiveTab('i-assist')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'i-assist'
              ? 'bg-brand-orange/15 text-brand-orange'
              : 'text-text-muted hover:text-strong'
          }`}
        >
          <Mic size={14} className="mr-2 inline-block" />
          I-Assist
        </button>
      </div>

      {/* Career Tools Config */}
      {activeTab === 'career-tools' && (
        <form onSubmit={handleGeminiSave} className="rounded-xl border border-line bg-bg-surface p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Gemini Model Routing</h2>
            <p className="text-xs text-text-muted">Configure model routing strings for the 8 career tools (Resume Builder, ATS Checker, etc.)</p>
          </div>

          <div>
            <label className={labelClass}>Primary Gemini Model (Fast Inference)</label>
            <select
              value={geminiConfig.GEMINI_PRIMARY_MODEL}
              onChange={(e) => setGeminiConfig({ ...geminiConfig, GEMINI_PRIMARY_MODEL: e.target.value })}
              className={selectClass}
            >
              <option value="gemini-1.5-flash">gemini-1.5-flash (Recommended Default)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (High Reasoning)</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash</option>
              <option value="gemini-2.5-flash">gemini-2.5-flash</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Fallback Gemini Model (On Rate-Limit / Retry)</label>
            <select
              value={geminiConfig.GEMINI_FALLBACK_MODEL}
              onChange={(e) => setGeminiConfig({ ...geminiConfig, GEMINI_FALLBACK_MODEL: e.target.value })}
              className={selectClass}
            >
              <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro (Recommended Fallback)</option>
              <option value="gemini-2.0-flash">gemini-2.0-flash</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Real-Time Voice Model</label>
            <select
              value={geminiConfig.GEMINI_VOICE_MODEL}
              onChange={(e) => setGeminiConfig({ ...geminiConfig, GEMINI_VOICE_MODEL: e.target.value })}
              className={selectClass}
            >
              <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp (Speech-to-Speech Live API)</option>
            </select>
          </div>

          <div className="flex items-center justify-between border-t border-line pt-4">
            {geminiSaved && <span className="text-xs font-bold text-green-400">&#10003; Configuration saved</span>}
            <button type="submit" className="flex items-center gap-2 rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-orange/90 ml-auto">
              <Save size={16} />
              Save Model Routing
            </button>
          </div>
        </form>
      )}

      {/* I-Assist Config */}
      {activeTab === 'i-assist' && (
        <div className="space-y-6">
          {/* Usage Stats */}
          {stats && (
            <div className="rounded-xl border border-line bg-bg-surface p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Usage Overview</h2>
                <p className="text-xs text-text-muted">I-Assist usage statistics across all users</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <StatCard icon={Activity} label="Sessions" value={formatNumber(stats.totalSessions)} sub={`${stats.completedSessions} completed`} />
                <StatCard icon={Users} label="Active Users" value={formatNumber(stats.activeUsers)} sub={`${stats.totalAssistants} assistants`} />
                <StatCard icon={MessageSquare} label="Questions" value={formatNumber(stats.totalQuestions)} sub={`~${stats.avgQuestions}/session`} />
                <StatCard icon={Clock} label="Total Time" value={formatDuration(stats.totalDurationSeconds)} sub={`~${formatDuration(stats.avgDurationSeconds)}/session`} />
                <StatCard icon={Zap} label="Tokens Used" value={formatNumber(stats.totalTokens)} sub={`${stats.totalDocuments} docs`} />
              </div>
            </div>
          )}

          {/* Model Config */}
          <form onSubmit={handleIAssistSave} className="rounded-xl border border-line bg-bg-surface p-6 space-y-6">
            <div>
              <h2 className="text-lg font-semibold">Model Configuration</h2>
              <p className="text-xs text-text-muted">Gemini models used by the I-Assist desktop app for transcription and AI responses</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Transcription Model</label>
                <select
                  value={iassistConfig.IASSIST_TRANSCRIPTION_MODEL}
                  onChange={(e) => setIassistConfig({ ...iassistConfig, IASSIST_TRANSCRIPTION_MODEL: e.target.value })}
                  className={selectClass}
                >
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Recommended)</option>
                  <option value="gemini-2.0-flash-lite">gemini-2.0-flash-lite (Faster, lower quality)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                </select>
                <p className={hintClass}>Converts audio chunks to text. Optimise for speed over reasoning.</p>
              </div>

              <div>
                <label className={labelClass}>Query / Response Model</label>
                <select
                  value={iassistConfig.IASSIST_QUERY_MODEL}
                  onChange={(e) => setIassistConfig({ ...iassistConfig, IASSIST_QUERY_MODEL: e.target.value })}
                  className={selectClass}
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Recommended)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (Higher quality, slower)</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash (Fastest)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                </select>
                <p className={hintClass}>Generates interview coaching responses. Balance quality vs latency.</p>
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Max Conversation History</label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={iassistConfig.IASSIST_MAX_HISTORY}
                  onChange={(e) => setIassistConfig({ ...iassistConfig, IASSIST_MAX_HISTORY: e.target.value })}
                  className={inputClass}
                />
                <p className={hintClass}>Number of prior messages sent with each query. More context = better responses but higher token usage.</p>
              </div>

              <div>
                <label className={labelClass}>Max Output Tokens</label>
                <input
                  type="number"
                  min="256"
                  max="32768"
                  step="256"
                  value={iassistConfig.IASSIST_MAX_TOKENS}
                  onChange={(e) => setIassistConfig({ ...iassistConfig, IASSIST_MAX_TOKENS: e.target.value })}
                  className={inputClass}
                />
                <p className={hintClass}>Maximum tokens per AI response. Keep low for concise coaching; raise for detailed explanations.</p>
              </div>
            </div>

            {/* VAD Section */}
            <div className="border-t border-line pt-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold">Voice Activity Detection (VAD)</h3>
                <p className="text-xs text-text-muted">Controls how the desktop app detects speech and segments audio for transcription. These values are served to the desktop client on session start.</p>
              </div>

              <div className="grid gap-6 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Silence Threshold (ms)</label>
                  <input
                    type="number"
                    min="500"
                    max="5000"
                    step="100"
                    value={iassistConfig.IASSIST_VAD_SILENCE_MS}
                    onChange={(e) => setIassistConfig({ ...iassistConfig, IASSIST_VAD_SILENCE_MS: e.target.value })}
                    className={inputClass}
                  />
                  <p className={hintClass}>Silence duration before audio chunk is sent. Lower = faster but may split mid-sentence.</p>
                </div>

                <div>
                  <label className={labelClass}>Amplitude Threshold</label>
                  <input
                    type="number"
                    min="0.001"
                    max="0.1"
                    step="0.001"
                    value={iassistConfig.IASSIST_VAD_AMPLITUDE_THRESHOLD}
                    onChange={(e) => setIassistConfig({ ...iassistConfig, IASSIST_VAD_AMPLITUDE_THRESHOLD: e.target.value })}
                    className={inputClass}
                  />
                  <p className={hintClass}>Minimum volume level to register as speech. Raise if background noise triggers false positives.</p>
                </div>

                <div>
                  <label className={labelClass}>Min Speech Duration (ms)</label>
                  <input
                    type="number"
                    min="100"
                    max="2000"
                    step="50"
                    value={iassistConfig.IASSIST_VAD_MIN_SPEECH_MS}
                    onChange={(e) => setIassistConfig({ ...iassistConfig, IASSIST_VAD_MIN_SPEECH_MS: e.target.value })}
                    className={inputClass}
                  />
                  <p className={hintClass}>Minimum speech chunk to send for transcription. Filters out short noise bursts.</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-line pt-4">
              {iassistSaved && <span className="text-xs font-bold text-green-400">&#10003; I-Assist configuration saved</span>}
              <button type="submit" className="flex items-center gap-2 rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-orange/90 ml-auto">
                <Save size={16} />
                Save I-Assist Config
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) => (
  <div className="rounded-lg border border-line bg-bg-card p-3">
    <div className="flex items-center gap-2 text-text-muted">
      <Icon size={14} />
      <span className="text-[11px] font-medium">{label}</span>
    </div>
    <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    <p className="text-[11px] text-text-muted/60">{sub}</p>
  </div>
);

export default AIConfig;
