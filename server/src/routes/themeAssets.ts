import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const router = Router();

const ASSETS_DIR = path.join(__dirname, '../../../client/public/theme_assets');
const CONFIG_FILE = path.join(__dirname, '../../data/theme_assets_config.json');

// Ensure directories exist
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}
const DATA_DIR = path.dirname(CONFIG_FILE);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

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

// Default initial slides if config file does not exist
const DEFAULT_SLIDES: ThemeAssetSlide[] = [
  {
    id: 'slide-1',
    filename: 'christian-wiediger-WkfDrhxDMC8-unsplash.jpg',
    url: '/theme_assets/christian-wiediger-WkfDrhxDMC8-unsplash.jpg',
    mediaType: 'image',
    badge: '1. LIVE AI INTERVIEW STAGE',
    title: 'Practice Realistic AI Interviews With',
    highlightText: 'Real-Time Avatar Feedback',
    subtitle: 'Simulate technical, HR, and behavioral interviews with 3D avatars, dynamic voice scoring, instant transcript analytics, and downloadable performance reports.',
    primaryCtaText: 'Launch Live Interview',
    primaryCtaLink: '/tools/live-interview',
    secondaryCtaText: 'Explore All Tools',
    secondaryCtaLink: '/tools/i-assist',
    enabled: true,
    order: 1,
  },
  {
    id: 'slide-2',
    filename: 'glenn-carstens-peters-P1qyEf1g0HU-unsplash.jpg',
    url: '/theme_assets/glenn-carstens-peters-P1qyEf1g0HU-unsplash.jpg',
    mediaType: 'image',
    badge: '2. I-ASSIST AI COPILOT',
    title: 'Your Autonomous Career & Tech',
    highlightText: 'Study Assistant',
    subtitle: 'Ask technical questions, get instant step-by-step guidance, analyze system architecture diagrams, and accelerate your learning speed by 10x.',
    primaryCtaText: 'Open I-Assist',
    primaryCtaLink: '/tools/i-assist',
    secondaryCtaText: 'View Features',
    secondaryCtaLink: '/courses',
    enabled: true,
    order: 2,
  },
  {
    id: 'slide-3',
    filename: 'hugo-rocha-qFpnvZ_j9HU-unsplash.jpg',
    url: '/theme_assets/hugo-rocha-qFpnvZ_j9HU-unsplash.jpg',
    mediaType: 'image',
    badge: '3. SMART CAREER TOOLKIT',
    title: 'Craft 100% ATS-Compliant Resumes That Get',
    highlightText: 'Recruiter Callbacks',
    subtitle: 'Live A4 WYSIWYG editor with inline AI bullet rewriter, keyword gap audit, and job description tailoring built for modern tech hiring.',
    primaryCtaText: 'Build AI Resume',
    primaryCtaLink: '/dashboard/student/tools/resume-builder',
    secondaryCtaText: 'Check ATS Score',
    secondaryCtaLink: '/dashboard/student/tools/ats-checker',
    enabled: true,
    order: 3,
  },
  {
    id: 'slide-4',
    filename: 'daoud-abismail-gbxI8Wi4ZkQ-unsplash.jpg',
    url: '/theme_assets/daoud-abismail-gbxI8Wi4ZkQ-unsplash.jpg',
    mediaType: 'image',
    badge: '4. AI MASTERCLASSES',
    title: 'Master Generative AI & Full-Stack',
    highlightText: 'Engineering Hands-On',
    subtitle: 'Project-based live interactive masterclasses taught by senior industry architects with real code reviews and production deployments.',
    primaryCtaText: 'Browse Courses',
    primaryCtaLink: '/courses',
    secondaryCtaText: 'Upcoming Batches',
    secondaryCtaLink: '/upcoming-batches',
    enabled: true,
    order: 4,
  },
  {
    id: 'slide-5',
    filename: 'amelie-mourichon-sv8oOQaUb-o-unsplash.jpg',
    url: '/theme_assets/amelie-mourichon-sv8oOQaUb-o-unsplash.jpg',
    mediaType: 'image',
    badge: '5. LINKEDIN OPTIMIZER',
    title: 'Transform Your LinkedIn Profile Into A',
    highlightText: 'Recruiter Magnet',
    subtitle: 'AI profile audit, headline generator, banner recommendations, and content strategy builder to maximize profile impressions.',
    primaryCtaText: 'Analyze Profile',
    primaryCtaLink: '/dashboard/student/tools/linkedin-analyser',
    secondaryCtaText: 'View Demo',
    secondaryCtaLink: '/tools/i-assist',
    enabled: true,
    order: 5,
  },
  {
    id: 'slide-6',
    filename: 'jeffery-ho-oITfawv6t-8-unsplash.jpg',
    url: '/theme_assets/jeffery-ho-oITfawv6t-8-unsplash.jpg',
    mediaType: 'image',
    badge: '6. REAL-WORLD INTERNSHIPS',
    title: 'Work On Enterprise Client Projects With',
    highlightText: 'Dedicated Mentorship',
    subtitle: 'Gain 6-month hands-on software development experience, collaborate with agile teams, and build a high-impact portfolio.',
    primaryCtaText: 'Apply For Internship',
    primaryCtaLink: '/internship',
    secondaryCtaText: 'Corporate Partners',
    secondaryCtaLink: '/corporate',
    enabled: true,
    order: 6,
  },
  {
    id: 'slide-7',
    filename: 'nasa-1lfI7wkGWZ4-unsplash.jpg',
    url: '/theme_assets/nasa-1lfI7wkGWZ4-unsplash.jpg',
    mediaType: 'image',
    badge: '7. INDUSTRY CERTIFICATIONS',
    title: 'Earn Globally Recognized Skills &',
    highlightText: 'Certified Credentials',
    subtitle: 'Verify your AI engineering, Full-Stack, and DevOps mastery with verifiable digital certificates backed by NxtGen Academy.',
    primaryCtaText: 'View Certifications',
    primaryCtaLink: '/certifications',
    secondaryCtaText: 'Inquire Now',
    secondaryCtaLink: '/corporate',
    enabled: true,
    order: 7,
  },
];

