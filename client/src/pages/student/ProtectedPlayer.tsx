import { useState, useEffect, useRef } from 'react';
import { Video, FileText, Lock, Play, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { materialFileId, drivePreviewUrl } from '../../lib/drive';

const ProtectedPlayer = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'RECORDING' | 'NOTES' | 'ASSIGNMENT' | 'QUIZ'>('RECORDING');
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [watermark, setWatermark] = useState<any>({ email: 'student@example.com', ip: '103.42.11.4', timestamp: '2026-07-28' });
  const [loading, setLoading] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    // Draw dynamic translucent canvas watermark
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = '14px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.18)'; // Diagonal translucent overlay
        ctx.save();
        ctx.translate(canvas.width / 4, canvas.height / 2);
        ctx.rotate(-Math.PI / 8);
        const text = `Student: ${watermark.email} | IP: ${watermark.ip} | ${watermark.timestamp}`;
        ctx.fillText(text, 0, 0);
        ctx.fillText(text, 50, 100);
        ctx.restore();
      }
    }
  }, [watermark, selectedMaterial]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/materials');
      if (res.data.success) {
        setMaterials(res.data.materials);
        if (res.data.watermark) setWatermark(res.data.watermark);
        if (res.data.materials.length > 0) setSelectedMaterial(res.data.materials[0]);
      }
    } catch (err) {
      console.error('Failed to fetch materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(m => m.type === activeTab);

  /* Null when the admin saved a material without a usable Drive reference —
     the viewport says so rather than showing an empty black box. */
  const fileId = selectedMaterial ? materialFileId(selectedMaterial) : null;

  return (
    <div className="space-y-6 p-6 text-strong">
      <div>
        <h1 className="font-display text-2xl font-bold">Study Material & Protected Video Player</h1>
        <p className="text-xs text-text-muted">Access-controlled DRM-lite player with dynamic student watermarking (no download buttons available).</p>
      </div>

      {/* Protected Player Viewport */}
      <div className="relative overflow-hidden rounded-xl border border-line bg-black aspect-video flex items-center justify-center">
        {fileId ? (
          <>
            {/* Drive shows its own sign-in wall inside the frame when a file
                isn't link-shared. Nothing in that wall mentions NxtGen, so
                without this note a student just sees a Google login and
                assumes the site is broken. */}
            <p className="absolute inset-x-0 bottom-0 z-20 bg-bg-surface/95 px-4 py-2 text-center text-[11px] text-text-muted backdrop-blur-sm">
              Seeing a Google sign-in instead of the material? It hasn&apos;t been shared yet —
              let your instructor know.
            </p>
            <iframe
            key={fileId}
            src={drivePreviewUrl(fileId)}
            title={selectedMaterial?.title || 'Study material'}
            allow="autoplay; encrypted-media"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
            />
          </>
        ) : (
          <div className="text-center space-y-3 z-10 px-6">
            <Play className="mx-auto h-16 w-16 text-brand-orange" />
            <p className="text-sm font-semibold text-strong">
              {selectedMaterial ? selectedMaterial.title : 'Select a recording or note below'}
            </p>
            <span className="inline-flex items-center gap-1 rounded bg-brand-orange/20 px-3 py-1 text-xs font-bold text-brand-orange">
              <ShieldAlert size={14} />
              {selectedMaterial ? 'No Drive file linked to this material' : 'DRM-Lite Protection Active'}
            </span>
          </div>
        )}

        {/* ─── DYNAMIC CANVAS WATERMARK OVERLAY ─── */}
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="absolute inset-0 z-10 pointer-events-none w-full h-full"
        />
      </div>

      {/* Horizontal Tabs (Sorted Date Descending) */}
      <div className="border-b border-line">
        <div className="flex gap-6">
          {(['RECORDING', 'NOTES', 'ASSIGNMENT', 'QUIZ'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`pb-3 text-xs font-bold uppercase transition-colors relative ${
                activeTab === type ? 'text-brand-orange' : 'text-text-muted hover:text-strong'
              }`}
            >
              {type === 'RECORDING' ? 'Recorded Sessions' : type === 'NOTES' ? 'Class Notes' : type}
              {activeTab === type && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-orange" />}
            </button>
          ))}
        </div>
      </div>

      {/* Material Asset Cards (Sorted Date Descending) */}
      <div className="space-y-3">
        {filteredMaterials.length === 0 ? (
          <p className="text-xs text-text-muted py-4">No assets available under this section.</p>
        ) : (
          filteredMaterials.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelectedMaterial(m)}
              className={`flex items-center justify-between rounded-lg border p-4 cursor-pointer transition-all ${
                selectedMaterial?.id === m.id
                  ? 'border-brand-orange bg-brand-orange/10'
                  : 'border-line bg-bg-surface hover:bg-elevate'
              }`}
            >
              <div className="flex items-center gap-3">
                {m.type === 'RECORDING' ? <Video className="text-brand-orange" size={20} /> : <FileText className="text-brand-orange" size={20} />}
                <div>
                  <h4 className="text-sm font-semibold text-strong">{m.title}</h4>
                  <p className="text-xs text-text-muted">Uploaded on {new Date(m.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <span className="text-xs font-semibold text-text-muted">
                {materialFileId(m) ? 'Direct Inline View →' : 'No file linked'}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
};

export default ProtectedPlayer;
