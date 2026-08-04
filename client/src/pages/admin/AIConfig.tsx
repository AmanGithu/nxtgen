import { useState, useEffect } from 'react';
import { Cpu, Save, ShieldCheck } from 'lucide-react';
import api from '../../services/api';

const AIConfig = () => {
  const [config, setConfig] = useState({
    GEMINI_PRIMARY_MODEL: 'gemini-1.5-flash',
    GEMINI_FALLBACK_MODEL: 'gemini-1.5-pro',
    GEMINI_VOICE_MODEL: 'gemini-2.0-flash-exp',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await api.get('/admin/ai-config');
      if (res.data.success) {
        setConfig(res.data.config);
      }
    } catch (err) {
      console.error('Failed to fetch AI config:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/admin/ai-config', config);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save AI config:', err);
    }
  };

  return (
    <div className="max-w-3xl space-y-6 p-6 text-strong">
      <div>
        <h1 className="font-display text-2xl font-bold">Google Gemini AI Configuration</h1>
        <p className="text-xs text-text-muted">Configure model routing strings, fallback rules, and real-time audio models across all 8 career tools.</p>
      </div>

      <form onSubmit={handleSave} className="rounded-xl border border-line bg-bg-surface p-6 space-y-6">
        <div>
          <label className="text-xs font-semibold text-text-muted">Primary Gemini Model (Fast Inference)</label>
          <select
            value={config.GEMINI_PRIMARY_MODEL}
            onChange={(e) => setConfig({ ...config, GEMINI_PRIMARY_MODEL: e.target.value })}
            className="mt-2 w-full rounded-lg border border-line bg-bg-card p-3 text-sm text-strong focus:border-brand-orange"
          >
            <option value="gemini-1.5-flash">gemini-1.5-flash (Recommended Default)</option>
            <option value="gemini-1.5-pro">gemini-1.5-pro (High Reasoning)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted">Fallback Gemini Model (On Rate-Limit / Retry)</label>
          <select
            value={config.GEMINI_FALLBACK_MODEL}
            onChange={(e) => setConfig({ ...config, GEMINI_FALLBACK_MODEL: e.target.value })}
            className="mt-2 w-full rounded-lg border border-line bg-bg-card p-3 text-sm text-strong focus:border-brand-orange"
          >
            <option value="gemini-1.5-flash">gemini-1.5-flash</option>
            <option value="gemini-1.5-pro">gemini-1.5-pro (Recommended Fallback)</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-text-muted">Real-Time Voice Model (I-Assist / LiveKit WebSockets)</label>
          <select
            value={config.GEMINI_VOICE_MODEL}
            onChange={(e) => setConfig({ ...config, GEMINI_VOICE_MODEL: e.target.value })}
            className="mt-2 w-full rounded-lg border border-line bg-bg-card p-3 text-sm text-strong focus:border-brand-orange"
          >
            <option value="gemini-2.0-flash-exp">gemini-2.0-flash-exp (Speech-to-Speech Live API)</option>
          </select>
        </div>

        <div className="flex items-center justify-between border-t border-line pt-4">
          {saved && <span className="text-xs font-bold text-green-400">✓ AI Configuration Saved</span>}
          <button type="submit" className="flex items-center gap-2 rounded-lg bg-brand-orange px-6 py-2.5 text-sm font-semibold text-on-brand hover:bg-brand-orange/90 ml-auto">
            <Save size={16} />
            Save Model Routing
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIConfig;
