import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { readGuestResume, guestHeaders } from "../../lib/guestStore";
import { entitlementsFor } from "../../lib/entitlements";
import SignInGate from "../../components/SignInGate";
import { Sparkles, FileDown, RefreshCw, Save, Check } from "lucide-react";

interface Resume {
  id: string;
  title: string;
}

export default function CoverLetterBuilder() {
  const { token, user } = useAuth(false);
  const ent = entitlementsFor(!!token, (user as any)?.plan, (user as any)?.role);
  const [gate, setGate] = useState<null | "save" | "export" | "premium-template" | "extra-resume">(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [hiringManager, setHiringManager] = useState("");
  const [tone, setTone] = useState<"professional" | "enthusiastic" | "concise">("professional");
  const [jdText, setJdText] = useState("");
  const [letterBody, setLetterBody] = useState("");
  const [clTemplate, setClTemplate] = useState<"template1" | "template2">("template1");
  const [loading, setLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastShow(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShow(false), 2400);
  };

  // Sync JD text from localStorage (ATS Scanner)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedJd = localStorage.getItem("atsJd");
      if (savedJd && !jdText) {
        setJdText(savedJd);
      }
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchResumes();
    }
  }, [token]);

  const fetchResumes = async () => {
    setLoading(true);
    try {
      if (!token) {

        // Guests work from the résumé kept in their browser.

        const stored = readGuestResume();

        if (stored) {

          setResumes([{ id: "guest", title: stored.title }]);

          setSelectedResumeId("guest");

        }

        return;

      }

      const res = await fetch("/api/resumes", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResumes(data || []);
        if (data && data.length > 0) {
          setSelectedResumeId(data[0].id);
          fetchCoverLetter(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load resumes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCoverLetter = async (resumeId: string) => {
    if (!resumeId) return;
    try {
      const res = await fetch(`/api/resumes/${resumeId}/cover-letter`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setCompany(data.company || "");
          setRole(data.role || "");
          setHiringManager(data.manager || "");
          setTone(data.tone || "professional");
          if (data.jd) setJdText(data.jd); // Overwrite if cloud has it
          setLetterBody(data.body || "");
        } else {
          setCompany("");
          setRole("");
          setHiringManager("");
          setTone("professional");
          setLetterBody("");
        }
      }
    } catch (err) {
      console.error("No existing cover letter:", err);
    }
  };

  const handleGenerate = async () => {
    if (!selectedResumeId || !jdText.trim()) return;
    setGenerateLoading(true);
    try {
      // Guests post their résumé in the body; members reference it by id.
      const guest = !token;
      const stored = guest ? readGuestResume() : null;
      const res = await fetch(
        guest ? "/api/guest/ai/cover-letter" : `/api/resumes/${selectedResumeId}/cover-letter/generate`,
        {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : guestHeaders()),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          company,
          role,
          hiringManager,
          manager: hiringManager,
          tone,
          jd: jdText,
          ...(guest ? { resume: stored?.data } : {})
        })
      });
      const data = await res.json();
      if (res.status === 402) {
        setGate("save");
        return;
      }
      if (res.ok && data) {
        setLetterBody(data.body || "");
        showToast("Cover letter generated successfully ✦");
      } else {
        showToast(data.message || "Failed to generate cover letter.");
      }
    } catch (err) {
      console.error(err);
      showToast("Model offline or out of credits.");
    } finally {
      setGenerateLoading(false);
    }
  };

  const handleSave = async () => {
    if (!ent.canSave) { setGate("save"); return; }
    if (!selectedResumeId) return;
    setSaveLoading(true);
    try {
      const res = await fetch(`/api/resumes/${selectedResumeId}/cover-letter`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          company,
          role,
          manager: hiringManager,
          tone,
          jd: jdText,
          body: letterBody
        })
      });
      if (res.ok) {
        showToast("Cover letter successfully saved!");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to save draft.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleExport = async (type: "pdf" | "docx") => {
    if (!ent.canExport) { setGate("export"); return; }
    if (!selectedResumeId || !letterBody) return;
    setExporting(type);
    try {
      await handleSave(); // Save current draft first
      const res = await fetch(`/api/resumes/${selectedResumeId}/cover-letter/export/${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${company || "Cover_Letter"}_Cover_Letter.${type}`;
        link.click();
        URL.revokeObjectURL(url);
        showToast(`Exported as ${type.toUpperCase()} successfully.`);
      } else {
        showToast("Export failed.");
      }
    } catch (err) {
      console.error(err);
      showToast("Failed to export document.");
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      {gate && <SignInGate tier={ent.tier} action={gate} onClose={() => setGate(null)} />}
      <div className="tool-fill flex flex-col gap-6 min-h-0 bg-transparent">
        {/* Top actions toolbar */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-bg-surface border border-line p-6 rounded-3xl">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={selectedResumeId}
              onChange={(e) => {
                setSelectedResumeId(e.target.value);
                fetchCoverLetter(e.target.value);
              }}
              className="px-4 py-2.5 bg-bg-card border border-line rounded-xl text-xs font-bold tracking-wider uppercase text-strong focus:outline-none focus:border-line-strong"
            >
              <option value="">Select a base profile...</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>

            {/* Visual thumbnail template selector */}
            <div className="flex gap-3 bg-bg-surface border border-line p-1.5 rounded-2xl">
              <button
                onClick={() => setClTemplate("template1")}
                className={`relative rounded-xl border p-1 flex flex-col items-center gap-1 min-w-[70px] transition-all cursor-pointer ${
                  clTemplate === "template1" ? "border-line-strong bg-bg-card" : "border-line bg-bg-card/30"
                }`}
              >
                <div className="w-12 h-14 bg-bg-card rounded border border-line-strong relative overflow-hidden flex flex-col p-1">
                  <div className="w-full h-1 bg-brand-orange rounded-xs mb-1" />
                  <div className="w-4/5 h-[1.5px] bg-line-strong mb-0.5" />
                  <div className="w-full h-[1.5px] bg-line-strong mb-0.5" />
                  <div className="w-2/3 h-[1.5px] bg-line-strong" />
                </div>
                <span className="text-[7px] font-black text-text-muted uppercase tracking-widest">Classic</span>
              </button>
              <button
                onClick={() => setClTemplate("template2")}
                className={`relative rounded-xl border p-1 flex flex-col items-center gap-1 min-w-[70px] transition-all cursor-pointer ${
                  clTemplate === "template2" ? "border-line-strong bg-bg-card" : "border-line bg-bg-card/30"
                }`}
              >
                <div className="w-12 h-14 bg-bg-card rounded border border-line-strong relative overflow-hidden flex flex-col p-1">
                  <div className="w-full h-1 bg-brand-orange rounded-xs mb-1" />
                  <div className="w-4/5 h-[1.5px] bg-line-strong mb-0.5" />
                  <div className="w-full h-[1.5px] bg-line-strong mb-0.5" />
                  <div className="w-2/3 h-[1.5px] bg-line-strong" />
                </div>
                <span className="text-[7px] font-black text-text-muted uppercase tracking-widest">Modern</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={handleSave}
              disabled={!selectedResumeId || !letterBody || saveLoading}
              className="flex-grow lg:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-bg-card border border-line text-strong text-xs font-bold tracking-widest rounded-xl hover:bg-elevate/50 transition-all uppercase cursor-pointer"
            >
              {saveLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              SAVE DRAFT
            </button>
            <button
              onClick={() => handleExport("docx")}
              disabled={!selectedResumeId || !letterBody || exporting === "docx"}
              className="flex-grow lg:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-brand-orange text-on-brand text-xs font-bold tracking-widest rounded-xl hover:bg-orange-600 transition-all uppercase cursor-pointer"
            >
              {exporting === "docx" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              Export Word
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={!selectedResumeId || !letterBody || exporting === "pdf"}
              className="flex-grow lg:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-transparent border border-line text-strong text-xs font-bold tracking-widest rounded-xl hover:bg-bg-card transition-all uppercase cursor-pointer"
            >
              {exporting === "pdf" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              Export PDF
            </button>
          </div>
        </div>

        {/* 50/50 Split Workspace Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-grow overflow-hidden min-h-0">
          {/* LEFT PANEL: Inputs (JD, Company, Role, Manager, Tone) */}
          <div className="bg-bg-surface border border-line rounded-3xl p-6 md:p-8 flex flex-col gap-5 overflow-y-auto max-h-full">
            <span className="text-[10px] font-black tracking-widest text-text-muted uppercase">
              JOB REQUIREMENTS (INPUTS)
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold tracking-widest text-text-muted uppercase">TARGET COMPANY</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="px-4 py-2.5 bg-bg-card border border-line rounded-xl text-xs font-semibold focus:outline-none focus:border-line-strong text-strong"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold tracking-widest text-text-muted uppercase">TARGET ROLE</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Staff Architect"
                  className="px-4 py-2.5 bg-bg-card border border-line rounded-xl text-xs font-semibold focus:outline-none focus:border-line-strong text-strong"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold tracking-widest text-text-muted uppercase">HIRING MANAGER (OPTIONAL)</label>
                <input
                  type="text"
                  value={hiringManager}
                  onChange={(e) => setHiringManager(e.target.value)}
                  placeholder="e.g. Mr. Smith"
                  className="px-4 py-2.5 bg-bg-card border border-line rounded-xl text-xs font-semibold focus:outline-none focus:border-line-strong text-strong"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold tracking-widest text-text-muted uppercase">AI WRITER TONE</label>
                <div className="flex gap-1 bg-bg-card p-1 rounded-xl border border-line">
                  {(["professional", "enthusiastic", "concise"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTone(t)}
                      className={`flex-grow py-1 text-[9px] font-black tracking-widest uppercase rounded-lg transition-all ${
                        tone === t ? "bg-brand-orange text-on-brand" : "text-text-muted"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-grow flex flex-col gap-1.5 min-h-[150px]">
              <label className="text-[9px] font-bold tracking-widest text-text-muted uppercase">JOB DESCRIPTION</label>
              <textarea
                value={jdText}
                onChange={(e) => {
                  setJdText(e.target.value);
                  localStorage.setItem("atsJd", e.target.value); // Sync back to scanner localstorage
                }}
                placeholder="Paste the target JD text here to scan keywords and generate matching semantic descriptions..."
                className="w-full flex-grow p-4 bg-bg-card border border-line rounded-xl text-xs font-medium text-strong focus:outline-none focus:border-line-strong resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generateLoading || !selectedResumeId || !jdText.trim()}
              className="w-full py-4 bg-brand-orange text-on-brand hover:bg-orange-600 text-xs font-black tracking-widest rounded-xl transition-all uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 animate-pulse"
            >
              {generateLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              GENERATE COVER LETTER
            </button>
          </div>

          {/* RIGHT PANEL: Editorial Text Editor with template preview classes */}
          <div className="bg-bg-surface border border-line rounded-3xl p-6 md:p-8 flex flex-col gap-6 max-h-full">
            <span className="text-[10px] font-black tracking-widest text-text-muted uppercase">
              LETTER WRITING CANVAS
            </span>

            <div className="w-full flex-grow relative min-h-[350px]">
              <textarea
                value={letterBody}
                onChange={(e) => setLetterBody(e.target.value)}
                placeholder="Cover letter content will render here. You can manually edit the content before exporting..."
                className={`w-full h-full p-6 bg-bg-card border border-line rounded-xl text-xs font-medium text-strong focus:outline-none focus:border-line-strong leading-relaxed resize-none ${
                  clTemplate === "template1" 
                    ? "font-serif border-l-4 border-l-[#f5820b]" 
                    : "font-sans border-t-4 border-t-[#f5820b]"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Global Toast component */}
      <div className={`toast${toastShow ? " show" : ""}`}>
        <span>{toastMsg}</span>
      </div>
    </>
  );
}