// Helper to read and sync config file with actual files in theme_assets dir
function loadAndSyncSlides(): ThemeAssetSlide[] {
  let storedSlides: ThemeAssetSlide[] = [];
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
      storedSlides = JSON.parse(raw);
    } catch (e) {
      storedSlides = DEFAULT_SLIDES;
    }
  } else {
    storedSlides = DEFAULT_SLIDES;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(storedSlides, null, 2), 'utf-8');
  }

  // Scan disk directory for all image & video files
  let diskFiles: string[] = [];
  try {
    diskFiles = fs.readdirSync(ASSETS_DIR);
  } catch (err) {
    diskFiles = [];
  }

  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm'];
  const mediaFiles = diskFiles.filter(f => validExtensions.includes(path.extname(f).toLowerCase()));

  // Add any new disk files not yet in config
  let updated = false;
  mediaFiles.forEach((filename) => {
    const exists = storedSlides.some(s => s.filename === filename);
    if (!exists) {
      const ext = path.extname(filename).toLowerCase();
      const mediaType: 'image' | 'video' = ['.mp4', '.webm'].includes(ext) ? 'video' : 'image';
      const newSlide: ThemeAssetSlide = {
        id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        filename,
        url: `/theme_assets/${filename}`,
        mediaType,
        badge: '',
        title: '',
        highlightText: '',
        subtitle: '',
        primaryCtaText: '',
        primaryCtaLink: '',
        secondaryCtaText: '',
        secondaryCtaLink: '',
        enabled: true,
        order: storedSlides.length + 1,
      };
      storedSlides.push(newSlide);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(storedSlides, null, 2), 'utf-8');
  }

  return storedSlides;
}

// Multer storage engine for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, ASSETS_DIR);
  },
  filename: (_req, file, cb) => {
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${Date.now()}-${cleanName}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for video files
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm'];
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// GET /api/theme-assets - Get all available hero slides / assets
router.get('/', (_req: Request, res: Response) => {
  const slides = loadAndSyncSlides();
  res.json({ success: true, slides });
});

// POST /api/theme-assets/upload - Upload new image or video asset
router.post('/upload', upload.single('asset'), (req: Request, res: Response): any => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded or invalid file type' });
  }

  const filename = req.file.filename;
  const ext = path.extname(filename).toLowerCase();
  const mediaType: 'image' | 'video' = ['.mp4', '.webm'].includes(ext) ? 'video' : 'image';

  const slides = loadAndSyncSlides();
  const newSlide: ThemeAssetSlide = {
    id: `slide-${Date.now()}`,
    filename,
    url: `/theme_assets/${filename}`,
    mediaType,
    badge: req.body.badge || '',
    title: req.body.title || '',
    highlightText: req.body.highlightText || '',
    subtitle: req.body.subtitle || '',
    primaryCtaText: req.body.primaryCtaText || '',
    primaryCtaLink: req.body.primaryCtaLink || '',
    secondaryCtaText: req.body.secondaryCtaText || '',
    secondaryCtaLink: req.body.secondaryCtaLink || '',
    enabled: true,
    order: slides.length + 1,
  };

  slides.push(newSlide);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(slides, null, 2), 'utf-8');

  return res.json({ success: true, slide: newSlide, slides });
});

// PUT /api/theme-assets/config - Update overlay text configuration for all or single asset
router.put('/config', (req: Request, res: Response) => {
  const { slides } = req.body;
  if (!Array.isArray(slides)) {
    return res.status(400).json({ success: false, message: 'Invalid payload, array of slides expected' });
  }

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(slides, null, 2), 'utf-8');
  res.json({ success: true, slides });
});

// DELETE /api/theme-assets/:filename - Delete asset file and record
router.delete('/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename as string;
  let slides = loadAndSyncSlides();

  slides = slides.filter(s => s.filename !== filename);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(slides, null, 2), 'utf-8');

  const filePath = path.join(ASSETS_DIR, filename);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.error('Failed to delete asset file:', e);
    }
  }

  res.json({ success: true, slides });
});

export default router;
