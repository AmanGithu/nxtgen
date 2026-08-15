import { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Trash2,
  Edit3,
  Image as ImageIcon,
  Video,
  Plus,
  FolderOpen,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
} from 'lucide-react';

// ─── Types ───
interface SiteAsset {
  id: string;
  section: string;
  tileKey: string;
  tileName: string;
  type: 'image' | 'video';
  url: string;
  fileName: string;
  uploadedAt: string;
}

// ─── Section Definitions ───
const SECTIONS = [
  {
    key: 'home-courses',
    label: 'Home — Courses',
    tiles: [
      { key: 'data-analytics-ai', name: 'Data Analytics & AI' },
      { key: 'database-management', name: 'Database Management' },
      { key: 'cyber-security', name: 'Cyber Security' },
    ],
  },
  {
    key: 'home-certifications',
    label: 'Home — Certifications',
    tiles: [
      { key: 'microsoft', name: 'Microsoft' },
      { key: 'aws', name: 'AWS' },
      { key: 'google', name: 'Google Cloud' },
      { key: 'cisco', name: 'Cisco' },
      { key: 'comptia', name: 'CompTIA' },
      { key: 'pmi', name: 'PMI' },
    ],
  },
  {
    key: 'home-internships',
    label: 'Home — Internships',
    tiles: [
      { key: 'data-analytics', name: 'Data Analytics Internship' },
      { key: 'generative-ai', name: 'Generative AI Internship' },
      { key: 'agentic-ai', name: 'Agentic AI Internship' },
      { key: 'database-management', name: 'Database Management Internship' },
    ],
  },
  {
    key: 'home-corporate',
    label: 'Home — Corporate',
    tiles: [
      { key: 'training', name: 'Upskilling & Reskilling Training' },
      { key: 'bulk-enrollments', name: 'Bulk Enrollments' },
      { key: 'consulting', name: 'AI & Tech Consulting' },
      { key: 'custom-solutions', name: 'Custom AI Solutions' },
    ],
  },
  {
    key: 'job-support',
    label: 'Technical Job Support',
    tiles: [
      { key: 'data-ai', name: 'Data Analytics & AI Support' },
      { key: 'data-engineering', name: 'Data Engineering Support' },
      { key: 'database-mgmt', name: 'Database Management Support' },
    ],
  },
  {
    key: 'hero-slides',
    label: 'Hero Slideshow',
    tiles: [
      { key: 'slide-1', name: 'Hero Slide 1' },
      { key: 'slide-2', name: 'Hero Slide 2' },
      { key: 'slide-3', name: 'Hero Slide 3' },
      { key: 'slide-4', name: 'Hero Slide 4' },
    ],
  },
];

