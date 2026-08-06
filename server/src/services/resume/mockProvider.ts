import type { ResumeData } from "./resumeData";
import { extractKeywords, scoreResume, resumeToText, isCovered } from "./ats";
import type { AIProvider, BulletTone, Intensity, TailorSuggestion, CoverLetterInput, InterviewPrepResult, InterviewQuestion, TokenUsage } from "./aiTypes";

/* ============================================================
   MockProvider — deterministic, no network. Used as the default
   in dev (when Ollama isn't running) and as the fallback when a
   real provider call fails, so AI features never hard-break.
   ============================================================ */

function strengthen(text: string): string {
  let t = text.trim();
  t = t.replace(
    /^(worked on|helped(?:\sto)?|was responsible for|responsible for|assisted with|participated in)\s+/i,
    "Led "
  );
  t = t.charAt(0).toUpperCase() + t.slice(1);
  if (!/[.!?]$/.test(t)) t += ".";
  return t;
}

function shorten(text: string): string {
  let t = (text.trim().split(/[.;]/)[0] ?? "").trim();
  if (t.length > 120) t = t.slice(0, 117).trimEnd() + "…";
  if (!/[.!?…]$/.test(t)) t += ".";
  return t;
}

function addMetric(text: string): string {
  const t = text.trim();
  if (/\d/.test(t)) return strengthen(t);
  // insert an editable placeholder rather than inventing a number
  return t.replace(/[.!?]?\s*$/, "") + ", improving the key metric by [X%].";
}

export class MockProvider implements AIProvider {
  readonly name = "mock";
  lastUsage: TokenUsage | null = { inputTokens: 0, outputTokens: 0, totalTokens: 0, model: "mock" };

  async rewriteBullet(bullet: string, tone: BulletTone): Promise<string> {
    if (tone === "shorter") return shorten(bullet);
    if (tone === "metric") return addMetric(bullet);
    return strengthen(bullet);
  }

  async generateSummary(resume: ResumeData, jd?: string): Promise<string> {
    const skills = resume.skills
      .flatMap((s) => s[1].split(",").map((x) => x.trim()))
      .filter(Boolean)
      .slice(0, 4)
      .join(", ");
    const firstWin = resume.experience[0]?.bullets[0]?.replace(/\.$/, "") || "";
    const focus = jd ? extractKeywords(jd).slice(0, 2).map((k) => k.label).join(" and ") : "";
    const lead = `${resume.target || "Software engineer"} with hands-on experience in ${skills}.`;
    const tail = firstWin ? ` ${firstWin}.` : "";
    const aim = focus ? ` Focused on ${focus}.` : "";
    return (lead + tail + aim).trim();
  }

