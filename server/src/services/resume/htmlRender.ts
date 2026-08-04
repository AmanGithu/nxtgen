import { ResumeData, resolveSectionOrder } from './resumeData';

/* ============================================================
   Server-side HTML renderer for a resume — used to build the source
   document Puppeteer prints to PDF. Mirrors IsynqEcho's
   js/resumeRender.js (client-side live preview) row-for-row so the
   exported PDF matches what the user saw on screen. Keep the two in
   sync if the resume schema changes.
   ============================================================ */

function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

function jobBlock(role: string, meta: string, sub: string, bullets: string[] | null): string {
  return `
    <div class="r-job">
      <div class="r-job-top"><div class="r-role">${esc(role)}</div>${meta ? `<div class="r-meta">${esc(meta)}</div>` : ''}</div>
      ${sub && sub.trim() ? `<div class="r-sub">${esc(sub)}</div>` : ''}
      ${bullets && bullets.length ? `<ul class="r-bullets">${bullets.map((b) => `<li class="r-bullet">${esc(b)}</li>`).join('')}</ul>` : ''}
    </div>`;
}

function heading(title: string): string {
  return `<section class="r-section"><div class="r-h">${esc(title)}</div></section>`;
}

/** Builds the inner HTML of a single ATS-safe resume document (unclipped —
    the print stylesheet lets it flow across as many PDF pages as needed). */
export function resumeToHtml(data: ResumeData, variant: string): string {
  const rowHeader = variant === 'compact' || variant === 'developer';
  const contact = (data.contact || []).filter((c) => c && c.trim());
  const contactHtml = contact.length ? `<div class="r-contact">${contact.map((c) => `<span>${esc(c)}</span>`).join('')}</div>` : '';

  const head = rowHeader
    ? `<header class="r-head"><div class="r-head-row"><div class="r-name">${esc(data.name)}</div><div class="r-target">${esc(data.target)}</div></div>${contactHtml}</header>`
    : `<header class="r-head"><div class="r-name">${esc(data.name)}</div><div class="r-target">${esc(data.target)}</div>${contactHtml}</header>`;

  const emit: Record<string, () => string> = {
    summary: () => {
      if (!data.summary || !data.summary.trim()) return '';
      return heading('Summary') + `<p class="r-summary">${esc(data.summary)}</p>`;
    },
    experience: () => {
      if (!data.experience || !data.experience.length) return '';
      return heading('Experience') + data.experience.map((job) => {
        const bullets = (job.bullets || []).filter((b) => b.trim());
        const sub = [job.company, job.location].filter((s) => s && s.trim()).join(' — ');
        return jobBlock(job.role, job.meta, sub, bullets);
      }).join('');
    },
    projects: () => {
      if (!data.projects || !data.projects.length) return '';
      return heading('Projects') + data.projects.map((p) => {
        const bullets = (p.bullets || []).filter((b) => b.trim());
        const sub = bullets.length ? '' : (p.description || '');
        return jobBlock(p.name, p.meta || '', sub, bullets);
      }).join('');
    },
    skills: () => {
      const rows = (data.skills || []).filter(([l, v]) => (l && l.trim()) || (v && v.trim()));
      if (!rows.length) return '';
      return heading('Skills') + `<div class="r-skills">${rows.map(([label, value]) =>
        `<div>${label && label.trim() ? `<b>${esc(label)}:</b> ` : ''}${esc(value)}</div>`).join('')}</div>`;
    },
    education: () => {
      if (!data.education || !data.education.length) return '';
      return heading('Education') + data.education.map((e) => jobBlock(e.degree, e.meta, e.school, null)).join('');
    },
    certifications: () => {
      if (!data.certifications || !data.certifications.length) return '';
      return heading('Certifications') + data.certifications.map((c) => jobBlock(c.name, c.meta, c.issuer, null)).join('');
    },
  };

  const customById = new Map((data.custom || []).map((c) => [`custom:${c.id}`, c]));
  const renderKey = (key: string): string => {
    if (key.startsWith('custom:')) {
      const c = customById.get(key);
      const items = c ? c.items.filter((i) => i.trim()) : [];
      if (!c || (!c.title.trim() && !items.length)) return '';
      return heading(c.title || 'Section') + (items.length ? `<ul class="r-bullets">${items.map((b) => `<li class="r-bullet">${esc(b)}</li>`).join('')}</ul>` : '');
    }
    return emit[key] ? emit[key]() : '';
  };

  const order = resolveSectionOrder(data);

  // user text scale (1 = template default) via the --rfs CSS variable
  const scale = typeof data.fontScale === 'number' && data.fontScale > 0 ? data.fontScale : 1;
  const styleAttr = scale !== 1 ? ` style="--rfs:${scale}"` : '';

  // Two-column Pro templates: side rail = Skills/Education/Certifications,
  // main = everything else, each in the user's order. Mirrors the React
  // resumeTwoColumn() so the PDF matches the on-screen preview.
  const TWO_COL = new Set(['sidebar', 'split', 'corporate']);
  if (TWO_COL.has(variant || '')) {
    const SIDE = new Set(['skills', 'education', 'certifications']);
    const side = order.filter((k) => SIDE.has(k)).map(renderKey).join('');
    const main = order.filter((k) => !SIDE.has(k)).map(renderKey).join('');
    return `<div class="resume resume--${esc(variant)} resume--twocol"${styleAttr}>${head}<div class="r-two"><aside class="r-col r-col-side">${side}</aside><main class="r-col r-col-main">${main}</main></div></div>`;
  }

  const body = order.map(renderKey).join('');
  return `<div class="resume resume--${esc(variant || 'classic')}"${styleAttr}>${head}${body}</div>`;
}

/** Business-letter HTML for a cover letter export (name/contact letterhead,
    date, blank-line-separated body paragraphs). */
export function coverLetterToHtml(opts: { name: string; contact: string[]; body: string }): string {
  const contact = opts.contact.filter((c) => c.trim());
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const paragraphs = opts.body.split(/\n\s*\n/).map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  return `
    <div class="cl-doc">
      ${opts.name ? `<div class="cl-name">${esc(opts.name)}</div>` : ''}
      ${contact.length ? `<div class="cl-contact">${contact.map(esc).join(' &nbsp;•&nbsp; ')}</div>` : ''}
      <div class="cl-date">${date}</div>
      ${paragraphs}
    </div>`;
}
