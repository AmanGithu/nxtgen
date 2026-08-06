import React, { useState, useEffect } from 'react';
import { 
  Upload, Film, Image as ImageIcon, Trash2, Save, Eye, 
  Check, Play, Plus, RefreshCw, ArrowRight, AlertCircle, Layers
} from 'lucide-react';

export interface ThemeAssetSlide {
  id: string;
  filename: string;
  url: string;
  mediaType: 'image' | 'video';
  badge?: string;
  title?: string;
  highlightText?: string;
  subtitle?: string;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  enabled: boolean;
  order: number;
}

export default function ThemeAssetsManager() {
  const [slides, setSlides] = useState<ThemeAssetSlide[]>([]);
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch theme_assets slides from backend
  const fetchSlides = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/theme-assets');
      const data = await res.json();
      if (data.success && Array.isArray(data.slides)) {
        setSlides(data.slides);
        if (data.slides.length > 0 && !selectedSlideId) {
          setSelectedSlideId(data.slides[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch theme assets:', err);
      setErrorMsg('Failed to load slides from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, []);

  const selectedSlide = slides.find(s => s.id === selectedSlideId) || slides[0];

  // Handle input changes for selected slide overlay text
  const handleInputChange = (field: keyof ThemeAssetSlide, value: any) => {
    if (!selectedSlideId) return;
    setSlides(prev => prev.map(s => {
      if (s.id === selectedSlideId) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  // Upload file handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg('');

    const formData = new FormData();
    formData.append('asset', file);

    try {
      const res = await fetch('/api/theme-assets/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setSlides(data.slides);
        if (data.slide) {
          setSelectedSlideId(data.slide.id);
        }
      } else {
        setErrorMsg(data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setErrorMsg('Failed to upload file');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Save updated configurations
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setErrorMsg('');

    try {
      const res = await fetch('/api/theme-assets/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setErrorMsg(data.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Save error:', err);
      setErrorMsg('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete slide asset
  const handleDelete = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete asset "${filename}"?`)) return;

    try {
      const res = await fetch(`/api/theme-assets/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setSlides(data.slides);
        if (data.slides.length > 0) {
          setSelectedSlideId(data.slides[0].id);
        } else {
          setSelectedSlideId(null);
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
      setErrorMsg('Failed to delete asset');
    }
  };

  // Check if current slide has text overlay
  const hasTextOverlay = (slide: ThemeAssetSlide) => {
    return !!(slide.title?.trim() || slide.subtitle?.trim() || slide.badge?.trim() || slide.highlightText?.trim());
  };

  return (
    <div className="space-y-8 p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-brand-orange/15 p-2 text-brand-orange">
              <Layers size={22} />
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-white">Hero Slider Theme Assets</h1>
          </div>
          <p className="text-sm text-text-muted mt-1">
            Manage images & videos in <code className="text-brand-orange font-mono">client/public/theme_assets</code> and configure their text overlays for the homepage hero carousel.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* File Upload Button */}
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-brand-orange px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-orange-600 shadow-lg shadow-brand-orange/20">
            <Upload size={16} />
            <span>{isUploading ? 'Uploading...' : 'Upload Image / Video'}</span>
            <input 
              type="file" 
              accept="image/*,video/mp4,video/webm" 
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden" 
            />
          </label>

          {/* Save Configuration Button */}
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.15] bg-bg-surface px-5 py-2.5 text-sm font-bold text-white transition-all hover:border-brand-orange hover:bg-white/[0.05]"
          >
            {saveSuccess ? <Check size={16} className="text-emerald-400" /> : <Save size={16} />}
            <span>{isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Overlay Config'}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300 flex items-center gap-2">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Asset Grid Selection Bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-text-muted uppercase tracking-wider">Available Assets in theme_assets ({slides.length})</h2>
          <span className="text-xs text-text-muted">Click an asset below to configure its text overlay</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center p-12 bg-bg-surface rounded-2xl border border-white/[0.08]">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-orange border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {slides.map((slide, index) => {
              const isSelected = slide.id === selectedSlideId;
              const isVid = slide.mediaType === 'video';
              const textExists = hasTextOverlay(slide);

              return (
                <div
                  key={slide.id}
                  onClick={() => setSelectedSlideId(slide.id)}
                  className={`group relative cursor-pointer rounded-xl border p-1.5 transition-all overflow-hidden bg-bg-card ${
                    isSelected
                      ? 'border-brand-orange ring-2 ring-brand-orange/50 scale-[1.02] shadow-xl'
                      : 'border-white/[0.08] hover:border-white/[0.25]'
                  }`}
                >
                  <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
                    {isVid ? (
                      <video src={slide.url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={slide.url} alt={slide.filename} className="w-full h-full object-cover" />
                    )}
                    
                    {/* Media Type Badge */}
                    <div className="absolute top-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase backdrop-blur-sm flex items-center gap-1">
                      {isVid ? <Film size={10} className="text-amber-400" /> : <ImageIcon size={10} className="text-sky-400" />}
                      <span>{isVid ? 'VID' : 'IMG'}</span>
                    </div>

                    {/* Text Overlay Status Indicator */}
                    <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-bold uppercase backdrop-blur-sm">
                      {textExists ? (
                        <span className="text-emerald-400">Text ON</span>
                      ) : (
                        <span className="text-slate-400">Pure Media</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 px-1">
                    <p className="text-[11px] font-semibold text-white truncate" title={slide.filename}>
                      {index + 1}. {slide.filename}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <label className="flex items-center gap-1.5 text-[10px] text-text-muted cursor-pointer" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={slide.enabled}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, enabled: val } : s));
                          }}
                          className="rounded accent-brand-orange"
                        />
                        <span>Active</span>
                      </label>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(slide.filename);
                        }}
                        className="text-text-muted hover:text-red-400 transition-colors p-1"
                        title="Delete asset"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide Detail & Overlay Text Editor Form */}
      {selectedSlide && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-bg-surface rounded-2xl border border-white/[0.08] p-6 lg:p-8">
          
          {/* Left Column: Live Preview Card */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Eye size={16} className="text-brand-orange" />
              <span>Live Slide Preview</span>
            </h3>

            <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/[0.1] bg-black shadow-2xl">
              {selectedSlide.mediaType === 'video' ? (
                <video src={selectedSlide.url} autoPlay loop muted playsInline className="w-full h-full object-cover" />
              ) : (
                <img src={selectedSlide.url} alt="Slide Preview" className="w-full h-full object-cover" />
              )}

              {/* Ultra-subtle 2% Overlay */}
              <div className="absolute inset-0 bg-black/[0.02] z-0 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-black/10 via-40% to-transparent z-0 pointer-events-none" />

              {/* Text Content Overlay (Only renders if text exists!) */}
              {hasTextOverlay(selectedSlide) ? (
                <div className="absolute inset-0 z-10 p-4 sm:p-6 flex flex-col justify-center max-w-xs text-white space-y-2">
                  {selectedSlide.badge && (
                    <span className="inline-block rounded-full bg-brand-orange/20 border border-brand-orange/40 text-[9px] font-bold text-brand-orange px-2 py-0.5 uppercase tracking-wide w-max">
                      {selectedSlide.badge}
                    </span>
                  )}
                  {selectedSlide.title && (
                    <h4 className="text-xs sm:text-sm font-extrabold leading-tight text-white">
                      {selectedSlide.title}{' '}
                      {selectedSlide.highlightText && (
                        <span className="text-brand-orange">{selectedSlide.highlightText}</span>
                      )}
                    </h4>
                  )}
                  {selectedSlide.subtitle && (
                    <p className="text-[10px] text-slate-300 line-clamp-2 leading-relaxed">
                      {selectedSlide.subtitle}
                    </p>
                  )}
                  {selectedSlide.primaryCtaText && (
                    <div className="pt-1">
                      <span className="inline-flex items-center gap-1 rounded bg-brand-orange px-2.5 py-1 text-[9px] font-bold text-white">
                        {selectedSlide.primaryCtaText} <ArrowRight size={10} />
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="absolute bottom-3 left-3 z-10 rounded-lg bg-black/80 px-2.5 py-1 text-[10px] text-amber-400 font-mono font-bold backdrop-blur-md">
                  Pure Media Mode (No Text Overlay)
                </div>
              )}
            </div>

            <div className="rounded-xl bg-bg-card p-4 border border-white/[0.08] text-xs space-y-1.5 text-text-muted">
              <p className="font-semibold text-white">Asset Details:</p>
              <p><span className="text-slate-400">Filename:</span> {selectedSlide.filename}</p>
              <p><span className="text-slate-400">Media Type:</span> <span className="uppercase font-bold text-brand-orange">{selectedSlide.mediaType}</span></p>
              <p><span className="text-slate-400">Path:</span> <code className="text-sky-300">{selectedSlide.url}</code></p>
            </div>
          </div>

          {/* Right Column: Overlay Text Input Form */}
          <div className="lg:col-span-7 space-y-5">
            <div className="border-b border-white/[0.08] pb-3">
              <h3 className="text-base font-bold text-white">Configure Text Overlay</h3>
              <p className="text-xs text-text-muted">
                Leave inputs empty if you want this image/video to display cleanly without text overlays.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Badge Input */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Badge Text (Top Label)</label>
                <input
                  type="text"
                  placeholder="e.g. 1. LIVE AI INTERVIEW STAGE"
                  value={selectedSlide.badge || ''}
                  onChange={(e) => handleInputChange('badge', e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-bg-card px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                />
              </div>

              {/* Title Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Headline Title</label>
                <input
                  type="text"
                  placeholder="e.g. Practice Realistic AI Interviews With"
                  value={selectedSlide.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-bg-card px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                />
              </div>

              {/* Highlight Text Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Highlight Text (Gradient Accent)</label>
                <input
                  type="text"
                  placeholder="e.g. Real-Time Avatar Feedback"
                  value={selectedSlide.highlightText || ''}
                  onChange={(e) => handleInputChange('highlightText', e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-bg-card px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                />
              </div>

              {/* Subtitle Description Input */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Subtitle / Description</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Simulate technical, HR, and behavioral interviews with 3D avatars..."
                  value={selectedSlide.subtitle || ''}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-bg-card px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                />
              </div>

              {/* Primary CTA Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Primary Button Text</label>
                <input
                  type="text"
                  placeholder="e.g. Launch Live Interview"
                  value={selectedSlide.primaryCtaText || ''}
                  onChange={(e) => handleInputChange('primaryCtaText', e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-bg-card px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                />
              </div>

              {/* Primary CTA Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Primary Button Link</label>
                <input
                  type="text"
                  placeholder="e.g. /tools/live-interview"
                  value={selectedSlide.primaryCtaLink || ''}
                  onChange={(e) => handleInputChange('primaryCtaLink', e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-bg-card px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                />
              </div>

              {/* Secondary CTA Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Secondary Button Text</label>
                <input
                  type="text"
                  placeholder="e.g. Explore All Tools"
                  value={selectedSlide.secondaryCtaText || ''}
                  onChange={(e) => handleInputChange('secondaryCtaText', e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-bg-card px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                />
              </div>

              {/* Secondary CTA Link */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">Secondary Button Link</label>
                <input
                  type="text"
                  placeholder="e.g. /tools/i-assist"
                  value={selectedSlide.secondaryCtaLink || ''}
                  onChange={(e) => handleInputChange('secondaryCtaLink', e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-bg-card px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-orange focus:outline-none"
                />
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
              <button
                type="button"
                onClick={() => {
                  // Clear overlay text fields
                  setSlides(prev => prev.map(s => s.id === selectedSlideId ? {
                    ...s,
                    badge: '',
                    title: '',
                    highlightText: '',
                    subtitle: '',
                    primaryCtaText: '',
                    secondaryCtaText: ''
                  } : s));
                }}
                className="text-xs text-amber-400 hover:underline"
              >
                Clear All Text Fields (Pure Media Mode)
              </button>

              <button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-orange px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-orange-600 shadow-lg shadow-brand-orange/20"
              >
                {saveSuccess ? <Check size={16} /> : <Save size={16} />}
                <span>{isSaving ? 'Saving Changes...' : saveSuccess ? 'Saved!' : 'Save Slide Settings'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
