import React, { useState, useEffect } from 'react';
import {
  Upload,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Cpu,
  Mic,
  Volume2,
  Mail,
  Phone,
  MapPin,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';

const LLM_OPTIONS = [
  'gemini-2.5-flash-native-audio-preview-12-2025',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

const STT_OPTIONS = [
  'google-stt-v2',
  'deepgram',
  'whisper-v3',
];

const TTS_OPTIONS = [
  'google-tts',
  'elevenlabs',
  'azure-speech',
];

const VOICE_PERSONAS = ['Charon', 'Puck', 'Aoede', 'Fenrir', 'Kore'];

export default function AboutUsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [config, setConfig] = useState({
    AGENT_DISPLAY_IMAGE: '/assets/pavy_receptionist.jpg',
    AGENT_SYSTEM_PROMPT: '',
    VOICE_LLM_MODEL: 'gemini-2.5-flash-native-audio-preview-12-2025',
    VOICE_STT_MODEL: 'google-stt-v2',
    VOICE_TTS_MODEL: 'google-tts',
    VOICE_PERSONA: 'Charon',
    CONTACT_EMAIL_PRIMARY: 'contact@nxtgenacademy.in',
    CONTACT_EMAIL_ADMISSIONS: 'admissions@nxtgenacademy.in',
    CONTACT_PHONE: '+91 96730-04500',
    CONTACT_ADDRESS: 'PAVY Consultancy Services Pvt Ltd, Tech Park Campus, Hyderabad, India',
    WHATSAPP_SYSTEM_PROMPT: '',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/about-us');
      const data = await res.json();
      if (data.success && data.config) {
        setConfig((prev) => ({ ...prev, ...data.config }));
      }
    } catch (err) {
      console.error('Failed to fetch About Us config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/about-us', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: 'About Us & Agent Display settings saved successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to save configuration.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setConfig((prev) => ({ ...prev, AGENT_DISPLAY_IMAGE: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetImage = () => {
    setConfig((prev) => ({ ...prev, AGENT_DISPLAY_IMAGE: '/assets/pavy_receptionist.jpg' }));
  };

  const inputClass =
    'w-full rounded-xl border border-white/[0.1] bg-bg-surface px-3.5 py-2.5 text-xs text-white placeholder:text-text-muted focus:outline-none focus:border-brand-orange transition-colors';

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-text-muted">
        <RefreshCw size={24} className="animate-spin text-brand-orange" />
        <span className="ml-2 text-sm">Loading About Us Management settings...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white font-display">About Us Management</h1>
          <p className="text-xs text-text-muted mt-1">
            Manage the AI Co-ordinator agent display, AI voice LLM/TTS/STT models, and contact information.
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange to-orange-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-brand-orange/20 hover:from-orange-600 hover:to-brand-orange transition-all disabled:opacity-50"
        >
          <Save size={15} />
          <span>{saving ? 'Saving...' : 'Save All Changes'}</span>
        </button>
      </div>

      {/* Message Banner */}
      {message && (
        <div
          className={`flex items-center gap-3 rounded-xl p-4 text-xs font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* ─── SECTION 1: AGENT DISPLAY (RECEPTIONIST IMAGE) ─── */}
      <div className="rounded-2xl border border-white/[0.1] bg-bg-card p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
            <ImageIcon size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Agent Display (Receptionist Card)</h2>
            <p className="text-xs text-text-muted">Upload, edit, or delete the receptionist agent image shown on the Connect Us page.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Image Preview */}
          <div className="md:col-span-6 space-y-2">
            <label className="text-xs font-bold text-white block">Current Agent Receptionist Display</label>
            <div className="relative rounded-2xl overflow-hidden border border-amber-500/30 bg-black shadow-xl aspect-video group">
              <img
                src={config.AGENT_DISPLAY_IMAGE}
                alt="Agent Receptionist Display"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/pavy_receptionist.jpg';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-4">
                <span className="rounded-lg bg-black/60 backdrop-blur px-3 py-1 text-[11px] font-semibold text-amber-300 border border-amber-500/30">
                  TALK TO PAVY (Preview Button Overlay)
                </span>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="md:col-span-6 space-y-4">
            <div>
              <label className="text-xs font-bold text-white block mb-1">Agent Image URL</label>
              <input
                type="text"
                value={config.AGENT_DISPLAY_IMAGE}
                onChange={(e) => setConfig({ ...config, AGENT_DISPLAY_IMAGE: e.target.value })}
                className={inputClass}
                placeholder="/assets/pavy_receptionist.jpg or https://..."
              />
              <p className="text-[11px] text-text-muted mt-1">Enter relative path or full URL of the agent receptionist image.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.15] px-4 py-2.5 text-xs font-bold text-white transition-all">
                <Upload size={15} className="text-brand-orange" />
                <span>Upload New Agent Image</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>

              <button
                type="button"
                onClick={handleResetImage}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-4 py-2.5 text-xs font-bold text-red-400 transition-all"
              >
                <Trash2 size={15} />
                <span>Reset to Default Image</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: AI VOICE AGENT CONFIG (LLM, TTS, STT) ─── */}
      <div className="rounded-2xl border border-white/[0.1] bg-bg-card p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
            <Cpu size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">AI Voice Agent Model Configurations</h2>
            <p className="text-xs text-text-muted">Configure LLM, Speech-To-Text (STT), Text-To-Speech (TTS), and Voice Persona.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* LLM Model */}
          <div>
            <label className="text-xs font-bold text-white block mb-1">AI LLM Model</label>
            <select
              value={config.VOICE_LLM_MODEL}
              onChange={(e) => setConfig({ ...config, VOICE_LLM_MODEL: e.target.value })}
              className={inputClass}
            >
              {LLM_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-bg-surface text-white">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* STT Model */}
          <div>
            <label className="text-xs font-bold text-white block mb-1">Speech-To-Text (STT) Engine</label>
            <select
              value={config.VOICE_STT_MODEL}
              onChange={(e) => setConfig({ ...config, VOICE_STT_MODEL: e.target.value })}
              className={inputClass}
            >
              {STT_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-bg-surface text-white">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* TTS Model */}
          <div>
            <label className="text-xs font-bold text-white block mb-1">Text-To-Speech (TTS) Engine</label>
            <select
              value={config.VOICE_TTS_MODEL}
              onChange={(e) => setConfig({ ...config, VOICE_TTS_MODEL: e.target.value })}
              className={inputClass}
            >
              {TTS_OPTIONS.map((opt) => (
                <option key={opt} value={opt} className="bg-bg-surface text-white">
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Persona */}
          <div>
            <label className="text-xs font-bold text-white block mb-1">Voice Persona / Voice</label>
            <select
              value={config.VOICE_PERSONA}
              onChange={(e) => setConfig({ ...config, VOICE_PERSONA: e.target.value })}
              className={inputClass}
            >
              {VOICE_PERSONAS.map((opt) => (
                <option key={opt} value={opt} className="bg-bg-surface text-white">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* System Prompt */}
        <div>
          <label className="text-xs font-bold text-white block mb-1">Agent System Prompt / Instructions</label>
          <textarea
            rows={6}
            value={config.AGENT_SYSTEM_PROMPT}
            onChange={(e) => setConfig({ ...config, AGENT_SYSTEM_PROMPT: e.target.value })}
            className={inputClass}
            placeholder="Define the behavior, brand knowledge, and tone of the AI Co-ordinator..."
          />
        </div>
      </div>

      {/* ─── SECTION 3: ACADEMY CONTACT DETAILS ─── */}
      <div className="rounded-2xl border border-white/[0.1] bg-bg-card p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
            <Mail size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Academy Contact Details</h2>
            <p className="text-xs text-text-muted">Manage the public contact emails, phone numbers, and HQ address.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Primary Email */}
          <div>
            <label className="text-xs font-bold text-white block mb-1">Primary General Email</label>
            <div className="relative">
              <input
                type="email"
                value={config.CONTACT_EMAIL_PRIMARY}
                onChange={(e) => setConfig({ ...config, CONTACT_EMAIL_PRIMARY: e.target.value })}
                className={inputClass}
                placeholder="contact@nxtgenacademy.in"
              />
            </div>
          </div>

          {/* Admissions Email */}
          <div>
            <label className="text-xs font-bold text-white block mb-1">Admissions Email</label>
            <input
              type="email"
              value={config.CONTACT_EMAIL_ADMISSIONS}
              onChange={(e) => setConfig({ ...config, CONTACT_EMAIL_ADMISSIONS: e.target.value })}
              className={inputClass}
              placeholder="admissions@nxtgenacademy.in"
            />
          </div>

          {/* Executive Phone */}
          <div>
            <label className="text-xs font-bold text-white block mb-1">Executive Desk Phone Number</label>
            <input
              type="text"
              value={config.CONTACT_PHONE}
              onChange={(e) => setConfig({ ...config, CONTACT_PHONE: e.target.value })}
              className={inputClass}
              placeholder="+91 96730-04500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="text-xs font-bold text-white block mb-1">Academy HQ Address</label>
            <input
              type="text"
              value={config.CONTACT_ADDRESS}
              onChange={(e) => setConfig({ ...config, CONTACT_ADDRESS: e.target.value })}
              className={inputClass}
              placeholder="PAVY Consultancy Services Pvt Ltd, Tech Park Campus, Hyderabad, India"
            />
          </div>
        </div>
      </div>

      {/* ─── SECTION 4: WHATSAPP AUTO-RESPONDER CONFIGURATION ─── */}
      <div className="rounded-2xl border border-white/[0.1] bg-bg-card p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.08] pb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <MessageSquare size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">WhatsApp Auto-Responder</h2>
            <p className="text-xs text-text-muted">Configure the AI system prompt used by the Meta WhatsApp Cloud API webhook to auto-reply to incoming messages.</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-white block mb-1">WhatsApp AI System Prompt</label>
          <textarea
            rows={8}
            value={config.WHATSAPP_SYSTEM_PROMPT}
            onChange={(e) => setConfig({ ...config, WHATSAPP_SYSTEM_PROMPT: e.target.value })}
            className={inputClass}
            placeholder="Define the WhatsApp AI bot's behavior, brand knowledge, tone, and conversational rules…"
          />
          <p className="text-[11px] text-text-muted mt-1">This prompt is used by the Gemini-powered auto-responder that replies to WhatsApp messages sent to +91 9673000450.</p>
        </div>
      </div>

      {/* Submit Button Bar */}
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange to-orange-600 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-xl shadow-brand-orange/20 hover:from-orange-600 hover:to-brand-orange transition-all disabled:opacity-50"
        >
          <Save size={16} />
          <span>{saving ? 'Saving Settings...' : 'Save All Configurations'}</span>
        </button>
      </div>
    </div>
  );
}