// ─── Component ───
export default function SiteAssetsManager() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0].key);
  const [assets, setAssets] = useState<SiteAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const [previewAsset, setPreviewAsset] = useState<SiteAsset | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTileName, setEditTileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSection = SECTIONS.find((s) => s.key === activeSection) || SECTIONS[0];

  const showNotification = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/site-assets?section=${activeSection}`);
      const data = await res.json();
      if (data.success) {
        setAssets(data.assets);
      }
    } catch {
      // Use mock data if API not yet available
      setAssets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [activeSection]);

  const handleFileUpload = async (tileKey: string, tileName: string, file: File) => {
    setUploadingFor(tileKey);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('section', activeSection);
      formData.append('tileKey', tileKey);
      formData.append('tileName', tileName);

      const res = await fetch('/api/site-assets', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showNotification('success', `Asset uploaded successfully for "${tileName}"`);
        loadAssets();
      } else {
        showNotification('error', data.message || 'Upload failed. Please try again.');
      }
    } catch {
      showNotification('error', 'Network error during upload.');
    } finally {
      setUploadingFor(null);
    }
  };

  const handleDelete = async (assetId: string, tileName: string) => {
    if (!confirm(`Delete asset for "${tileName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/site-assets/${assetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        setAssets((prev) => prev.filter((a) => a.id !== assetId));
        showNotification('success', `Asset deleted for "${tileName}"`);
      } else {
        showNotification('error', 'Delete failed. Please try again.');
      }
    } catch {
      showNotification('error', 'Network error during delete.');
    }
  };

  const handleUpdateMeta = async (assetId: string) => {
    try {
      const res = await fetch(`/api/site-assets/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tileName: editTileName }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAssets((prev) => prev.map((a) => (a.id === assetId ? { ...a, tileName: editTileName } : a)));
        showNotification('success', 'Asset metadata updated');
        setEditingId(null);
      } else {
        showNotification('error', 'Update failed.');
      }
    } catch {
      showNotification('error', 'Network error.');
    }
  };

  const getAssetForTile = (tileKey: string) =>
    assets.find((a) => a.tileKey === tileKey && a.section === activeSection);

  return (
    <div className="min-h-screen bg-bg-canvas text-white">
      {/* Header */}
      <div className="border-b border-white/[0.08] bg-bg-surface/80 px-6 py-5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-white">Site Assets Manager</h1>
            <p className="text-xs text-text-muted mt-1">
              Upload, edit, or delete images and videos for each section tile on the public website.
            </p>
          </div>
          <button
            onClick={loadAssets}
            className="flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-2 text-xs font-semibold text-text-muted hover:text-white transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-semibold shadow-2xl backdrop-blur-xl ${
            notification.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/20 border-red-500/40 text-red-300'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          <span>{notification.msg}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto flex gap-0 min-h-[calc(100vh-80px)]">
        {/* Sidebar */}
        <div className="w-64 shrink-0 border-r border-white/[0.08] bg-bg-surface/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-3">Sections</p>
          <ul className="space-y-1">
            {SECTIONS.map((section) => (
              <li key={section.key}>
                <button
                  onClick={() => setActiveSection(section.key)}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-medium text-left transition-all ${
                    activeSection === section.key
                      ? 'bg-brand-orange/15 border border-brand-orange/30 text-brand-orange'
                      : 'text-text-muted hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  <FolderOpen size={14} />
                  <span>{section.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">{currentSection.label}</h2>
              <p className="text-xs text-text-muted mt-0.5">{currentSection.tiles.length} tiles in this section</p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-text-muted text-sm">
              <RefreshCw size={20} className="animate-spin mr-2" /> Loading assets...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {currentSection.tiles.map((tile) => {
                const existing = getAssetForTile(tile.key);
                const isUploading = uploadingFor === tile.key;
                const isEditing = editingId === existing?.id;

                return (
                  <div
                    key={tile.key}
                    className="rounded-2xl border border-white/[0.08] bg-bg-card overflow-hidden transition-all hover:border-white/[0.15] shadow-md flex flex-col"
                  >
                    {/* Preview Area */}
                    <div className="relative w-full aspect-video bg-white/[0.03] flex items-center justify-center overflow-hidden">
                      {existing ? (
                        existing.type === 'video' ? (
                          <video
                            src={existing.url}
                            className="w-full h-full object-cover"
                            muted
                            loop
                            autoPlay
                          />
                        ) : (
                          <img
                            src={existing.url}
                            alt={existing.tileName}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-text-muted">
                          <ImageIcon size={28} />
                          <span className="text-[11px]">No asset uploaded</span>
                        </div>
                      )}

                      {/* Overlay actions */}
                      {existing && (
                        <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            onClick={() => setPreviewAsset(existing)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => { setEditingId(existing.id); setEditTileName(existing.tileName); }}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 text-white hover:bg-white/30 transition-colors"
                            title="Edit metadata"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(existing.id, tile.name)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/30 text-red-300 hover:bg-red-500/50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}

                      {/* Asset type badge */}
                      {existing && (
                        <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
                          {existing.type === 'video' ? <Video size={10} /> : <ImageIcon size={10} />}
                          <span>{existing.type}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 flex flex-col gap-2">
                      {isEditing && existing ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editTileName}
                            onChange={(e) => setEditTileName(e.target.value)}
                            className="flex-1 rounded-lg border border-white/[0.1] bg-bg-surface px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-brand-orange"
                          />
                          <button
                            onClick={() => handleUpdateMeta(existing.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          >
                            <Save size={13} />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/[0.06] text-text-muted hover:text-white"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-bold text-white">{tile.name}</p>
                          {existing && (
                            <p className="text-[10px] text-text-muted mt-0.5 truncate" title={existing.fileName}>
                              {existing.fileName}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Upload Button */}
                      <label className={`relative flex items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-semibold cursor-pointer transition-all ${
                        existing
                          ? 'border-white/[0.1] text-text-muted hover:border-brand-orange/40 hover:text-white'
                          : 'border-brand-orange/40 text-brand-orange bg-brand-orange/10 hover:bg-brand-orange/15'
                      }`}>
                        {isUploading ? (
                          <>
                            <RefreshCw size={13} className="animate-spin" />
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            {existing ? <Upload size={13} /> : <Plus size={13} />}
                            <span>{existing ? 'Replace Asset' : 'Upload Asset'}</span>
                          </>
                        )}
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          accept="image/*,video/*"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(tile.key, tile.name, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-w-3xl w-full rounded-3xl border border-white/[0.12] bg-bg-surface overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-3">
              <div>
                <h3 className="text-sm font-bold text-white">{previewAsset.tileName}</h3>
                <p className="text-[10px] text-text-muted">{previewAsset.fileName} • {previewAsset.section}</p>
              </div>
              <button
                onClick={() => setPreviewAsset(null)}
                className="rounded-xl border border-white/[0.1] p-1.5 text-text-muted hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-4">
              {previewAsset.type === 'video' ? (
                <video src={previewAsset.url} controls className="w-full rounded-xl" />
              ) : (
                <img src={previewAsset.url} alt={previewAsset.tileName} className="w-full rounded-xl object-contain max-h-[60vh]" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