  async structureResume(rawText: string, _sourceHint?: string): Promise<ResumeData> {
    const lines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const emailRe = /[\w.+-]+@[\w-]+\.[\w.-]+/;
    const phoneRe = /(\+?\d[\d\s().-]{7,}\d)/;
    const urlRe = /(linkedin\.com\/\S+|github\.com\/\S+|https?:\/\/\S+)/i;
    const dateRe = /((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s*\d{0,4}\s*[-–—]\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s*\d{2,4}|\d{4})|(?:19|20)\d{2}\s*[-–—]\s*(?:present|current|(?:19|20)\d{2}))/i;

    const name = lines[0] || "Your Name";
    const flat = rawText.replace(/\s+/g, " ");
    const contact: string[] = [];
    const email = flat.match(emailRe)?.[0];
    const phone = flat.match(phoneRe)?.[0];
    const url = flat.match(urlRe)?.[0];
    if (email) contact.push(email);
    if (phone) contact.push(phone.trim());
    if (url) contact.push(url);

    // route lines into sections by detecting standard headings
    type Section = "head" | "summary" | "experience" | "education" | "skills" | "projects" | "certs";
    const headingOf = (l: string): Section | null => {
      const t = l.toLowerCase().replace(/[^a-z /&]/g, "").trim();
      if (/^(summary|profile|about|objective)$/.test(t)) return "summary";
      if (/^(experience|work experience|professional experience|employment|work history)$/.test(t)) return "experience";
      if (/^(education|academics?)$/.test(t)) return "education";
      if (/^(skills|technical skills|core skills|skills & tools)$/.test(t)) return "skills";
      if (/^(projects|personal projects|selected projects)$/.test(t)) return "projects";
      if (/^(certifications?|certificates|licenses|licenses & certifications)$/.test(t)) return "certs";
      return null;
    };
    const isContact = (l: string) => emailRe.test(l) || phoneRe.test(l) || urlRe.test(l);

    const b: Record<Section, string[]> = { head: [], summary: [], experience: [], education: [], skills: [], projects: [], certs: [] };
    let cur: Section = "head";
    lines.slice(1).forEach((l) => {
      const h = headingOf(l);
      if (h) { cur = h; return; }
      if (cur === "head" && isContact(l)) return;
      b[cur].push(l);
    });

    const summary =
      b.summary.join(" ") ||
      b.head.find((l) => l.length > 50 && !isContact(l)) ||
      "Imported resume — review and edit each section.";
    const target = b.head.find((l) => l.length < 50 && l !== name && !isContact(l)) || "";

    // group experience: a date-bearing or "Role — Company" line starts a new entry
    const experience: ResumeData["experience"] = [];
    for (const l of b.experience) {
      const dm = l.match(dateRe);
      const looksHeader = !!dm || ((l.includes(" — ") || l.includes(" - ") || / at /i.test(l)) && l.length < 90);
      if (looksHeader) {
        const meta = dm ? dm[0].trim() : "";
        const head = (meta ? l.replace(meta, "") : l).replace(/[-–—|,]\s*$/, "").trim();
        const [role, company] = head.split(/\s+[—–-]\s+| at /i);
        experience.push({ role: (role || head).trim(), company: (company || "").trim(), location: "", meta, bullets: [] });
      } else {
        if (!experience.length) experience.push({ role: "Experience", company: "", location: "", meta: "", bullets: [] });
        experience[experience.length - 1]!.bullets.push(l.replace(/^[•\-*·]\s*/, ""));
      }
    }

    const education = b.education.map((l) => {
      const dm = l.match(/((?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present)|(?:19|20)\d{2})/i);
      const meta = dm ? dm[0] : "";
      return { degree: (meta ? l.replace(meta, "") : l).trim(), school: "", meta };
    });

    const skills: ResumeData["skills"] = b.skills.map((l) => {
      const m = l.match(/^([^:]{2,30}):\s*(.+)$/);
      return m ? ([(m[1] ?? "").trim(), (m[2] ?? "").trim()] as [string, string]) : (["Skills", l] as [string, string]);
    });

    const projects = b.projects.map((l) => {
      const m = l.match(/^([^:—–-]{2,60})\s*[:—–-]\s*(.+)$/);
      return m ? { name: (m[1] ?? "").trim(), description: (m[2] ?? "").trim() } : { name: l, description: "" };
    });
    const certifications = b.certs.map((l) => ({ name: l, issuer: "", meta: l.match(/(?:19|20)\d{2}/)?.[0] || "" }));

    return {
      name,
      target: target || experience[0]?.role || "",
      contact: contact.length ? contact : ["add your contact details"],
      summary,
      experience: experience.length ? experience : [{ role: "", company: "", location: "", meta: "", bullets: [""] }],
      skills: skills.length ? skills : [["", ""]],
      education: education.length ? education : [{ degree: "", school: "", meta: "" }],
      projects,
      certifications,
    };
  }

  async coverLetter(resume: ResumeData, input: CoverLetterInput): Promise<string> {
    const role = input.role || resume.target || "the role";
    const company = input.company || "your company";
    const skills = resume.skills.flatMap((s) => s[1].split(",").map((x) => x.trim())).filter(Boolean).slice(0, 3).join(", ");
    const win = resume.experience[0]?.bullets[0]?.replace(/\.$/, "") || "delivered results across the projects I owned";
    const focus = input.jd ? extractKeywords(input.jd).slice(0, 3).map((k) => k.label).join(", ") : skills;
    const name = resume.name || "";
    return (
      `Dear ${input.hiringManager || "Hiring Manager"},\n\n` +
      `I am writing to apply for the ${role} position at ${company}. As ${resume.target ? `a ${resume.target}` : "a candidate"} with hands-on experience in ${skills || "the areas your team works in"}, I was excited to see this opening and believe my background is a strong match.\n\n` +
      `In my recent work I ${win}. That experience maps directly to what this role calls for${focus ? `, particularly ${focus}` : ""}. I focus on owning problems end to end and delivering measurable outcomes, and I would bring that same approach to your team.\n\n` +
      `I am drawn to ${company} and would welcome the chance to contribute. Thank you for considering my application — I would be glad to discuss how my experience fits your needs.\n\n` +
      `Sincerely,\n${name}`
    );
  }

