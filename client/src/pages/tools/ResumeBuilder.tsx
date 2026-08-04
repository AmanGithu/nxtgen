import React, { useState, useEffect, useRef, useTransition, useMemo, Fragment, useLayoutEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import ResumeDoc from "../../components/resume/ResumeDoc";
import ScoreRing from "../../components/resume/ScoreRing";
import TemplateThumb from "../../components/resume/TemplateThumb";
import { sanitizeResumeData, resolveSectionOrder, clampFontScale, FONT_SCALE_MIN, FONT_SCALE_MAX, FONT_SCALE_STEP, type ResumeData, type ResumeVariant } from "../../lib/resume/resumeData";
import { TEMPLATES, type TemplateMeta } from "../../lib/resume/templates";
import { injectKeyword } from "../../lib/resume/tailor";
import { entitlementsFor } from "../../lib/entitlements";
import { saveGuestResume, readGuestResume, guestHeaders } from "../../lib/guestStore";
import SignInGate from "../../components/SignInGate";
import { useUpgrade } from "../../context/UpgradeContext";
import {
  scoreReadiness,
  scoreResume,
  extractKeywords,
  sectionCoverage,
  GENERIC_JD,
  type JdKeyword
} from "../../lib/resume/ats";
import {
  Upload,
  Plus,
  Trash2,
  Sparkles,
  ChevronDown,
  FileDown,
  ArrowLeft,
  X,
  FileText,
  AlertTriangle,
  Sliders,
  Award,
  BookOpen,
  Briefcase,
  Layers,
  GraduationCap,
  PlusCircle,
  Eye,
  Check,
  TrendingUp,
  Link2,
  ChevronRight,
  Minus
} from "lucide-react";

import "../../styles/resume/editor.css";
import "../../styles/resume/resume-templates.css";
import "../../styles/resume/dashboard.css";
import "../../styles/resume/linkedin-import.css";
// PAVY theme layer for editor.css — must load after it
import "../../styles/resume/resume-workspace.css";
// NxtGen dark palette — must load last so it wins the token cascade
import "../../styles/resume/nxtgen-theme.css";

const BLANK_RESUME: ResumeData = {
  name: "",
  target: "",
  contact: [""],
  summary: "",
  experience: [{ role: "", company: "", location: "", meta: "", bullets: [""] }],
  skills: [["", ""]],
  education: [{ degree: "", school: "", meta: "" }],
  projects: [],
  certifications: [],
  custom: [],
  sectionOrder: ["summary", "experience", "projects", "skills", "education", "certifications"]
};

interface ResumeRecord {
  id: string;
  title: string;
  template: string;
  updatedAt: string;
  variants: {
    id: string;
    role: string;
    company: string;
    ats: number;
    template: string;
    updatedAt: string;
  }[];
}

const AI_LABELS: ["stronger" | "shorter" | "metric", string][] = [
  ["stronger", "Make stronger"],
  ["shorter", "Shorten"],
  ["metric", "Add metric"]
];

const ZOOMS = [0.75, 0.9, 1, 1.15, 1.3];

/* The right dock's three tools. They open in place over the preview —
   none of them navigate away from the editor. */
type DockSection = "template" | "ats" | "tailor" | null;

function AutoTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const ta = ref.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    }
  });
  return (
    <textarea
      ref={ref}
      className="w-full bg-bg-card border border-line rounded-xl p-3 text-xs font-semibold focus:outline-none focus:border-line-strong text-strong resize-none"
      rows={2}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Score bands drive the chip colour: red < 50, amber < 75, green above. */
const atsBand = (score: number) => (score >= 75 ? "good" : score >= 50 ? "mid" : "low");

export default function ResumeBuilder() {
  const { token, user } = useAuth(false);
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  // Active workspace state
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  /* Signed-out visitors get the full editor; save/export are the gates. */
  const ent = entitlementsFor(!!token, (user as any)?.plan, (user as any)?.role);
  const isGuest = ent.tier === "guest";
  const [gate, setGate] = useState<null | "save" | "export" | "premium-template" | "extra-resume">(null);
  const { promptUpgrade } = useUpgrade();
  const navigate = useNavigate();
  const [activeVersionId, setActiveVersionId] = useState<string | null>(null);

  // Editor states
  const [editorTitle, setEditorTitle] = useState("");
  const [editorData, setEditorData] = useState<ResumeData>(BLANK_RESUME);
  const [editorTemplate, setEditorTemplate] = useState<ResumeVariant>("modern");
  const [editorTab, setEditorTab] = useState<"preview" | "ats">("preview");

  // VAD & ATS controls
  const [atsJd, setAtsJd] = useState("");
  // accept/reject decisions, keyed by suggestion id (the list itself is derived)
  const [sugStatus, setSugStatus] = useState<Record<string, "accepted" | "rejected" | undefined>>({});

  // Sub-dialogs
  const [linkedinOpen, setLinkedinOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const sourceRef = useRef<"upload" | "linkedin">("upload");

  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [newSectionError, setNewSectionError] = useState("");

  const [renameItem, setRenameItem] = useState<{ id: string; title: string } | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  // UI state
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "dirty">("saved");

  // Sidebar navigation helpers
  const [navActive, setNavActive] = useState("contact");
  const [exportMenu, setExportMenu] = useState(false);

  // Accordion open/closed state per editor section (experience starts open)
  const [openSecs, setOpenSecs] = useState<Record<string, boolean>>({ contact: true, experience: true });
  /* Preview zoom. The A4 page renders at a fixed 660px (ResumeDoc measures
     pagination at that width), which is wider than the preview column — so
     the default is "fit to width" and the ± buttons switch to a manual step.
     zoomIdx === null means fit. */
  const [zoomIdx, setZoomIdx] = useState<number | null>(null);
  const [fitScale, setFitScale] = useState(1);
  const previewRef = useRef<HTMLElement>(null);
  const [pageCount, setPageCount] = useState(1);
  // Right dock: which section is expanded over the preview (null = rail only)
  const [dockOpen, setDockOpen] = useState<DockSection>(null);
  // Pro-template gate: set to the attempted template when a free user taps a Pro one
  const [proGate, setProGate] = useState<TemplateMeta | null>(null);
  // scroll container for the editor column, so nav jumps scroll it (not the page)
  const editorRef = useRef<HTMLElement>(null);

  // Select Bullet for AI rewrite
  const [sel, setSel] = useState<{ ei: number; bi: number }>({ ei: -1, bi: -1 });
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiVariant, setAiVariant] = useState<"stronger" | "shorter" | "metric">("stronger");

  const toast = (msg: string) => {
    setToastMsg(msg);
    setToastShow(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShow(false), 2400);
  };

  useEffect(() => {
    // autoOpen: a returning guest continues where they left off rather than
    // staring at an empty deck. "Back" calls this without the flag.
    fetchResumes(!token);
  }, [token]);

  const fetchResumes = async (autoOpen = false) => {
    // Guests have no server-side résumés — surface whatever is in the browser
    // as a card on the deck. Only open the editor on first load; calling this
    // from "back" must not bounce them straight back in.
    if (!token) {
      const stored = readGuestResume();
      if (stored) {
        setResumes([{ id: "guest", title: stored.title, template: stored.template, updatedAt: stored.updatedAt, variants: [] } as any]);
        if (autoOpen) {
          setEditorData(sanitizeResumeData(stored.data));
          setEditorTemplate(stored.template as ResumeVariant);
          setEditorTitle(stored.title);
          setActiveResumeId("guest");
        }
      } else {
        setResumes([]);
      }
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/resumes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResumes(data || []);
      }
    } catch (err) {
      console.error(err);
      toast("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const loadResumeData = async (resumeId: string, versionId?: string) => {
    setLoading(true);
    try {
      const url = versionId
        ? `/api/resumes/${resumeId}/versions/${versionId}`
        : `/api/resumes/${resumeId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const payload = await res.json();
        const baseResume = resumes.find(r => r.id === resumeId);
        setEditorTitle(baseResume?.title || "Untitled Resume");
        const clean = sanitizeResumeData(payload.data || payload);
        setEditorData(clean);
        setEditorTemplate(payload.template || "modern");
        if (payload.jd) {
          setAtsJd(payload.jd);
          localStorage.setItem("atsJd", payload.jd);
        }
        setSaveStatus("saved");
      }
    } catch (err) {
      console.error(err);
      toast("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditor = (resumeId: string, versionId?: string) => {
    setActiveResumeId(resumeId);
    setActiveVersionId(versionId || null);
    loadResumeData(resumeId, versionId);
  };

  const mutateData = (fn: (d: ResumeData) => void) => {
    setEditorData((prev) => {
      const clone = JSON.parse(JSON.stringify(prev));
      fn(clone);
      setSaveStatus("dirty");
      autoSaveDebounce(clone, editorTemplate);
      return clone;
    });
  };

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveDebounce = (data: ResumeData, template: string) => {
    setSaveStatus("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDraft(data, template);
    }, 1500);
  };

  const saveDraft = async (data: ResumeData, template: string): Promise<boolean> => {
    // Guest work is kept in the browser. It moves to the account on sign-in.
    if (!token) {
      saveGuestResume(data, template, editorTitle || "My résumé");
      setSaveStatus("saved");
      return false; // kept locally, not persisted to an account
    }
    if (!activeResumeId) return false;
    setSaveStatus("saving");
    try {
      const url = activeVersionId
        ? `/api/resumes/${activeResumeId}/versions/${activeVersionId}`
        : `/api/resumes/${activeResumeId}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          data,
          template,
          jd: atsJd
        })
      });
      if (res.ok) {
        setSaveStatus("saved");
        return true;
      }
      setSaveStatus("dirty");
      return false;
    } catch (err) {
      console.error(err);
      setSaveStatus("dirty");
      return false;
    }
  };

  // Sync VAD / ATS text back to cover-letter
  useEffect(() => {
    if (atsJd) {
      localStorage.setItem("atsJd", atsJd);
    }
  }, [atsJd]);

  const handleCreateNew = async () => {
    // Guests start a blank résumé in the browser — no account needed to begin.
    if (!token) {
      const blank = sanitizeResumeData(BLANK_RESUME);
      setEditorData(blank);
      setEditorTemplate("modern" as ResumeVariant);
      setEditorTitle("My résumé");
      setActiveResumeId("guest");
      saveGuestResume(blank, "modern", "My résumé");
      toast("Blank résumé started ✦");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: `Resume ${resumes.length + 1}`,
          template: "modern",
          data: BLANK_RESUME
        })
      });
      if (res.ok) {
        const saved = await res.json();
        toast("Blank resume created ✦");
        fetchResumes().then(() => {
          handleOpenEditor(saved.id);
        });
      }
    } catch (err) {
      console.error(err);
      toast("Creation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const source = sourceRef.current;
    
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const resultStr = reader.result as string;
          const fileBase64 = resultStr.split(",")[1];
          if (!token) {
            // Stateless parse — nothing is stored server-side for guests.
            const res = await fetch("/api/guest/import", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...guestHeaders() },
              body: JSON.stringify({ fileBase64, fileName: file.name, mimeType: file.type })
            });
            const payload = await res.json().catch(() => ({}));
            if (res.ok && payload.data) {
              const clean = sanitizeResumeData(payload.data);
              setEditorData(clean);
              setEditorTemplate("modern" as ResumeVariant);
              setEditorTitle(file.name.replace(/\.[^.]+$/, ""));
              setActiveResumeId("guest");
              saveGuestResume(clean, "modern", file.name.replace(/\.[^.]+$/, ""));
              toast("Imported — sign in to save it ✦");
            } else {
              toast(payload.message || "Import failed: unreadable file");
            }
            setLoading(false);
            return;
          }
          const res = await fetch("/api/resumes/import", {
            method: "POST",
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              fileBase64,
              fileName: file.name,
              mimeType: file.type,
              source
            })
          });
          if (res.ok) {
            const created = await res.json();
            toast(`Imported successfully via ${source.toUpperCase()} ✦`);
            setLinkedinOpen(false);
            // Refresh the deck first so the editor can resolve the new title,
            // then open via handleOpenEditor — it also fetches the parsed data.
            // Setting activeResumeId alone mounts the editor on BLANK_RESUME.
            await fetchResumes();
            if (created?.id) handleOpenEditor(created.id);
          } else {
            const errorMsg = await res.text();
            toast(`Import failed: ${errorMsg || "Invalid PDF format"}`);
          }
        } catch (err) {
          console.error(err);
          toast("Failed to process file import");
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        toast("Error reading local file");
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      toast("Parsing engine offline");
      setLoading(false);
    } finally {
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const source = sourceRef.current;
      setLoading(true);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const resultStr = reader.result as string;
          const fileBase64 = resultStr.split(",")[1];
          if (!token) {
            // Stateless parse — nothing is stored server-side for guests.
            const res = await fetch("/api/guest/import", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...guestHeaders() },
              body: JSON.stringify({ fileBase64, fileName: file.name, mimeType: file.type })
            });
            const payload = await res.json().catch(() => ({}));
            if (res.ok && payload.data) {
              const clean = sanitizeResumeData(payload.data);
              setEditorData(clean);
              setEditorTemplate("modern" as ResumeVariant);
              setEditorTitle(file.name.replace(/\.[^.]+$/, ""));
              setActiveResumeId("guest");
              saveGuestResume(clean, "modern", file.name.replace(/\.[^.]+$/, ""));
              toast("Imported — sign in to save it ✦");
            } else {
              toast(payload.message || "Import failed: unreadable file");
            }
            setLoading(false);
            return;
          }
          const res = await fetch("/api/resumes/import", {
            method: "POST",
            headers: { 
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              fileBase64,
              fileName: file.name,
              mimeType: file.type,
              source
            })
          });
          if (res.ok) {
            const created = await res.json();
            toast("Drag-drop import succeeded ✦");
            setLinkedinOpen(false);
            await fetchResumes();
            if (created?.id) handleOpenEditor(created.id);
          } else {
            toast("Drag-drop parse error");
          }
        } catch (err) {
          console.error(err);
          toast("Failed to process drag-dropped file");
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        toast("Error reading dropped file");
        setLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this profile?")) return;
    try {
      const res = await fetch(`/api/resumes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast("Profile deleted");
        fetchResumes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/resumes/${id}/duplicate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast("Profile duplicated successfully ✦");
        fetchResumes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRenameSave = async () => {
    if (!renameItem || !renameItem.title.trim()) return;
    try {
      const res = await fetch(`/api/resumes/${renameItem.id}/rename`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ title: renameItem.title })
      });
      if (res.ok) {
        toast("Renamed successfully");
        setRenameItem(null);
        fetchResumes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async (type: "pdf" | "docx") => {
    if (!ent.canExport) {
      setGate("export");
      return;
    }
    if (!activeResumeId) return;
    toast(`Generating print-ready ${type.toUpperCase()}...`);
    setExportMenu(false);
    try {
      await saveDraft(editorData, editorTemplate);
      const url = activeVersionId
        ? `/api/resumes/${activeResumeId}/versions/${activeVersionId}/export/${type}`
        : `/api/resumes/${activeResumeId}/export/${type}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `${editorTitle.replace(/\s+/g, "_")}.${type}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(downloadUrl);
        toast("Download ready!");
        return;
      }

      /* This is a plain fetch, so it bypasses the axios interceptor that
         normally turns a plan limit into the upgrade prompt — read the body
         and raise it here. Hitting a limit is an expected step in the funnel;
         reporting it as a failed export made the product look broken. */
      const body = await res.json().catch(() => null);
      if (res.status === 402 && body?.code === "LIMIT_REACHED") {
        promptUpgrade(body);
        return;
      }
      toast(body?.message || "Couldn't create the file. Please try again.");
    } catch (err) {
      console.error(err);
      toast("Couldn't reach the server. Check your connection and try again.");
    }
  };

  const handleSelectBulletForAi = async (jobIdx: number, bulletIdx: number) => {
    setSel({ ei: jobIdx, bi: bulletIdx });
    setAiText("");
    const bulletText = editorData.experience[jobIdx].bullets[bulletIdx];
    if (bulletText.trim()) {
      triggerAiRewrite(aiVariant, bulletText);
    }
  };

  /* Resume AI lives under the résumé it belongs to:
     POST /api/resumes/:id/ai/rewrite-bullet  { bullet, tone } -> { text, usage } */
  const triggerAiRewrite = async (tone: string, text: string) => {
    if (!text.trim() || !activeResumeId) return;
    setAiLoading(true);
    try {
      const res = await fetch(
        token ? `/api/resumes/${activeResumeId}/ai/rewrite-bullet` : `/api/guest/ai/rewrite-bullet`,
        {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : guestHeaders()),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ bullet: text, tone })
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 402) {
        // Free allowance spent — ask them to sign in rather than showing a
        // dead-end error inside the rewrite popover.
        setGate("save");
        setAiText("");
        return;
      }
      if (res.ok && data.text) {
        setAiText(data.text);
      } else {
        setAiText(data.message || "Failed to rewrite bullet. Try again.");
      }
    } catch (err) {
      console.error(err);
      setAiText("Rewrite engine currently offline.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiToneSelection = (tone: "stronger" | "shorter" | "metric") => {
    setAiVariant(tone);
    const bulletText = editorData.experience[sel.ei].bullets[sel.bi];
    triggerAiRewrite(tone, bulletText);
  };

  const handleApplyAiBullet = () => {
    if (sel.ei !== -1 && sel.bi !== -1 && aiText) {
      mutateData((d) => {
        d.experience[sel.ei].bullets[sel.bi] = aiText;
      });
      setSel({ ei: -1, bi: -1 });
      setAiText("");
      toast("AI rewrite applied");
    }
  };

  /* POST /api/resumes/:id/ai/generate-summary  { resume, jd } -> { text, usage } */
  const handleGenerateSummary = async () => {
    if (!activeResumeId) return;
    setLoading(true);
    toast("Generating summary…");
    try {
      const res = await fetch(
        token ? `/api/resumes/${activeResumeId}/ai/generate-summary` : `/api/guest/ai/summary`,
        {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ resume: editorData, jd: atsJd || undefined })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.text) {
        mutateData((d) => { d.summary = data.text; });
        toast("Professional summary created ✦");
      } else {
        toast(data.message || "Could not generate summary");
      }
    } catch (err) {
      console.error(err);
      toast("AI summary error");
    } finally {
      setLoading(false);
    }
  };

  /* Keep the fit-to-width scale in sync with the preview column, which
     changes when the sidebar collapses or the window resizes. */
  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const measure = () => {
      /* Measure the flex-sized .preview column, NOT the inner scroller:
         the scroller's clientWidth shrinks when a scrollbar appears, and
         since the scale we set decides whether it appears, measuring it
         feeds back into itself and loops. 48px padding + scrollbar room. */
      const avail = el.clientWidth - 66;
      const next = Math.max(0.4, Math.min(1.3, avail / 660));
      // quantise so sub-pixel jitter can't ping-pong the value
      setFitScale((prev) => (Math.abs(prev - next) < 0.01 ? prev : Math.round(next * 100) / 100));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeResumeId]);

  const previewScale = zoomIdx === null ? fitScale : ZOOMS[zoomIdx];

  const stepZoom = (dir: 1 | -1) =>
    setZoomIdx((cur) => {
      // stepping out of fit mode starts from whichever preset is closest to it
      const base =
        cur ??
        ZOOMS.reduce((best, z, i) => (Math.abs(z - fitScale) < Math.abs(ZOOMS[best] - fitScale) ? i : best), 0);
      return Math.max(0, Math.min(ZOOMS.length - 1, base + dir));
    });

  // Pro plan unlocks premium templates; superadmin always has access.
  const isProUser = user?.plan === "pro" || user?.role === "superadmin";

  /* Apply a template — but gate premium ones behind the plan popup for free
     users so they can preview the layout thumbnail yet not select/export it. */
  const chooseTemplate = (t: TemplateMeta) => {
    if (t.premium && !ent.canUsePremiumTemplates) {
      setGate("premium-template");
      return;
    }
    if (t.premium && !isProUser) {
      setProGate(t);
      return;
    }
    setEditorTemplate(t.id);
    saveDraft(editorData, t.id);
  };

  // Résumé-wide text size (persists in the data, so exports match the preview)
  const fontScale = editorData.fontScale ?? 1;
  const setFontScale = (next: number) =>
    mutateData((d) => { d.fontScale = clampFontScale(next); });

  const toggleSec = (id: string) =>
    setOpenSecs((prev) => ({ ...prev, [id]: !prev[id] }));

  /* Jump to a section: mark it active, expand it, then scroll the editor
     column (not the window) to it once the expansion has been painted. */
  const handleNavJump = (id: string) => {
    setNavActive(id);
    setOpenSecs((prev) => ({ ...prev, [id]: true }));
    requestAnimationFrame(() => {
      const el = document.getElementById(`sec-${id}`);
      if (el && editorRef.current) {
        editorRef.current.scrollTo({ top: el.offsetTop - 14, behavior: "smooth" });
      }
    });
  };

  const handleCreateCustomSection = () => {
    const title = newSectionTitle.trim();
    if (!title) return;
    const exists = editorData.custom?.some((c) => c.title.toLowerCase() === title.toLowerCase()) || 
                   editorData.sectionOrder?.includes(title.toLowerCase());
    if (exists) {
      setNewSectionError("A section with this name already exists");
      return;
    }
    const cleanId = title.toLowerCase().replace(/[^a-z0-9]/g, "-");
    mutateData((d) => {
      if (!d.custom) d.custom = [];
      d.custom.push({ id: cleanId, title, items: [""] });
      if (!d.sectionOrder) d.sectionOrder = [];
      d.sectionOrder.push(`custom:${cleanId}`);
    });
    setNewSectionTitle("");
    setNewSectionError("");
    setAddSectionOpen(false);
    toast(`Custom section "${title}" added`);
  };

  const handleRestoreSection = (key: string) => {
    mutateData((d) => {
      if (!d.sectionOrder) d.sectionOrder = [];
      if (!d.sectionOrder.includes(key)) {
        d.sectionOrder.push(key);
      }
    });
    toast("Section added back");
  };

  const readiness = scoreReadiness(editorData);
  const bodySections = resolveSectionOrder(editorData);
  const activeSectionKeys = ["contact", ...bodySections];

  /* ---------- ATS scoring ----------
     Keywords from the pasted job description. Empty when none is pasted —
     tailoring suggestions only make sense against a real posting. */
  const atsKeywords = useMemo(() => (atsJd.trim() ? extractKeywords(atsJd) : []), [atsJd]);

  /* The ATS score always has a concrete target: the pasted job description,
     or a generic role profile when there isn't one. */
  const usingGenericJd = atsKeywords.length === 0;
  const scoreKeywords = useMemo(
    () => (usingGenericJd ? extractKeywords(GENERIC_JD) : atsKeywords),
    [usingGenericJd, atsKeywords]
  );

  /* Scope: with no job description pasted we score summary + experience only —
     a keyword listed in a skills block isn't the same as one evidenced in a
     role. Once a real description is pasted we score the whole résumé, which
     is what a recruiter's ATS actually ingests. */
  const atsAnalysis = useMemo(
    () => scoreResume(editorData, scoreKeywords, usingGenericJd ? "core" : "all"),
    [editorData, scoreKeywords, usingGenericJd]
  );
  const atsCoverage = useMemo(
    () => sectionCoverage(editorData, scoreKeywords),
    [editorData, scoreKeywords]
  );

  /* Compliance suggestions (pasted JD only).

     DERIVED, not stored. Holding these in state and refreshing them from an
     effect meant every JD keystroke ran render → effect → setState → render;
     typing quickly chained enough nested updates to trip React's depth limit.
     Only the user's accept/reject decisions are state; the list itself is a
     pure function of the missing keywords.

     A pasted description scores the whole résumé, so a skills injection moves
     the score too — hence all three targets. */
  const atsSuggestions = useMemo(() => {
    if (usingGenericJd) return [];
    const sections = ["skills", "experience", "summary"];
    return atsAnalysis.missing.map((keyword, i) => {
      const sec = sections[i % sections.length];
      const id = `${keyword.label}-${i}`;
      return {
        id,
        keyword: keyword.label,
        section: sec,
        text:
          sec === "skills"
            ? `Inject "${keyword.label}" into your Core Skills group (+12% match rank)`
            : sec === "experience"
            ? `Mention target keyword "${keyword.label}" inside your job bullet highlights (+10% match rank)`
            : `Add profile context containing "${keyword.label}" to professional summary (+8% match rank)`,
        status: sugStatus[id] ?? "pending"
      };
    });
  }, [usingGenericJd, atsAnalysis.missing, sugStatus]);

  // inject a single keyword into the target section (shared by accept + accept-all)
  const handleAcceptSuggestion = (id: string, keyword: string, section: string) => {
    mutateData((d) => injectKeyword(d, keyword, section));
    setSugStatus((prev) => ({ ...prev, [id]: "accepted" }));
    toast(`Injected keyword "${keyword}" ✦`);
  };

  // accept every currently-shown pending suggestion in one pass
  const handleAcceptAll = (list: { id: string; keyword: string; section: string }[]) => {
    if (!list.length) return;
    mutateData((d) => list.forEach((s) => injectKeyword(d, s.keyword, s.section)));
    setSugStatus((prev) => {
      const next = { ...prev };
      for (const s of list) next[s.id] = "accepted";
      return next;
    });
    toast(`Injected ${list.length} keyword${list.length === 1 ? "" : "s"} ✦`);
  };

  const handleRejectSuggestion = (id: string) => {
    setSugStatus((prev) => ({ ...prev, [id]: "rejected" }));
  };

  // Color theme variables based on score
  const getScoreColorClass = (score: number) => {
    if (score < 70) return "text-red-750 border-red-400 bg-red-50";
    if (score <= 85) return "text-amber-700 border-amber-400 bg-amber-50";
    return "text-green-700 border-green-450 bg-green-50";
  };

  const getSuggestionsToRender = (score: number) => {
    const list = atsSuggestions.filter(s => s.status === "pending");
    if (score < 70) return list.slice(0, 3);
    if (score <= 85) return list.slice(0, 2);
    return list;
  };

  /* One-line previews shown on each collapsed section header, so the
     accordion still tells you what's inside without opening it. */
  const clip = (s: string, n = 46) => (s.length > n ? s.slice(0, n) + "…" : s);
  const SEC_SUMMARY: Record<string, string> = {
    contact: [editorData.name, editorData.contact[0]].filter(Boolean).join(" · ") || "Add your contact details",
    summary: editorData.summary ? clip(editorData.summary) : "Add a professional summary",
    experience: editorData.experience.length
      ? `${editorData.experience.length} role${editorData.experience.length === 1 ? "" : "s"} · ${
          editorData.experience.map((e) => e.company).filter(Boolean).join(", ") || "untitled"
        }`
      : "Add your experience",
    education: editorData.education[0]?.degree
      ? `${editorData.education[0].degree}${editorData.education[0].school ? ` · ${editorData.education[0].school}` : ""}`
      : "Add your education",
    skills: clip(editorData.skills.map(([, v]) => v).filter(Boolean).join(", ")) || "Add your skills",
    projects: (editorData.projects || []).length
      ? `${editorData.projects!.length} project${editorData.projects!.length === 1 ? "" : "s"}`
      : "Optional — showcase side work",
    certifications: (editorData.certifications || []).length
      ? `${editorData.certifications!.length} credential${editorData.certifications!.length === 1 ? "" : "s"}`
      : "Optional — licenses & credentials"
  };

  const NAV_ITEMS = [
    { id: "contact", label: "Contact", icon: <Sliders className="w-4 h-4" /> },
    ...bodySections.map((key) => {
      let label = key.toUpperCase();
      let icon = <Layers className="w-4 h-4" />;
      if (key === "summary") { label = "Summary"; icon = <FileText className="w-4 h-4" />; }
      else if (key === "experience") { label = "Experience"; icon = <Briefcase className="w-4 h-4" />; }
      else if (key === "education") { label = "Education"; icon = <GraduationCap className="w-4 h-4" />; }
      else if (key === "skills") { label = "Skills"; icon = <Sliders className="w-4 h-4" />; }
      else if (key === "projects") { label = "Projects"; icon = <BookOpen className="w-4 h-4" />; }
      else if (key === "certifications") { label = "Certifications"; icon = <Award className="w-4 h-4" />; }
      else if (key.startsWith("custom:")) {
        const id = key.replace("custom:", "");
        const customSec = editorData.custom?.find((c) => c.id === id);
        label = customSec?.title || "Custom Section";
        icon = <Layers className="w-4 h-4" />;
      }
      return { id: key, label, icon };
    })
  ];

  /* A collapsible editor section. Written as a plain function (not a
     component rendered via <Jsx/>) so its inputs keep focus between
     keystrokes instead of remounting on every parent render. */
  const renderSec = (opts: {
    id: string;
    title: string;
    icon: React.ReactNode;
    trailing?: React.ReactNode;
    body: React.ReactNode;
  }) => (
    <div className={`sec${openSecs[opts.id] ? " open" : ""}`} id={`sec-${opts.id}`} key={opts.id}>
      <div className="sec__head" onClick={() => toggleSec(opts.id)}>
        <ChevronRight className="sec__chev" />
        <span className="sec__ic">{opts.icon}</span>
        <div className="sec__titles">
          <div className="sec__title">{opts.title}</div>
          <div className="sec__sum">{SEC_SUMMARY[opts.id] ?? ""}</div>
        </div>
        {opts.trailing}
      </div>
      <div className="sec__body">{opts.body}</div>
    </div>
  );

  const rowStyle: React.CSSProperties = { display: "flex", gap: 8, alignItems: "center" };
  const mt3: React.CSSProperties = { marginTop: "var(--space-3)" };

  /* Body sections, keyed so they can be rendered in the user's chosen order. */
  const SEC_NODES: Record<string, React.ReactNode> = {
    summary: renderSec({
      id: "summary",
      title: "Summary",
      icon: <FileText />,
      trailing: (
        <button
          className="btn-ai"
          onClick={(e) => {
            e.stopPropagation();
            handleGenerateSummary();
          }}
        >
          <Sparkles /> Generate
        </button>
      ),
      body: (
        <div className="field">
          <textarea
            className="textarea"
            value={editorData.summary}
            onChange={(e) => mutateData((d) => { d.summary = e.target.value; })}
            placeholder="A 2–3 sentence professional summary…"
          />
        </div>
      )
    }),

    experience: renderSec({
      id: "experience",
      title: "Experience",
      icon: <Briefcase />,
      body: (
        <>
          {editorData.experience.map((job, idx) => (
            <div className={`exp${sel.ei === idx ? " editing" : ""}`} key={idx}>
              <div className="exp__head">
                <div className="t">
                  <div className="role">{job.role || "Untitled role"}</div>
                  <div className="co">{[job.company, job.meta].filter(Boolean).join(" · ")}</div>
                </div>
                {editorData.experience.length > 1 && (
                  <button
                    className="bullet__x"
                    aria-label="Remove role"
                    onClick={() => mutateData((d) => { d.experience.splice(idx, 1); })}
                  >
                    <Trash2 />
                  </button>
                )}
              </div>
              <div className="exp__body">
                <div className="field-grid">
                  <div className="field">
                    <label className="field__label">Job title</label>
                    <input className="input" value={job.role} onChange={(e) => mutateData((d) => { d.experience[idx].role = e.target.value; })} />
                  </div>
                  <div className="field">
                    <label className="field__label">Company</label>
                    <input className="input" value={job.company} onChange={(e) => mutateData((d) => { d.experience[idx].company = e.target.value; })} />
                  </div>
                  <div className="field">
                    <label className="field__label">Location</label>
                    <input className="input" value={job.location} onChange={(e) => mutateData((d) => { d.experience[idx].location = e.target.value; })} />
                  </div>
                  <div className="field">
                    <label className="field__label">Dates</label>
                    <input className="input" value={job.meta} placeholder="May 2022 — Present" onChange={(e) => mutateData((d) => { d.experience[idx].meta = e.target.value; })} />
                  </div>
                </div>

                <div>
                  <div className="bullets-label">
                    <label className="field__label">Highlights</label>
                    <span className="field__help">Click a highlight to rewrite with AI</span>
                  </div>
                  <div className="bullets">
                    {job.bullets.map((b, bIdx) => (
                      <Fragment key={bIdx}>
                        <div
                          className={`bullet${sel.ei === idx && sel.bi === bIdx ? " is-selected" : ""}`}
                          onClick={() => {
                            if (sel.ei !== idx || sel.bi !== bIdx) handleSelectBulletForAi(idx, bIdx);
                          }}
                        >
                          <AutoTextarea value={b} onChange={(v) => mutateData((d) => { d.experience[idx].bullets[bIdx] = v; })} />
                          {job.bullets.length > 1 && (
                            <button
                              className="bullet__x"
                              aria-label="Delete highlight"
                              onClick={(e) => {
                                e.stopPropagation();
                                mutateData((d) => { d.experience[idx].bullets.splice(bIdx, 1); });
                              }}
                            >
                              <Trash2 />
                            </button>
                          )}
                        </div>

                        {sel.ei === idx && sel.bi === bIdx && (
                          <div className="ai-bar" onClick={(e) => e.stopPropagation()}>
                            <div className="ai-bar__row">
                              <button className="ai-chip ai-chip--primary" onClick={() => triggerAiRewrite(aiVariant, b)}>
                                <Sparkles /> Rewrite
                              </button>
                              {AI_LABELS.map(([key, lbl]) => (
                                <button
                                  key={key}
                                  className={`ai-chip${aiVariant === key ? " is-active" : ""}`}
                                  onClick={() => handleAiToneSelection(key)}
                                >
                                  {lbl}
                                </button>
                              ))}
                            </div>
                            <div className="ai-suggestion">
                              <div className="ai-suggestion__top">
                                <span className="ai-suggestion__tag"><Sparkles /> AI suggestion</span>
                              </div>
                              <div className="ai-suggestion__text">
                                {aiLoading ? "Generating…" : aiText || "Type a highlight, then click Rewrite."}
                              </div>
                              <div className="ai-suggestion__acts">
                                <button className="btn btn--primary btn--sm" onClick={handleApplyAiBullet} disabled={aiLoading || !aiText}>
                                  Replace
                                </button>
                                <button className="btn btn--ghost btn--sm" onClick={() => triggerAiRewrite(aiVariant, b)}>
                                  Try again
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Fragment>
                    ))}
                  </div>
                  <button
                    className="btn btn--ghost btn--sm"
                    style={{ marginTop: 8 }}
                    onClick={() => mutateData((d) => { d.experience[idx].bullets.push(""); })}
                  >
                    <Plus /> Add highlight
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            className="btn btn--secondary btn--sm"
            style={{ width: "100%" }}
            onClick={() => mutateData((d) => { d.experience.push({ role: "", company: "", location: "", meta: "", bullets: [""] }); })}
          >
            <Plus /> Add experience
          </button>
        </>
      )
    }),

    projects: renderSec({
      id: "projects",
      title: "Projects",
      icon: <BookOpen />,
      body: (
        <>
          {(editorData.projects || []).map((proj, idx) => (
            <div className="exp" key={idx} style={{ padding: "var(--space-3)" }}>
              <div className="field-grid">
                <div className="field">
                  <label className="field__label">Project name</label>
                  <input className="input" value={proj.name} placeholder="Project or open-source work" onChange={(e) => mutateData((d) => { if (d.projects) d.projects[idx].name = e.target.value; })} />
                </div>
                <div className="field">
                  <label className="field__label">Tags / stack</label>
                  <input className="input" value={proj.meta || ""} placeholder="e.g. Next.js" onChange={(e) => mutateData((d) => { if (d.projects) d.projects[idx].meta = e.target.value; })} />
                </div>
              </div>
              <div className="field" style={mt3}>
                <label className="field__label">Highlights</label>
                <textarea
                  className="textarea"
                  style={{ minHeight: 72 }}
                  value={(proj.bullets || [""])[0]}
                  placeholder="Project achievements and details…"
                  onChange={(e) => mutateData((d) => { if (d.projects) d.projects[idx].bullets = [e.target.value]; })}
                />
              </div>
              <button className="btn btn--ghost btn--sm" style={{ marginTop: 10 }} onClick={() => mutateData((d) => { d.projects?.splice(idx, 1); })}>
                <Trash2 /> Remove project
              </button>
            </div>
          ))}
          <button
            className="btn btn--secondary btn--sm"
            style={{ width: "100%" }}
            onClick={() => mutateData((d) => { if (!d.projects) d.projects = []; d.projects.push({ name: "", meta: "", bullets: [""] }); })}
          >
            <Plus /> Add project
          </button>
        </>
      )
    }),

    education: renderSec({
      id: "education",
      title: "Education",
      icon: <GraduationCap />,
      body: (
        <>
          {editorData.education.map((edu, idx) => (
            <div className="exp" key={idx} style={{ padding: "var(--space-3)" }}>
              <div className="field-grid">
                <div className="field">
                  <label className="field__label">Degree</label>
                  <input className="input" value={edu.degree} onChange={(e) => mutateData((d) => { d.education[idx].degree = e.target.value; })} />
                </div>
                <div className="field">
                  <label className="field__label">Dates</label>
                  <input className="input" value={edu.meta} placeholder="2017 — 2021" onChange={(e) => mutateData((d) => { d.education[idx].meta = e.target.value; })} />
                </div>
              </div>
              <div className="field" style={mt3}>
                <label className="field__label">School</label>
                <div style={rowStyle}>
                  <input className="input" value={edu.school} onChange={(e) => mutateData((d) => { d.education[idx].school = e.target.value; })} />
                  {editorData.education.length > 1 && (
                    <button className="bullet__x" style={{ flex: "none" }} aria-label="Remove" onClick={() => mutateData((d) => { d.education.splice(idx, 1); })}>
                      <Trash2 />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <button className="btn btn--secondary btn--sm" style={{ width: "100%" }} onClick={() => mutateData((d) => { d.education.push({ degree: "", school: "", meta: "" }); })}>
            <Plus /> Add education
          </button>
        </>
      )
    }),

    skills: renderSec({
      id: "skills",
      title: "Skills",
      icon: <Sliders />,
      body: (
        <>
          {editorData.skills.map(([label, value], idx) => (
            <div className="field" key={idx} style={{ marginBottom: "var(--space-3)" }}>
              <div style={rowStyle}>
                <input className="input" style={{ flex: "0 0 36%" }} value={label} placeholder="Category" onChange={(e) => mutateData((d) => { d.skills[idx][0] = e.target.value; })} />
                <input className="input" value={value} placeholder="e.g. React, TypeScript, Node.js" onChange={(e) => mutateData((d) => { d.skills[idx][1] = e.target.value; })} />
                {editorData.skills.length > 1 && (
                  <button className="bullet__x" style={{ flex: "none" }} aria-label="Remove" onClick={() => mutateData((d) => { d.skills.splice(idx, 1); })}>
                    <Trash2 />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button className="btn btn--ghost btn--sm" onClick={() => mutateData((d) => { d.skills.push(["", ""]); })}>
            <Plus /> Add skill group
          </button>
        </>
      )
    }),

    certifications: renderSec({
      id: "certifications",
      title: "Certifications",
      icon: <Award />,
      body: (
        <>
          {(editorData.certifications || []).map((cert, idx) => (
            <div className="exp" key={idx} style={{ padding: "var(--space-3)" }}>
              <div className="field-grid">
                <div className="field">
                  <label className="field__label">Certification</label>
                  <input className="input" value={cert.name} onChange={(e) => mutateData((d) => { if (d.certifications) d.certifications[idx].name = e.target.value; })} />
                </div>
                <div className="field">
                  <label className="field__label">Year / ID</label>
                  <input className="input" value={cert.meta} placeholder="2024" onChange={(e) => mutateData((d) => { if (d.certifications) d.certifications[idx].meta = e.target.value; })} />
                </div>
              </div>
              <div className="field" style={mt3}>
                <label className="field__label">Issuer</label>
                <div style={rowStyle}>
                  <input className="input" value={cert.issuer} placeholder="e.g. Amazon Web Services" onChange={(e) => mutateData((d) => { if (d.certifications) d.certifications[idx].issuer = e.target.value; })} />
                  <button className="bullet__x" style={{ flex: "none" }} aria-label="Remove" onClick={() => mutateData((d) => { d.certifications?.splice(idx, 1); })}>
                    <Trash2 />
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            className="btn btn--secondary btn--sm"
            style={{ width: "100%" }}
            onClick={() => mutateData((d) => { if (!d.certifications) d.certifications = []; d.certifications.push({ name: "", issuer: "", meta: "" }); })}
          >
            <Plus /> Add certification
          </button>
        </>
      )
    })
  };

  /* User-defined sections (Hobbies, Awards, …) */
  for (const custom of editorData.custom || []) {
    const key = `custom:${custom.id}`;
    const filled = custom.items.filter((x) => x.trim()).length;
    SEC_SUMMARY[key] = filled ? `${filled} item${filled === 1 ? "" : "s"}` : "Name it & add items";
    SEC_NODES[key] = renderSec({
      id: key,
      title: custom.title || "Untitled section",
      icon: <Layers />,
      trailing: (
        <button
          className="bullet__x"
          aria-label="Delete section"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Delete custom section "${custom.title}"?`)) {
              mutateData((d) => {
                d.sectionOrder = (d.sectionOrder || []).filter((k) => k !== key);
                d.custom = (d.custom || []).filter((c) => c.id !== custom.id);
              });
            }
          }}
        >
          <Trash2 />
        </button>
      ),
      body: (
        <div className="field">
          <label className="field__label">Items</label>
          {custom.items.map((item, iIdx) => (
            <div key={iIdx} style={{ ...rowStyle, marginTop: 6 }}>
              <input
                className="input"
                value={item}
                placeholder="One line per item"
                onChange={(e) => mutateData((d) => {
                  const target = d.custom?.find((c) => c.id === custom.id);
                  if (target) target.items[iIdx] = e.target.value;
                })}
              />
              {custom.items.length > 1 && (
                <button
                  className="bullet__x"
                  style={{ flex: "none" }}
                  aria-label="Remove item"
                  onClick={() => mutateData((d) => {
                    const target = d.custom?.find((c) => c.id === custom.id);
                    if (target) target.items.splice(iIdx, 1);
                  })}
                >
                  <Trash2 />
                </button>
              )}
            </div>
          ))}
          <button
            className="btn btn--ghost btn--sm"
            style={{ marginTop: 8 }}
            onClick={() => mutateData((d) => {
              const target = d.custom?.find((c) => c.id === custom.id);
              if (target) target.items.push("");
            })}
          >
            <Plus /> Add item
          </button>
        </div>
      )
    });
  }

  const activeTpl = TEMPLATES.find((t) => t.id === editorTemplate);
  const toneFor = (n: number) => (n >= 75 ? "success" : n >= 50 ? "warning" : "danger");
  const atsTone = toneFor(atsAnalysis.score);
  const matchTone = atsTone;
  const DOCK_TITLES: Record<string, string> = {
    template: "Template",
    ats: "ATS score",
    tailor: "Tailoring"
  };

  return (
      <div className="resume-workspace">
      {gate && <SignInGate tier={ent.tier} action={gate} onClose={() => setGate(null)} />}
      {activeResumeId ? (
        /* ==================== EDITOR WORKSPACE ==================== */
        <div className="app">

          {/* ---------- Top bar ---------- */}
          <header className="topbar">
            <div className="tb-brand">
              <button
                className="tb-logo"
                title="Back to my resumes"
                onClick={() => {
                  setActiveResumeId(null);
                  setActiveVersionId(null);
                  setDockOpen(null);
                  fetchResumes(false);
                }}
              >
                <ArrowLeft />
              </button>
              <div className="tb-doc">
                <input
                  className="tb-title"
                  value={editorTitle}
                  onChange={(e) => setEditorTitle(e.target.value)}
                  aria-label="Resume title"
                />
                <span className="meta">
                  {saveStatus === "saving" ? (
                    "Saving…"
                  ) : saveStatus === "dirty" ? (
                    "Unsaved changes"
                  ) : (
                    <>
                      <Check /> All changes saved
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="tb-divider" />

            {/* Templates — opens a full-screen picker over the editor. Sits on
                the left of the bar, before the spacer pushes actions right. */}
            <button
              className="tb-tpl"
              onClick={() => setTemplatePickerOpen(true)}
              title="Change template"
            >
              <Layers />
              <span>{TEMPLATES.find((t) => t.id === editorTemplate)?.label ?? "Template"}</span>
              <ChevronDown />
            </button>

            <div className="tb-spacer" />

            {/* Live ATS score. With no job description pasted this scores
                against a generic role profile — paste a real posting in the
                ATS Score Checker for a targeted score. */}
            <button
              className={`tb-ats tb-ats--${atsBand(atsAnalysis.score)}`}
              onClick={() => navigate("/dashboard/tools/ats-checker")}
              title={
                usingGenericJd
                  ? "Scored against a generic role profile — add a job description for a targeted score"
                  : "Scored against your pasted job description"
              }
            >
              <span className="tb-ats__ring" style={{ ["--pct" as string]: `${atsAnalysis.score}` }}>
                <b>{atsAnalysis.score}</b>
              </span>
              <span className="tb-ats__txt">
                <span className="tb-ats__lbl">ATS score</span>
                <span className="tb-ats__sub">{usingGenericJd ? "Generic profile" : "vs. your JD"}</span>
              </span>
            </button>

            <button
              className="btn btn--secondary btn--sm"
              onClick={async () => {
                // Guests are autosaved to the browser as they type, but the
                // explicit Save is the conversion moment — prompt to sign in
                // rather than claiming it was saved to an account.
                if (!ent.canSave) {
                  setGate("save");
                  return;
                }
                const ok = await saveDraft(editorData, editorTemplate);
                toast(ok ? "Draft saved successfully ✦" : "Could not save — please try again");
              }}
            >
              Save draft
            </button>

            <div className="menu-wrap">
              <button
                className="btn btn--primary btn--sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setExportMenu(!exportMenu);
                }}
              >
                <FileDown /> Export
                <ChevronDown />
              </button>
              <div className={`menu menu--export${exportMenu ? " open" : ""}`} onClick={(e) => e.stopPropagation()}>
                <div className="menu__head">Download as</div>
                <button className="xopt" onClick={() => handleExport("pdf")}>
                  <span className="xopt__icon xopt__icon--pdf"><FileText /></span>
                  <span className="xopt__body">
                    <span className="xopt__title">PDF <span className="xopt__badge">Recommended</span></span>
                    <span className="xopt__desc">Exact copy of your preview — best for applying</span>
                  </span>
                </button>
                <button className="xopt" onClick={() => handleExport("docx")}>
                  <span className="xopt__icon xopt__icon--word"><FileText /></span>
                  <span className="xopt__body">
                    <span className="xopt__title">Word (.docx)</span>
                    <span className="xopt__desc">Editable in Microsoft Word &amp; Google Docs</span>
                  </span>
                </button>
                <div className="xopt__foot"><Check /> ATS-friendly — real text, single column</div>
              </div>
            </div>
          </header>

          {/* ---------- Template picker (overlays the editor) ---------- */}
          {templatePickerOpen && (
            <div className="tpl-modal" role="dialog" aria-modal="true" aria-label="Choose a template">
              <div className="tpl-modal__scrim" onClick={() => setTemplatePickerOpen(false)} />
              <div className="tpl-modal__panel">
                <div className="tpl-modal__head">
                  <div>
                    <h2 className="tpl-modal__title">Choose a template</h2>
                    <p className="tpl-modal__note">
                      Each thumbnail shows the template&apos;s <b>layout</b> — header, columns and accents.
                      Pick one to apply it; the live preview updates instantly.
                    </p>
                  </div>
                  <button className="dock__close" aria-label="Close" onClick={() => setTemplatePickerOpen(false)}>
                    <X />
                  </button>
                </div>

                {/* Text size — scales the whole résumé, and is saved so exports match */}
                <div className="fs-row">
                  <div className="fs-row__label">
                    <span className="dock__lbl">Text size</span>
                    <span className="fs-row__hint">Applies to every template · affects page count</span>
                  </div>
                  <div className="fs-stepper">
                    <button
                      aria-label="Smaller text"
                      disabled={fontScale <= FONT_SCALE_MIN + 0.001}
                      onClick={() => setFontScale(fontScale - FONT_SCALE_STEP)}
                    >
                      <span style={{ fontSize: 12, fontWeight: 800 }}>A</span>
                      <Minus />
                    </button>
                    <span className="fs-stepper__val">{Math.round(fontScale * 100)}%</span>
                    <button
                      aria-label="Larger text"
                      disabled={fontScale >= FONT_SCALE_MAX - 0.001}
                      onClick={() => setFontScale(fontScale + FONT_SCALE_STEP)}
                    >
                      <span style={{ fontSize: 16, fontWeight: 800 }}>A</span>
                      <Plus />
                    </button>
                    {fontScale !== 1 && (
                      <button className="fs-stepper__reset" onClick={() => setFontScale(1)}>Reset</button>
                    )}
                  </div>
                </div>

                <div className="tpl-modal__body">
                  <div className="tpl-grid">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        className={`tpl-card${editorTemplate === t.id ? " is-active" : ""}`}
                        onClick={() => {
                          chooseTemplate(t);
                          setTemplatePickerOpen(false);
                        }}
                      >
                        <span className="tpl-card__frame">
                          <TemplateThumb spec={t.thumb} />
                        </span>
                        <span className="tpl-card__foot">
                          <span className="tpl-card__foot-row">
                            <span className="tpl-card__name">{t.label}</span>
                            {editorTemplate === t.id ? (
                              <span className="tpl-card__check"><Check /></span>
                            ) : t.premium ? (
                              <span className="tpl-card__pro">Pro</span>
                            ) : null}
                          </span>
                          <span className="tpl-card__blurb">{t.blurb}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------- Workspace ---------- */}
          <div className="workspace">

            {/* Section nav */}

            {/* Section editors */}
            <section className="editor" ref={editorRef}>
              <div className="editor__inner">
                {renderSec({
                  id: "contact",
                  title: "Contact",
                  icon: <Sliders />,
                  body: (
                    <>
                      <div className="field-grid">
                        <div className="field">
                          <label className="field__label">
                            Full name
                            {user && <span style={{ opacity: 0.6, fontWeight: 400 }}> · from your account</span>}
                          </label>
                          {/* The server stamps the account's identity onto every
                              save, so an editable box here would silently revert
                              and read as a bug. Guests still type their own. */}
                          <input
                            className="input"
                            value={editorData.name}
                            readOnly={!!user}
                            title={user ? 'Your résumé uses the name on your account.' : undefined}
                            style={user ? { opacity: 0.75, cursor: 'not-allowed' } : undefined}
                            onChange={(e) => { if (!user) mutateData((d) => { d.name = e.target.value; }); }}
                          />
                        </div>
                        <div className="field">
                          <label className="field__label">Target role</label>
                          <input className="input" value={editorData.target} placeholder="e.g. Senior Frontend Engineer" onChange={(e) => mutateData((d) => { d.target = e.target.value; })} />
                        </div>
                      </div>
                      <div className="field" style={mt3}>
                        <label className="field__label">Contact details</label>
                        {user && (
                          <p style={{ fontSize: 11, opacity: 0.6, margin: "4px 0 0", lineHeight: 1.5 }}>
                            Your account email and phone are used automatically — a résumé belongs to
                            the person whose account it is. Add anything else here: location, portfolio,
                            LinkedIn.
                          </p>
                        )}
                        {editorData.contact.map((c, idx) => (
                          <div key={idx} style={{ ...rowStyle, marginTop: 6 }}>
                            <input
                              className="input"
                              value={c}
                              placeholder="email · phone · location · link"
                              onChange={(e) => mutateData((d) => { d.contact[idx] = e.target.value; })}
                            />
                            {editorData.contact.length > 1 && (
                              <button className="bullet__x" style={{ flex: "none" }} aria-label="Remove" onClick={() => mutateData((d) => { d.contact.splice(idx, 1); })}>
                                <Trash2 />
                              </button>
                            )}
                          </div>
                        ))}
                        <button className="btn btn--ghost btn--sm" style={{ marginTop: 8 }} onClick={() => mutateData((d) => { d.contact.push(""); })}>
                          <Plus /> Add detail
                        </button>
                      </div>
                    </>
                  )
                })}

                {bodySections.map((key) => SEC_NODES[key])}

                <button className="add-section" onClick={() => setAddSectionOpen(true)}>
                  <Plus /> Add section
                </button>
              </div>
            </section>

            {/* Live document preview */}
            <section className="preview" ref={previewRef}>
              <div className="preview__bar">
                <div className="preview__left">
                  <span className="preview__tname">{activeTpl?.label ?? "Classic"} template</span>
                  <span className="wysiwyg-note"><Check /> What you see is what exports</span>
                </div>
                <div className="zoom">
                  <button aria-label="Zoom out" onClick={() => stepZoom(-1)}>
                    <Minus />
                  </button>
                  <span className="val">{Math.round(previewScale * 100)}%</span>
                  <button aria-label="Zoom in" onClick={() => stepZoom(1)}>
                    <Plus />
                  </button>
                  <button
                    className={`zoom__fit${zoomIdx === null ? " is-active" : ""}`}
                    aria-label="Fit to width"
                    title="Fit to width"
                    onClick={() => setZoomIdx(null)}
                  >
                    Fit
                  </button>
                </div>
              </div>
              <div className="preview__scroll">
                <div className="page-wrap" style={{ transform: `scale(${previewScale})` }}>
                  <ResumeDoc data={editorData} variant={editorTemplate} onPages={setPageCount} />
                  <div className="page-cap">
                    A4 · Single column · ATS-safe · {pageCount === 1 ? "1 page" : `${pageCount} pages`}
                  </div>
                </div>
              </div>
            </section>

            {/* ---------- Right dock: Template · ATS · Tailoring ---------- */}
          </div>
        </div>
      ) : (
        /* ==================== RESUMES MANAGER DASHBOARD ==================== */
        <div className="flex flex-col gap-6 h-full min-h-0 bg-transparent">
          
          {/* Sub-Header Banner */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-surface border border-line p-5 rounded-3xl animate-fadeIn">
            <div>
              <h2 className="text-2xl font-black text-strong tracking-tight uppercase leading-none">
                MY RESUMES
              </h2>
              <span className="text-[10px] text-text-muted block uppercase tracking-widest mt-1 font-bold">
                Manage your base profiles and tailored versions
              </span>
            </div>
          </div>

          {/* Action Split Layout Dashboard - fixed outer scrolling */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch h-full min-h-0 flex-grow pb-6 animate-fadeIn">
            
            {/* Left Actions Panel (Compact height cards) */}
            <div className="lg:col-span-4 flex flex-col gap-4 h-full overflow-y-auto pr-1">
              <span className="text-[10px] font-black tracking-widest text-text-muted uppercase">CREATE & IMPORT PROFILES</span>
              
              <input
                type="file"
                ref={fileInput}
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.docx"
              />

              {/* Option 1: Upload Existing (Fixed height) */}
              <div 
                onClick={() => {
                  sourceRef.current = "upload";
                  fileInput.current?.click();
                }}
                className="group relative border border-line rounded-3xl p-5 bg-bg-surface hover:border-line-strong/50 transition-all duration-300 cursor-pointer flex flex-col justify-between h-44"
              >
                <div className="p-3 bg-bg-card rounded-2xl text-on-brand group-hover:bg-brand-orange group-hover:text-on-brand transition-all w-11 h-11 flex items-center justify-center self-start">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-strong uppercase tracking-wider">UPLOAD EXISTING PROFILE</h4>
                  <p className="text-[9px] text-text-muted uppercase tracking-widest mt-1 font-semibold leading-relaxed">
                    Upload your raw PDF or Word document file to synchronize data instantly.
                  </p>
                </div>
              </div>

              {/* Option 2: Import LinkedIn (Fixed height) */}
              <div 
                onClick={() => setLinkedinOpen(true)}
                className="group relative border border-line rounded-3xl p-5 bg-bg-surface hover:border-line-strong/50 transition-all duration-300 cursor-pointer flex flex-col justify-between h-44"
              >
                <div className="p-3 bg-bg-card rounded-2xl text-on-brand group-hover:bg-brand-orange group-hover:text-on-brand transition-all w-11 h-11 flex items-center justify-center self-start">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-strong uppercase tracking-wider">IMPORT FROM LINKEDIN</h4>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1 font-semibold leading-relaxed">
                    Export profile as PDF from LinkedIn settings and upload to parsing service.
                  </p>
                </div>
              </div>

              {/* Option 3: Build Scratch (Fixed height) */}
              <div 
                onClick={handleCreateNew}
                className="group relative border border-line rounded-3xl p-5 bg-bg-surface hover:border-line-strong/50 transition-all duration-300 cursor-pointer flex flex-col justify-between h-44"
              >
                <div className="p-3 bg-bg-card rounded-2xl text-on-brand group-hover:bg-brand-orange group-hover:text-on-brand transition-all w-11 h-11 flex items-center justify-center self-start">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-strong uppercase tracking-wider">BUILD FROM SCRATCH</h4>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1 font-semibold leading-relaxed">
                    Start with a fresh blank canvas and enter your details section-by-section.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Saved Resume Deck (3-column layout grid of h-60 cards) */}
            <div className="lg:col-span-8 flex flex-col gap-4 h-full min-h-0">
              <span className="text-[10px] font-black tracking-widest text-text-muted uppercase">SAVED PROFILES DECK</span>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 bg-bg-surface border border-line rounded-3xl h-full">
                  <div className="w-8 h-8 border-2 border-line-strong border-t-transparent rounded-full animate-spin" />
                  <span className="text-[9px] font-black tracking-widest text-text-muted uppercase">Loading Resumes...</span>
                </div>
              ) : resumes.length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center justify-center gap-6 bg-bg-surface border border-line rounded-3xl h-full">
                  <div className="w-16 h-16 rounded-full bg-bg-card flex items-center justify-center border border-line">
                    <FileText className="w-8 h-8 text-text-muted" />
                  </div>
                  <div className="flex flex-col gap-2 max-w-sm">
                    <h3 className="text-base font-black text-strong uppercase tracking-wider">NO SAVED RESUMES</h3>
                    <p className="text-[9px] text-text-muted uppercase tracking-widest leading-relaxed font-semibold">
                      Your saved resume portfolio is empty. Choose a method on the left to start.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-grow overflow-y-auto pr-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
                    {resumes.map((r, rIdx) => {
                      const thumbnail = rIdx % 2 === 0 ? "/build-resume-1.jpg" : "/build-resume-2.jpg";
                      return (
                        <div key={r.id} className="bg-bg-surface border border-line rounded-3xl p-4 flex flex-col justify-between h-[270px] hover:border-line-strong/50 transition-all relative group">
                          
                          {/* Dynamic Top Thumbnail visual banner */}
                          <div className="h-20 w-full rounded-2xl overflow-hidden relative border border-line">
                            <img src={thumbnail} alt="Resume Preview" className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:opacity-100 transition-opacity" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-[#111118]/40 to-transparent" />
                            
                            {/* Title banner */}
                            <div className="absolute bottom-2 left-3 right-3 flex justify-between items-end">
                              <div>
                                <h3 className="text-xs font-black text-strong uppercase tracking-wide truncate max-w-[120px]">
                                  {r.title || "Untitled Resume"}
                                </h3>
                                <span className="text-[7px] text-strong bg-bg-card px-1 py-0.2 rounded-xs uppercase tracking-widest font-black block mt-0.5">
                                  {r.template}
                                </span>
                              </div>

                              {/* Dropdown triggers */}
                              <div className="relative">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenu(openMenu === r.id ? null : r.id);
                                  }}
                                  className="p-1 bg-bg-card hover:bg-bg-card rounded-lg border border-line text-strong cursor-pointer"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Dropdown menu (Renders outside the overflow-hidden thumbnail) */}
                          {openMenu === r.id && (
                            <div className="absolute right-4 top-[88px] w-36 bg-bg-card border border-line rounded-xl shadow-2xl py-1 z-40">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameItem({ id: r.id, title: r.title });
                                  setOpenMenu(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-[9px] font-black text-text-muted hover:text-strong hover:bg-bg-card uppercase transition-colors cursor-pointer"
                              >
                                Rename
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicate(r.id);
                                  setOpenMenu(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-[9px] font-black text-text-muted hover:text-strong hover:bg-bg-card uppercase transition-colors cursor-pointer"
                              >
                                Duplicate
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(r.id);
                                  setOpenMenu(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-[9px] font-black text-red-500 hover:bg-red-50 uppercase transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          )}

                          {/* Previews & version row list */}
                          <div className="flex flex-col gap-1.5 mt-1 max-h-[75px] overflow-y-auto pr-1">
                            {r.variants.length > 0 ? (
                              <div className="flex flex-col gap-1">
                                {r.variants.slice(0, 2).map((v) => (
                                  <div
                                    key={v.id}
                                    onClick={() => handleOpenEditor(r.id, v.id)}
                                    className="flex justify-between items-center p-1.5 rounded-lg bg-bg-card hover:bg-elevate/30 border border-line transition-all cursor-pointer"
                                  >
                                    <div className="flex flex-col">
                                      <span className="text-[8px] font-bold text-strong uppercase truncate max-w-[90px]">{v.role}</span>
                                      <span className="text-[6px] text-text-muted uppercase truncate max-w-[80px]">@ {v.company}</span>
                                    </div>
                                    <span className="text-[7px] font-black text-strong bg-bg-card border border-line px-1 py-0.2 rounded-xs">
                                      {v.ats}% ATS
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-[8px] text-text-muted uppercase tracking-widest font-black bg-bg-card py-2 rounded-xl text-center border border-line">
                                No tailored versions
                              </div>
                            )}
                          </div>

                          {/* Open editor button */}
                          <button
                            onClick={() => handleOpenEditor(r.id)}
                            className="w-full py-2 bg-brand-orange text-on-brand hover:bg-orange-600 text-[9px] font-black tracking-widest rounded-xl transition-all uppercase cursor-pointer mt-1"
                          >
                            Open Base Editor
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LinkedIn import modal dialog */}
      {linkedinOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-overlay" onClick={() => setLinkedinOpen(false)} />
          <div className="relative w-full max-w-md bg-bg-card border border-line rounded-3xl p-8 z-10 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 halftone-overlay opacity-5 pointer-events-none" />
            
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-black tracking-widest text-strong uppercase">LINKEDIN IMPORT PROTOCOL</span>
              <button onClick={() => setLinkedinOpen(false)} className="text-xs font-bold tracking-widest text-text-muted hover:text-strong transition-colors uppercase">✕ CLOSE</button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-bg-card border border-line p-4 rounded-2xl flex flex-col gap-3">
                <span className="text-[9px] font-black text-strong tracking-widest uppercase">STEPS TO IMPORT</span>
                <ol className="text-xs text-text-muted flex flex-col gap-2 list-decimal list-inside font-semibold leading-relaxed">
                  <li>
                    Click{" "}
                    <a 
                      href="https://www.linkedin.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-brand-orange font-bold hover:underline inline-flex items-center gap-0.5"
                    >
                      here to open LinkedIn <Link2 className="w-3 h-3 inline" />
                    </a>{" "}
                    and visit your profile page.
                  </li>
                  <li>Click the <b className="text-strong">&quot;More&quot;</b> button under your profile banner.</li>
                  <li>Select <b className="text-strong">&quot;Save to PDF&quot;</b> from the options menu.</li>
                  <li>Upload or drop that downloaded PDF file in the box below.</li>
                </ol>
              </div>

              <div
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                  dragOver ? "border-line-strong bg-bg-card" : "border-line bg-bg-card/30 hover:border-line-strong"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => {
                  sourceRef.current = "linkedin";
                  fileInput.current?.click();
                }}
              >
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <span className="text-xs font-bold text-strong uppercase block">DROP LINKEDIN PDF HERE</span>
                <span className="text-[9px] text-text-muted uppercase mt-1 block">or browse files</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rename dialog modal */}
      {renameItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-overlay" onClick={() => setRenameItem(null)} />
          <div className="relative w-full max-w-sm bg-bg-card border border-line rounded-3xl p-6 z-10 shadow-2xl">
            <h3 className="text-xs font-black tracking-widest text-strong uppercase mb-4">RENAME PROFILE</h3>
            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={renameItem.title}
                onChange={(e) => setRenameItem({ ...renameItem, title: e.target.value })}
                className="w-full px-4 py-2.5 bg-bg-card border border-line rounded-xl text-xs font-semibold focus:outline-none focus:border-line-strong text-strong"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setRenameItem(null)}
                  className="flex-1 py-3 bg-bg-card text-strong text-xs font-bold rounded-xl uppercase hover:bg-elevate cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRenameSave}
                  className="flex-1 py-3 bg-brand-orange text-on-brand text-xs font-bold rounded-xl uppercase hover:bg-orange-600 cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Section Modal */}
      {addSectionOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-overlay" onClick={() => setAddSectionOpen(false)} />
          <div className="relative w-full max-w-sm bg-bg-card border border-line rounded-3xl p-6 z-10 shadow-2xl">
            <h3 className="text-xs font-black tracking-widest text-strong uppercase mb-2">CREATE CUSTOM SECTION</h3>
            <p className="text-[10px] text-text-muted uppercase tracking-widest mb-4 font-bold">SECTION NAME MUST BE UNIQUE</p>
            
            {newSectionError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-655 text-[10px] font-black uppercase tracking-widest rounded-xl mb-4">
                ⚠️ {newSectionError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <input
                type="text"
                value={newSectionTitle}
                onChange={(e) => { setNewSectionTitle(e.target.value); setNewSectionError(""); }}
                placeholder="e.g. Hobbies, Awards, Publications"
                className="w-full px-4 py-2.5 bg-bg-card border border-line rounded-xl text-xs font-semibold focus:outline-none focus:border-line-strong text-strong"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setAddSectionOpen(false); setNewSectionTitle(""); setNewSectionError(""); }}
                  className="flex-1 py-3 bg-bg-card text-strong text-xs font-bold rounded-xl uppercase hover:bg-elevate cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomSection}
                  className="flex-1 py-3 bg-brand-orange text-on-brand text-xs font-bold rounded-xl uppercase hover:bg-orange-600 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pro-template gate — free users tapping a Pro template */}
      {proGate && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-overlay" onClick={() => setProGate(null)} />
          <div className="relative w-full max-w-sm bg-bg-card border border-line rounded-3xl p-8 z-10 shadow-2xl text-center">
            <div className="mx-auto w-20 h-20 mb-6 flex items-center justify-center bg-red-50 border border-red-200 rounded-full text-red-500 animate-bounce">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-strong uppercase tracking-wider mb-2">COMING SOON</h3>
            <p className="text-xs text-red-500 font-bold uppercase tracking-widest mb-2">PRO TEMPLATE LOCKED</p>
            <p className="text-[10px] text-text-muted uppercase tracking-widest font-black leading-relaxed mb-6">
              The <b className="text-strong">{proGate.label}</b> template is available on the <b className="text-strong">Pro</b> plan. Subscription modules are currently in test run.
            </p>
            <button
              onClick={() => setProGate(null)}
              className="w-full py-3 bg-brand-orange text-on-brand font-black text-[10px] tracking-widest rounded-xl hover:bg-orange-600 transition-all uppercase cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* Global Toast Component */}
      <div className={`toast${toastShow ? " show" : ""}`}>
        <span>{toastMsg}</span>
      </div>
      </div>
  );
}
