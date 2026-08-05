import type { ResumeData } from "./resumeData";

/* ============================================================
   Deterministic ATS scoring — no LLM required.
   Extracts known skill/keyword signals from a job description,
   matches them against the resume text, and scores coverage.
   ============================================================ */

export type Prio = "high" | "med";
export interface JdKeyword {
  label: string;
  prio: Prio;
}

/* Multi-domain skill lexicon. Each row is [label, ...aliases]; the label
   (lowercased) is matched too. Covers cloud/devops, backend, frontend,
   data/ML, security, languages and practices so scoring works for any field.
   Unknown but obviously-technical tokens (acronyms, dotted/slashed names) are
   picked up by a generic pass in extractKeywords(). */
type Lex = [string, ...string[]];
const LEXICON: Lex[] = [
  // cloud & infrastructure
  ["AWS", "amazon web services"], ["GCP", "google cloud"], ["Azure", "microsoft azure"],
  ["Terraform"], ["CloudFormation"], ["Pulumi"], ["Ansible"], ["Packer"],
  ["Infrastructure as Code", "iac"], ["Linux", "unix"], ["Serverless", "lambda", "aws lambda"],
  ["Nginx"], ["Networking", "vpc", "load balancing", "dns"], ["EC2"], ["S3"], ["RDS"], ["CloudWatch"],
  // containers & orchestration
  ["Docker"], ["Kubernetes", "k8s"], ["Helm"], ["EKS"], ["GKE"], ["OpenShift"], ["Containers", "containerization"],
  // ci/cd
  ["CI/CD", "continuous integration", "continuous delivery", "continuous deployment"],
  ["Jenkins"], ["GitHub Actions"], ["GitLab CI", "gitlab-ci"], ["CircleCI"], ["Argo CD", "argocd"], ["GitOps"], ["Spinnaker"],
  // monitoring / reliability
  ["Prometheus"], ["Grafana"], ["Datadog"], ["ELK", "elasticsearch", "kibana", "logstash"], ["Splunk"],
  ["Observability", "monitoring", "alerting"], ["OpenTelemetry", "otel"], ["SRE", "site reliability"],
  ["Incident response", "on-call", "mttr", "slo"],
  // security
  ["Security"], ["IAM", "identity and access"], ["Compliance", "cis", "nist", "soc2", "gdpr", "hipaa"],
  ["Vault", "secrets management"], ["SonarQube"], ["Trivy"], ["Snyk"], ["OWASP"], ["Penetration testing", "pentest", "vulnerability"],
  // languages
  ["Python"], ["Bash", "shell scripting"], ["Go", "golang"], ["Java"], ["JavaScript"], ["TypeScript"],
  ["Ruby"], ["C++"], ["C#", ".net"], ["PHP"], ["Scala"], ["Rust"], ["SQL"],
  // backend
  ["Node.js", "nodejs"], ["Express"], ["Django"], ["Flask"], ["FastAPI"], ["Spring", "spring boot"], ["Rails", "ruby on rails"],
  ["GraphQL"], ["REST APIs", "rest api", "restful"], ["Microservices"], ["gRPC"], ["Kafka"], ["RabbitMQ"], ["Redis"],
  // databases
  ["PostgreSQL", "postgres"], ["MySQL"], ["MongoDB", "mongo"], ["DynamoDB"], ["Cassandra"],
  // frontend
  ["React", "react.js", "reactjs"], ["Vue", "vue.js"], ["Angular"], ["Next.js", "nextjs"], ["Svelte"],
  ["Redux", "state management"], ["HTML", "html5"], ["CSS", "scss", "sass"], ["Tailwind"], ["Webpack"], ["Vite"],
  ["Design systems", "design system"], ["Accessibility", "wcag", "a11y"], ["Core Web Vitals", "web vitals"],
  // data / ml
  ["Machine Learning"], ["Deep Learning"], ["TensorFlow"], ["PyTorch"], ["Pandas"], ["NumPy"],
  ["Spark", "apache spark"], ["Airflow"], ["ETL", "elt"], ["NLP", "natural language"], ["Snowflake"], ["dbt"], ["Tableau"], ["Power BI"],
  // practices
  ["Agile", "scrum", "kanban"], ["TDD", "test-driven"], ["Testing", "unit test", "integration test", "jest", "pytest", "cypress", "selenium", "playwright"],
  ["Code review"], ["Mentoring", "mentor", "mentored"], ["Leadership", "technical direction"],
  ["Performance optimization", "performance tuning"], ["Scalability", "scalable", "high availability"],
  ["Automation", "automate"], ["Git", "github", "gitlab", "bitbucket"],
];

