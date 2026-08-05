import React, { useState, useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { readGuestResume, guestHeaders } from "../../lib/guestStore";
import { entitlementsFor } from "../../lib/entitlements";
import SignInGate from "../../components/SignInGate";
import { Sparkles, RefreshCw, ChevronRight, CheckCircle2, Award, Volume2, Eye, EyeOff } from "lucide-react";

import "../../styles/resume/interview.css";

interface Resume {
  id: string;
  title: string;
}

interface QuestionItem {
  question: string;
  answer: string;
  tips?: string;
  tip?: string;
  category?: string;
}

const ORDER = ["From Your Résumé", "Role & Technical", "Behavioral", "Situational", "Motivation & Fit"];

export default function InterviewPrepKit() {
  const { token, user } = useAuth(false);
  const ent = entitlementsFor(!!token, (user as any)?.plan, (user as any)?.role);
  const [gate, setGate] = useState<null | "save" | "export" | "premium-template" | "extra-resume">(null);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState("");
  const [role, setRole] = useState("");
  const [jdText, setJdText] = useState("");
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [tips, setTips] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState(false);
  
  const [showAnswers, setShowAnswers] = useState(true);
  const [showTips, setShowTips] = useState(true);
  const [status, setStatus] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastShow(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShow(false), 2400);
  };

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
          fetchInterviewPrep(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load resumes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterviewPrep = async (resumeId: string) => {
    if (!resumeId) return;
    try {
      const res = await fetch(`/api/resumes/${resumeId}/interview-prep`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.questions) {
          setQuestions(data.questions || []);
          setTips(data.tips || []);
          setRole(data.role || "");
          setJdText(data.jd || "");
          setStatus(`${data.questions.length} questions loaded`);
        } else {
          setQuestions([]);
          setTips([]);
          setRole("");
          setJdText("");
          setStatus("");
        }
      }
    } catch (err) {
      console.error("No existing interview prep data:", err);
    }
  };

  const handleGenerate = async () => {
    if (!selectedResumeId || !jdText.trim()) return;
    setGenerateLoading(true);
    setStatus("Analyzing and preparing questions...");
    try {
      // Guests post their résumé in the body; members reference it by id.
      const guest = !token;
      const stored = guest ? readGuestResume() : null;
      const res = await fetch(
        guest ? "/api/guest/ai/interview-prep" : `/api/resumes/${selectedResumeId}/interview-prep/generate`,
        {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : guestHeaders()),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          role,
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
        setQuestions(data.questions || []);
        setTips(data.tips || []);
        setStatus(`${(data.questions || []).length} questions ready ✦`);
        showToast("Questions generated successfully!");
      } else {
        setStatus("Generation failed.");
        showToast(data.message || "Failed to generate interview prep.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error. Out of credits or backend offline.");
      showToast("Model run failed.");
    } finally {
      setGenerateLoading(false);
    }
  };

  // Group questions by category and sort according to guidelines
  const groups = useMemo(() => {
    const by = new Map<string, QuestionItem[]>();
    for (const q of questions) {
      const cat = q.category || "General";
      if (!by.has(cat)) by.set(cat, []);
      by.get(cat)!.push(q);
    }
    return [...by.entries()].sort((a, b) => {
      const ia = ORDER.indexOf(a[0]);
      const ib = ORDER.indexOf(b[0]);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  }, [questions]);

  let totalQCounter = 0;

  return (
    <>
      {gate && <SignInGate tier={ent.tier} action={gate} onClose={() => setGate(null)} />}
      <div className="tool-fill flex flex-col gap-6 min-h-0 bg-transparent">
        {/* Top actions toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-surface border border-line p-6 rounded-3xl">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={selectedResumeId}
              onChange={(e) => {
                setSelectedResumeId(e.target.value);
                fetchInterviewPrep(e.target.value);
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
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-text-muted uppercase tracking-widest">
            {status && <span className="text-strong bg-bg-card px-3 py-1.5 rounded-lg border border-line">{status}</span>}
          </div>
        </div>

        {/* Workspace panel split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-grow overflow-hidden min-h-0">
          
          {/* LEFT PANEL: Parameters Input */}
          <div className="lg:col-span-4 bg-bg-surface border border-line rounded-3xl p-6 flex flex-col gap-5 overflow-y-auto max-h-full">
            <span className="text-[10px] font-black tracking-widest text-text-muted uppercase">
              INTERVIEW PARAMETERS
            </span>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold tracking-widest text-text-muted uppercase">TARGET ROLE</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Lead DevOps Architect"
                className="px-4 py-2.5 bg-bg-card border border-line rounded-xl text-xs font-semibold focus:outline-none focus:border-line-strong text-strong"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold tracking-widest text-text-muted uppercase">JOB DESCRIPTION</label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the target Job Description (JD) here to align questions..."
                rows={10}
                className="w-full p-4 bg-bg-card border border-line rounded-xl text-xs font-medium text-strong focus:outline-none focus:border-line-strong resize-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={generateLoading || !selectedResumeId || !jdText.trim()}
              className="w-full py-4 bg-brand-orange text-on-brand hover:bg-orange-600 text-xs font-black tracking-widest rounded-xl transition-all uppercase flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {generateLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {questions.length > 0 ? "REGENERATE QUESTIONS" : "GENERATE QUESTIONS"}
            </button>
          </div>

          {/* RIGHT PANEL: Category Groups, Checklists & Answers reveal */}
          <div className="lg:col-span-8 bg-bg-surface border border-line rounded-3xl p-6 md:p-8 flex flex-col gap-6 overflow-y-auto max-h-full">
            
            {questions.length > 0 ? (
              <div className="flex flex-col gap-6">
                
                {/* Pre-interview Tips Checklist */}
                {tips.length > 0 && (
                  <div className="bg-bg-card border border-line p-6 rounded-2xl flex flex-col gap-4">
                    <span className="text-[10px] font-black tracking-widest text-strong uppercase flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-strong" />
                      BEFORE THE INTERVIEW (CHECKLIST TIPS)
                    </span>
                    <ul className="flex flex-col gap-2">
                      {tips.map((t, idx) => (
                        <li key={idx} className="text-xs text-text-muted uppercase tracking-wider font-semibold flex items-start gap-2">
                          <span className="text-strong mt-0.5">•</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Show/Hide Answers and Tips Controls Toolbar */}
                <div className="flex justify-between items-center border-b border-line pb-4 mt-2">
                  <span className="text-xs font-black text-strong uppercase tracking-wide">
                    {questions.length} TAILORED QUESTIONS READY
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAnswers(!showAnswers)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card border border-line rounded-xl text-[10px] font-bold uppercase text-strong hover:bg-elevate/50"
                    >
                      {showAnswers ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showAnswers ? "Hide Answers" : "Show Answers"}
                    </button>
                    <button
                      onClick={() => setShowTips(!showTips)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-bg-card border border-line rounded-xl text-[10px] font-bold uppercase text-strong hover:bg-elevate/50"
                    >
                      {showTips ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      {showTips ? "Hide Tips" : "Show Tips"}
                    </button>
                  </div>
                </div>

                {/* Collapsible/Categorized groups */}
                <div className="flex flex-col gap-6 font-satoshi">
                  {groups.map(([category, list]) => (
                    <div key={category} className="flex flex-col gap-3">
                      <div className="text-[10px] font-black tracking-widest text-strong uppercase flex items-center gap-2 border-l-2 border-line-strong pl-3">
                        {category}
                      </div>
                      <div className="flex flex-col gap-4">
                        {list.map((item, qIdx) => {
                          totalQCounter++;
                          return (
                            <div key={qIdx} className="bg-bg-card border border-line p-5 rounded-2xl flex flex-col gap-3 animate-fadeIn">
                              <div className="flex gap-3 items-start">
                                <span className="text-[10px] font-black text-on-brand bg-brand-orange px-2 py-0.5 rounded-md">
                                  {String(totalQCounter).padStart(2, "0")}
                                </span>
                                <h4 className="text-xs font-black text-strong leading-relaxed uppercase tracking-wide">
                                  {item.question}
                                </h4>
                              </div>

                              {showAnswers && item.answer && (
                                <div className="border-t border-line pt-3 mt-1 flex flex-col gap-1.5">
                                  <span className="text-[9px] font-bold tracking-widest text-strong uppercase">
                                    Suggested Answer Outline
                                  </span>
                                  <p className="text-xs text-text-muted uppercase tracking-wider font-semibold leading-relaxed">
                                    {item.answer}
                                  </p>
                                </div>
                              )}

                              {showTips && (item.tip || item.tips) && (
                                <div className="border-t border-line pt-3 flex flex-col gap-1">
                                  <span className="text-[9px] font-bold tracking-widest text-strong uppercase flex items-center gap-1">
                                    ✦ Answering Tips
                                  </span>
                                  <p className="text-xs text-text-muted italic font-semibold leading-relaxed">
                                    {item.tip || item.tips}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ) : (
              <div className="text-center py-20 text-text-muted text-xs font-bold uppercase tracking-widest">
                No prep questions generated yet. Paste job requirements on the left sidebar to analyze.
              </div>
            )}

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