  async interviewPrep(resume: ResumeData, input: { jd: string; role?: string }): Promise<InterviewPrepResult> {
    const kws = extractKeywords(input.jd).slice(0, 6).map((k) => k.label);
    const role = input.role || resume.target || "this role";
    const firstRole = resume.experience[0];
    const firstWin = firstRole?.bullets[0]?.replace(/\.$/, "") || "delivered a key result";
    const q: InterviewQuestion[] = [];

    /* ── From your résumé ──────────────────────────────────────────────
       Cover more than the first role: a second role and a project give
       the candidate distinct stories to prepare rather than one. */
    resume.experience.slice(0, 2).forEach((r, i) => {
      const win = r.bullets?.[0]?.replace(/\.$/, "") || "delivered a key result";
      const where = `${r.role}${r.company ? " at " + r.company : ""}`;
      q.push({
        category: "From Your Résumé",
        question: i === 0
          ? `Tell me about your work as ${where}.`
          : `What was the most challenging part of your time as ${where}?`,
        answer: i === 0
          ? `In my role as ${where}, I ${win}. I owned this end to end, and it's a good example of the kind of impact I'd bring to ${role}.`
          : `The hardest part was balancing competing priorities. Concretely, I ${win} — I'd walk through the trade-offs I made and why.`,
        tip: i === 0
          ? "Lead with scope and impact, then briefly how you did it — keep it under two minutes."
          : "Pick a real difficulty and be honest about the trade-off you chose.",
      });
    });

    const project = resume.projects?.[0];
    if (project) {
      q.push({
        category: "From Your Résumé",
        question: `Walk me through your ${project.name || "featured"} project.`,
        answer: `I'd set out the goal, my specific role, the key technical decisions, and the outcome — including what I'd do differently now.`,
        tip: "State clearly which parts were yours versus the team's.",
      });
    }

    /* ── Role & technical ─────────────────────────────────────────────── */
    kws.slice(0, 4).forEach((k) =>
      q.push({ category: "Role & Technical", question: `Walk me through your hands-on experience with ${k}.`, answer: `I've used ${k} on real projects — I'd describe the setup, the decisions I made, and the outcome, tying it back to a specific result on my résumé.`, tip: "Give a concrete example and the measurable outcome." })
    );
    q.push(
      { category: "Role & Technical", question: `How do you decide between competing approaches when nothing is clearly better?`, answer: "I weigh reversibility, delivery risk and the team's familiarity, then pick the option that's easiest to undo if I'm wrong.", tip: "Show a decision framework, not just an opinion." },
      { category: "Role & Technical", question: "How do you make sure what you ship is actually correct?", answer: "Tests at the level that matters for the risk, plus review and observability once it's live — I'd give a concrete example.", tip: "Tie your answer to something you genuinely do." },
    );

    /* ── Behavioural, situational, fit ─────────────────────────────────── */
    q.push(
      { category: "Behavioral", question: "Tell me about a time you overcame a significant technical challenge.", answer: `Situation: I hit a hard problem in a recent project. Task: I needed to resolve it without slipping the deadline. Action: I diagnosed the root cause and implemented a fix. Result: ${firstWin}.`, tip: "Use STAR and end on a measurable result." },
      { category: "Behavioral", question: "Describe a project you owned end to end.", answer: "I'd pick a real project, set the context and my responsibility, walk through the key decisions, and close with the concrete outcome.", tip: "Be specific about your decisions and the result." },
      { category: "Behavioral", question: "Tell me about a time you disagreed with a colleague.", answer: "I'd describe the disagreement, how I made my case with evidence, and how we resolved it — including where I changed my mind.", tip: "Show you can disagree without it becoming personal." },
      { category: "Behavioral", question: "Describe a time you made a mistake. What happened?", answer: "I'd name the mistake plainly, explain the impact, what I did to fix it, and the specific change I made so it wouldn't recur.", tip: "Own it fully — deflecting reads worse than the mistake." },
      { category: "Situational", question: `How would you approach your first 90 days in ${role}?`, answer: "First 30 days: learn the systems, people, and priorities. Next 30: deliver a meaningful quick win. Final 30: take ownership of a larger initiative.", tip: "Show a learn → deliver → own arc." },
      { category: "Situational", question: "What would you do if you were falling behind on a deadline?", answer: "Flag it early with a revised plan and options — cut scope, add help, or move the date — rather than letting it surface late.", tip: "Emphasise early communication over heroics." },
      { category: "Motivation & Fit", question: `Why do you want this ${role} position?`, answer: `It aligns with my experience in ${kws.slice(0, 2).join(" and ") || "this area"} and the impact I want to have; I'm drawn to the scope and the team.`, tip: "Connect your goals to the role and company specifics." },
      { category: "Motivation & Fit", question: "What are your biggest strengths for this role?", answer: `My strengths map to this role: ${kws.slice(0, 2).join(" and ") || "the core requirements"}, backed by concrete results on my résumé.`, tip: "Pick 2–3 strengths and back each with evidence." },
      { category: "Motivation & Fit", question: "Where do you want to be in three years?", answer: "I'd describe the depth or breadth I want to build and connect it to what this role would let me practise.", tip: "Be ambitious but plausibly tied to this job." },
    );

    const tips = [
      `Research ${role.includes("this") ? "the company" : role + " at this company"} — recent news, products, and the team you'd join.`,
      "Prepare 2–3 STAR stories you can flex to different behavioral questions.",
      "Re-read the job description and map each requirement to a concrete example from your résumé.",
      "Have 3–4 thoughtful questions ready to ask the interviewer.",
    ];
    return { questions: q, tips };
  }

