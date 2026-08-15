import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const router = Router();

const ASSETS_DIR = path.join(__dirname, '../../../client/public/assets');
const CONFIG_FILE = path.join(__dirname, '../../data/site_assets_config.json');

// Ensure directories exist
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}
const DATA_DIR = path.dirname(CONFIG_FILE);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface SiteAsset {
  id: string;
  section: string;
  tileKey: string;
  tileName: string;
  type: 'image' | 'video';
  url: string;
  fileName: string;
  uploadedAt: string;
}

// ─── Load config ───
function loadConfig(): SiteAsset[] {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

function saveConfig(assets: SiteAsset[]) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(assets, null, 2), 'utf-8');
}

// ─── Multer upload storage ───
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const section = (req.body?.section || 'misc') as string;
    const sectionDir = path.join(ASSETS_DIR, section);
    if (!fs.existsSync(sectionDir)) {
      fs.mkdirSync(sectionDir, { recursive: true });
    }
    cb(null, sectionDir);
  },
  filename: (_req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}-${cleanName}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.mp4', '.webm'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// ─── GET /api/site-assets?section=... ───
router.get('/', (req: Request, res: Response) => {
  const { section } = req.query;
  const all = loadConfig();
  const filtered = section ? all.filter((a) => a.section === section) : all;
  res.json({ success: true, assets: filtered });
});

// ─── POST /api/site-assets — upload new asset ───
router.post('/', upload.single('file'), (req: Request, res: Response): any => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded or invalid file type.' });
  }

  const { section, tileKey, tileName } = req.body;
  if (!section || !tileKey) {
    return res.status(400).json({ success: false, message: 'section and tileKey are required.' });
  }

  const ext = path.extname(req.file.filename).toLowerCase();
  const assetType: 'image' | 'video' = ['.mp4', '.webm'].includes(ext) ? 'video' : 'image';
  const assetUrl = `/assets/${section}/${req.file.filename}`;

  const all = loadConfig();

  // Replace if asset for same section+tileKey already exists
  const existingIdx = all.findIndex((a) => a.section === section && a.tileKey === tileKey);
  if (existingIdx !== -1) {
    // Delete old file
    const oldFilePath = path.join(ASSETS_DIR, section, all[existingIdx].fileName);
    if (fs.existsSync(oldFilePath)) {
      try { fs.unlinkSync(oldFilePath); } catch { /* ignore */ }
    }
    all.splice(existingIdx, 1);
  }

  const newAsset: SiteAsset = {
    id: `asset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    section,
    tileKey,
    tileName: tileName || tileKey,
    type: assetType,
    url: assetUrl,
    fileName: req.file.filename,
    uploadedAt: new Date().toISOString(),
  };

  all.push(newAsset);
  saveConfig(all);

  return res.json({ success: true, asset: newAsset });
});

// ─── PUT /api/site-assets/:id — update metadata ───
router.put('/:id', (req: Request, res: Response): any => {
  const { id } = req.params;
  const { tileName } = req.body;

  const all = loadConfig();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Asset not found.' });
  }

  all[idx] = { ...all[idx], tileName: tileName || all[idx].tileName };
  saveConfig(all);

  res.json({ success: true, asset: all[idx] });
});

// ─── DELETE /api/site-assets/:id — delete asset ───
router.delete('/:id', (req: Request, res: Response): any => {
  const { id } = req.params;
  const all = loadConfig();
  const idx = all.findIndex((a) => a.id === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Asset not found.' });
  }

  const asset = all[idx];
  const filePath = path.join(ASSETS_DIR, asset.section, asset.fileName);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
  }

  all.splice(idx, 1);
  saveConfig(all);

  res.json({ success: true });
});

export default router;