const LEX_MAP = new Map<string, string[]>();
for (const [label, ...aliases] of LEXICON) LEX_MAP.set(label, [label.toLowerCase(), ...aliases]);

const STOP_TOKENS = new Set([
  "AND", "THE", "FOR", "WITH", "YOU", "OUR", "ARE", "ALL", "NOT", "WILL", "PTO", "USA", "EU", "UK",
  "US", "HR", "OK", "FAQ", "CEO", "CTO", "VP", "CI", "CD", "ID", "OS", "AM", "PM", "EG", "IE", "ETC",
  // degree / education acronyms (noise from JD requirements)
  "BS", "BA", "MS", "MA", "BSC", "MSC", "PHD", "MBA", "GPA", "CGPA", "BTECH", "MTECH", "BE", "ME",
]);

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** count occurrences of `term` in `haystack` (both lowercased), with
   alphanumeric word boundaries so "go" doesn't match "good". */
function countTerm(haystack: string, term: string): number {
  const t = term.toLowerCase().trim();
  if (!t) return 0;
  const bounded = /^[a-z0-9].*[a-z0-9]$/.test(t) || /^[a-z0-9]$/.test(t);
  const re = bounded
    ? new RegExp(`(?<![a-z0-9+#.])${escapeRe(t)}(?![a-z0-9+#.])`, "g")
    : new RegExp(escapeRe(t), "g");
  return (haystack.match(re) || []).length;
}

export function resumeToText(r: ResumeData): string {
  return [
    r.name,
    r.target,
    r.summary,
    ...r.experience.flatMap((e) => [e.role, e.company, e.location, ...e.bullets]),
    ...r.skills.flatMap((s) => [s[0], s[1]]),
    ...r.education.flatMap((e) => [e.degree, e.school]),
    ...(r.projects ?? []).flatMap((p) => [p.name, p.description ?? "", ...(p.bullets ?? [])]),
    ...(r.certifications ?? []).flatMap((c) => [c.name, c.issuer]),
    ...(r.custom ?? []).flatMap((c) => [c.title, ...c.items]),
  ]
    .join(" \n ")
    .toLowerCase();
}

/** Pull the notable, matchable keywords out of a job description.
   Combines the multi-domain lexicon with a generic pass for technical
   tokens (acronyms, dotted/slashed names). Priority is driven by how often
   a term appears in the posting (mentioned 2+ times → high). */
export function extractKeywords(jd: string): JdKeyword[] {
  const text = jd.toLowerCase();
  const out: JdKeyword[] = [];
  const seen = new Set<string>();

  // 1) lexicon matches
  for (const [label, ...aliases] of LEXICON) {
    let count = countTerm(text, label.toLowerCase());
    for (const a of aliases) count += countTerm(text, a);
    if (count > 0 && !seen.has(label.toLowerCase())) {
      seen.add(label.toLowerCase());
      out.push({ label, prio: count >= 2 ? "high" : "med" });
    }
  }

  // 2) generic technical tokens: acronyms (2–6 caps) and dotted/slashed names
  const generic = jd.match(/\b([A-Za-z][A-Za-z0-9]*(?:[./][A-Za-z0-9]+)+|[A-Z]{2,6})\b/g) || [];
  for (const tok of generic) {
    const low = tok.toLowerCase();
    if (seen.has(low) || STOP_TOKENS.has(tok.toUpperCase()) || low.length < 2) continue;
    // dotted/slashed tokens are only kept when short tech names (CI/CD, Node.js)
    // — skip long phrase-slashes like "Actions/Jenkins" or "security/compliance"
    if ((tok.includes("/") || tok.includes(".")) && tok.length > 8) continue;
    const count = countTerm(text, low);
    seen.add(low);
    out.push({ label: tok, prio: count >= 2 ? "high" : "med" });
  }

  // keep it manageable: high priority first, cap the list
  out.sort((a, b) => (a.prio === b.prio ? 0 : a.prio === "high" ? -1 : 1));
  return out.slice(0, 28);
}

export function isCovered(label: string, resumeText: string): boolean {
  const aliases = LEX_MAP.get(label) ?? [label.toLowerCase()];
  return aliases.some((a) => countTerm(resumeText, a) > 0);
}

export interface AtsResult {
  score: number;
  matched: number;
  total: number;
  missing: JdKeyword[];
}

export interface ReadinessResult {
  score: number;
  label: string;
  tips: string[];
}