  async tailor(resume: ResumeData, jd: string, intensity: Intensity): Promise<TailorSuggestion[]> {
    const keywords = extractKeywords(jd);
    const { missing } = scoreResume(resume, keywords);
    const text = resumeToText(resume);
    const suggestions: TailorSuggestion[] = [];

    const highMissing = missing.filter((k) => k.prio === "high");
    const medMissing = missing.filter((k) => k.prio === "med");

    // 1. Summary reframe surfacing top missing high-priority signals
    if (resume.summary && highMissing.length) {
      const focus = highMissing.slice(0, 2).map((k) => k.label).join(" and ");
      const after =
        resume.summary.replace(/\.$/, "") +
        (intensity === "creative"
          ? ` Recognized for ${focus.toLowerCase()} that moved core metrics.`
          : ` Strength in ${focus.toLowerCase()}.`);
      suggestions.push({
        id: "sum",
        kind: "edit",
        loc: "Summary",
        note: `Leads with ${focus} that the role emphasizes.`,
        before: resume.summary,
        after,
        keywords: highMissing.slice(0, 2).map((k) => [k.label, k.prio]),
        delta: 6,
      });
    }

    // 2. Add missing keywords to Skills
    const skillAdds = [...highMissing, ...medMissing]
      .filter((k) => !isCovered(k.label, text))
      .slice(0, 3);
    if (skillAdds.length) {
      suggestions.push({
        id: "skills",
        kind: "add",
        loc: "Skills",
        note: "Surfaces required stack keywords missing from your Skills section.",
        add: `Add to Skills: ${skillAdds.map((k) => k.label).join(" · ")}`,
        keywords: skillAdds.map((k) => [k.label, k.prio]),
        delta: skillAdds.length * 2 + 1,
      });
    }

    // 3. Reframe the first experience bullet around a missing signal
    const firstJob = resume.experience[0];
    const bullet = firstJob?.bullets[0];
    const reframe = highMissing[0] ?? medMissing[0];
    if (bullet && reframe) {
      suggestions.push({
        id: "exp0",
        kind: "edit",
        loc: `Experience › ${firstJob.company}`,
        note: `Reframes the achievement around ${reframe.label}.`,
        before: bullet,
        after: bullet.replace(/\.$/, "") + ` — demonstrating ${reframe.label.toLowerCase()}.`,
        keywords: [[reframe.label, reframe.prio]],
        delta: 5,
      });
    }

    // 4. Add a leadership/mentoring bullet if that's the gap
    if (missing.some((k) => k.label === "Mentoring") && firstJob) {
      suggestions.push({
        id: "lead",
        kind: "add",
        loc: `Experience › ${firstJob.company}`,
        note: "Adds the leadership & mentoring signal the role asks for.",
        add: "Mentored engineers and led technical direction, establishing patterns adopted across teams.",
        keywords: [["Mentoring", "high"]],
        delta: 5,
      });
    }

    return suggestions;
  }
}