const ACTION_VERB =
  /^(led|built|designed|developed|architected|engineered|implemented|automated|migrated|optimized|reduced|increased|improved|launched|shipped|created|delivered|managed|owned|drove|scaled|deployed|integrated|established|mentored|spearheaded|streamlined|refactored|orchestrated|provisioned|configured|reworked|cut|grew|boosted|accelerated)\b/i;

/** Job-agnostic resume quality/readiness score (0–100), computed live from
   the resume content. Rewards breadth, quantified impact and strong verbs,
   so a sparse single-role resume lands in the 70s, not 100. */
export function scoreReadiness(r: ResumeData): ReadinessResult {
  const tips: string[] = [];
  let score = 0;

  // contact — 12
  const contactStr = r.contact.join(" ");
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.-]+/.test(contactStr);
  const hasPhoneOrLink = /\d[\d\s().-]{6,}\d/.test(contactStr) || /(linkedin|github|https?:|\.com|\.io|\.dev)/i.test(contactStr);
  if (hasEmail) score += 6; else tips.push("Add a contact email");
  if (hasPhoneOrLink) score += 6; else tips.push("Add a phone number or profile link");

  // summary — 14 (rewards a substantial 2–3 sentence summary)
  const sLen = r.summary.trim().length;
  score += sLen >= 80 ? 14 : sLen >= 40 ? 10 : sLen > 0 ? 5 : 0;
  if (sLen < 80) tips.push("Write a fuller 2–3 sentence professional summary");

  // experience breadth — 14
  const roles = r.experience.filter((e) => e.role.trim() || e.company.trim()).length;
  score += roles >= 3 ? 14 : roles === 2 ? 12 : roles === 1 ? 8 : 0;
  if (roles === 0) tips.push("Add at least one work experience");

  // highlights volume — 16
  const bullets = r.experience.flatMap((e) => e.bullets).filter((b) => b.trim().length > 10);
  score += Math.min(16, bullets.length * 2.5);
  if (bullets.length < 5) tips.push("Add more experience highlights");

  // quantified impact — 16
  const quantified = bullets.filter((b) => /\d/.test(b)).length;
  score += Math.min(16, quantified * 4);
  if (quantified < 3) tips.push("Quantify more achievements with numbers or %");

  // strong action verbs — 8
  const strongVerbs = bullets.filter((b) => ACTION_VERB.test(b.trim())).length;
  score += Math.min(8, strongVerbs * 1.5);
  if (bullets.length && strongVerbs < Math.max(2, bullets.length * 0.5)) tips.push("Start highlights with strong action verbs (Led, Built, Reduced…)");

  // skills — 12
  const skillGroups = r.skills.filter(([, v]) => v.trim()).length;
  score += skillGroups >= 2 ? 12 : skillGroups === 1 ? 8 : 0;
  if (skillGroups === 0) tips.push("Add a skills section");

  // education — 8
  if (r.education.some((e) => e.degree.trim())) score += 8;
  else tips.push("Add your education");

  score = Math.max(0, Math.min(100, Math.round(score)));
  const label =
    score >= 85 ? "Strong & readable" : score >= 70 ? "Good — almost there" : score >= 50 ? "Getting there" : "Needs work";
  return { score, label, tips: tips.slice(0, 3) };
}

/** Coverage-based score: 50 (parses cleanly) + up to 45 for keyword match. */
export function scoreResume(resume: ResumeData, keywords: JdKeyword[]): AtsResult {
  const text = resumeToText(resume);
  const missing: JdKeyword[] = [];
  let matched = 0;
  for (const kw of keywords) {
    if (isCovered(kw.label, text)) matched++;
    else missing.push(kw);
  }
  const total = keywords.length;
  const coverage = total ? matched / total : 0;
  const score = Math.round(50 + coverage * 45);
  return { score, matched, total, missing };
}

/* Generic role profile used when no job description is supplied.
   Kept in sync with the client copy in lib/resume/ats.ts. */
export const GENERIC_JD = `
We are hiring an experienced engineer to design, build and ship reliable software
in a collaborative, agile team.

Responsibilities
- Design, develop and maintain production services and user-facing features end to end
- Write clean, well-tested code and take an active part in code review
- Build and maintain CI/CD pipelines and automate repetitive manual work
- Work with REST APIs, SQL databases and cloud infrastructure on AWS
- Monitor production systems, respond to incidents and improve reliability
- Partner with product and design stakeholders and document your work clearly
- Mentor teammates and help set technical direction

Requirements
- Strong programming skills in Python, JavaScript or TypeScript
- Hands-on experience with Git, Docker and cloud platforms
- Familiarity with testing, performance optimization and scalability
- Agile and Scrum delivery experience
- A track record of ownership, leadership and measurable impact
`;
