import { ResumeData } from './resumeData';
import { resumeToHtml, coverLetterToHtml } from './htmlRender';

/* ============================================================
   Real PDF export via headless Chrome (Puppeteer). Unlike the on-screen
   live preview — which clips each resume to a single A4-shaped box for
   the editor UI — the PDF print stylesheet lets content flow naturally,
   so Chromium's print engine paginates it across multiple real pages
   when a resume is long. A fresh browser is launched per export; this
   app's export volume doesn't justify a persistent browser pool.

   Font sizes/spacing/rules per template are copied verbatim from
   IsynqEcho's css/resume-templates.css. Keep both in sync if that file
   changes — see the note there.
   ============================================================ */

const RESUME_TEMPLATE_CSS = `
.resume { background: #fff; color: #1a1a1a; width: 100%; }
.resume * { box-sizing: border-box; }
.resume p { margin: 0; }
.resume ul { margin: 0; padding: 0; list-style: none; }
.resume .r-name { font-weight: 700; }
.resume .r-contact { color: #333; }
.resume .r-contact span { white-space: nowrap; }
.resume .r-summary { color: #1a1a1a; }
.resume .r-role { font-weight: 700; }
.resume .r-meta { color: #444; }
.resume .r-bullet { position: relative; }
.resume .r-skills b { font-weight: 700; }
.resume .r-skills > div { margin-bottom: 2px; }

.resume--classic { font-family: Georgia, "Times New Roman", Times, serif; font-size: calc(10.5px * var(--rfs, 1)); line-height: 1.42; padding: 0; }
.resume--classic .r-head { text-align: center; padding-bottom: 9px; border-bottom: 1.5px solid #1a1a1a; margin-bottom: 11px; }
.resume--classic .r-name { font-size: calc(24px * var(--rfs, 1)); letter-spacing: 0.5px; }
.resume--classic .r-target { font-size: calc(11.5px * var(--rfs, 1)); color: #333; margin-top: 3px; font-style: italic; }
.resume--classic .r-contact { font-size: calc(10px * var(--rfs, 1)); margin-top: 7px; }
.resume--classic .r-contact span + span::before { content: "  •  "; color: #999; }
.resume--classic .r-section { margin-top: 9px; }
.resume--classic .r-h { font-size: calc(12px * var(--rfs, 1)); font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; border-bottom: 0.75px solid #999; padding-bottom: 2px; margin-bottom: 5px; }
.resume--classic .r-summary { line-height: 1.45; }
.resume--classic .r-job { margin-bottom: 6px; }
.resume--classic .r-job-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.resume--classic .r-role { font-size: calc(11.5px * var(--rfs, 1)); }
.resume--classic .r-meta { font-size: calc(10px * var(--rfs, 1)); font-style: italic; white-space: nowrap; }
.resume--classic .r-sub { font-size: calc(10.5px * var(--rfs, 1)); margin-bottom: 3px; }
.resume--classic ul.r-bullets { margin-top: 2px; }
.resume--classic .r-bullet { padding-left: 14px; margin-bottom: 1.5px; }
.resume--classic .r-bullet::before { content: "•"; position: absolute; left: 2px; }
.resume--classic .r-skills { line-height: 1.6; }

.resume--modern { font-family: Arial, Helvetica, "Liberation Sans", sans-serif; font-size: calc(10.5px * var(--rfs, 1)); line-height: 1.45; padding: 0; color: #1a1a1a; }
.resume--modern .r-head { padding-bottom: 11px; border-bottom: 2px solid #1a1a1a; margin-bottom: 14px; }
.resume--modern .r-name { font-size: calc(23px * var(--rfs, 1)); letter-spacing: -0.3px; }
.resume--modern .r-target { font-size: calc(12px * var(--rfs, 1)); color: #333; margin-top: 2px; font-weight: 700; }
.resume--modern .r-contact { font-size: calc(10px * var(--rfs, 1)); margin-top: 8px; }
.resume--modern .r-contact span + span::before { content: "   |   "; color: #aaa; }
.resume--modern .r-section { margin-top: 15px; }
.resume--modern .r-h { font-size: calc(10.5px * var(--rfs, 1)); font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #1a1a1a; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid #ccc; }
.resume--modern .r-job { margin-bottom: 10px; }
.resume--modern .r-job-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.resume--modern .r-role { font-size: calc(11.5px * var(--rfs, 1)); }
.resume--modern .r-meta { font-size: calc(10px * var(--rfs, 1)); color: #555; white-space: nowrap; }
.resume--modern .r-sub { font-size: calc(10.5px * var(--rfs, 1)); font-weight: 700; color: #333; margin-bottom: 3px; }
.resume--modern ul.r-bullets { margin-top: 3px; }
.resume--modern .r-bullet { padding-left: 14px; margin-bottom: 3px; }
.resume--modern .r-bullet::before { content: "–"; position: absolute; left: 2px; }
.resume--modern .r-skills { line-height: 1.65; }

.resume--compact { font-family: Calibri, Carlito, "Segoe UI", Arial, sans-serif; font-size: calc(10.5px * var(--rfs, 1)); line-height: 1.4; padding: 0; color: #1a1a1a; }
.resume--compact .r-head { margin-bottom: 11px; }
.resume--compact .r-name { font-size: calc(21px * var(--rfs, 1)); }
.resume--compact .r-head-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; border-bottom: 1.5px solid #1a1a1a; padding-bottom: 7px; }
.resume--compact .r-target { font-size: calc(11px * var(--rfs, 1)); color: #444; font-weight: 600; }
.resume--compact .r-contact { font-size: calc(9.5px * var(--rfs, 1)); margin-top: 6px; color: #333; }
.resume--compact .r-contact span + span::before { content: "  ·  "; color: #999; }
.resume--compact .r-section { margin-top: 11px; }
.resume--compact .r-h { font-size: calc(10px * var(--rfs, 1)); font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: #2a2a2a; margin-bottom: 5px; }
.resume--compact .r-job { margin-bottom: 7px; }
.resume--compact .r-job-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.resume--compact .r-role { font-size: calc(11px * var(--rfs, 1)); }
.resume--compact .r-meta { font-size: calc(9.5px * var(--rfs, 1)); color: #555; white-space: nowrap; }
.resume--compact .r-sub { font-size: calc(10px * var(--rfs, 1)); color: #333; margin-bottom: 2px; }
.resume--compact ul.r-bullets { margin-top: 1px; }
.resume--compact .r-bullet { padding-left: 12px; margin-bottom: 2px; }
.resume--compact .r-bullet::before { content: "•"; position: absolute; left: 2px; }
.resume--compact .r-skills { line-height: 1.55; }

.resume--executive { font-family: Georgia, "Times New Roman", Times, serif; font-size: calc(10.5px * var(--rfs, 1)); line-height: 1.5; padding: 0; color: #1a1a1a; }
.resume--executive .r-head { text-align: center; padding-bottom: 12px; border-bottom: 3px double #1f3a5f; margin-bottom: 15px; }
.resume--executive .r-name { font-size: calc(25px * var(--rfs, 1)); letter-spacing: 1.5px; color: #1f3a5f; text-transform: uppercase; }
.resume--executive .r-target { font-size: calc(10.5px * var(--rfs, 1)); color: #444; margin-top: 5px; letter-spacing: 2px; text-transform: uppercase; }
.resume--executive .r-contact { font-size: calc(10px * var(--rfs, 1)); margin-top: 8px; color: #333; }
.resume--executive .r-contact span + span::before { content: "  •  "; color: #1f3a5f; }
.resume--executive .r-section { margin-top: 14px; }
.resume--executive .r-h { font-size: calc(11.5px * var(--rfs, 1)); font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: #1f3a5f; border-bottom: 0.75px solid #1f3a5f; padding-bottom: 3px; margin-bottom: 8px; }
.resume--executive .r-job { margin-bottom: 9px; }
.resume--executive .r-job-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.resume--executive .r-role { font-size: calc(11.5px * var(--rfs, 1)); }
.resume--executive .r-meta { font-size: calc(10px * var(--rfs, 1)); font-style: italic; color: #555; white-space: nowrap; }
.resume--executive .r-sub { font-size: calc(10.5px * var(--rfs, 1)); font-style: italic; color: #333; margin-bottom: 3px; }
.resume--executive ul.r-bullets { margin-top: 2px; }
.resume--executive .r-bullet { padding-left: 14px; margin-bottom: 2.5px; }
.resume--executive .r-bullet::before { content: "›"; position: absolute; left: 3px; color: #1f3a5f; font-weight: 700; }
.resume--executive .r-skills { line-height: 1.6; }

.resume--elegant { font-family: "Helvetica Neue", Arial, "Liberation Sans", sans-serif; font-size: calc(10.5px * var(--rfs, 1)); line-height: 1.5; padding: 0; color: #222; }
.resume--elegant .r-head { padding-bottom: 12px; margin-bottom: 16px; border-bottom: 1px solid #ddd; }
.resume--elegant .r-name { font-size: calc(26px * var(--rfs, 1)); font-weight: 300; letter-spacing: 1px; color: #111; }
.resume--elegant .r-target { font-size: calc(11.5px * var(--rfs, 1)); color: #0f6f6a; margin-top: 3px; font-weight: 600; letter-spacing: 0.5px; }
.resume--elegant .r-contact { font-size: calc(10px * var(--rfs, 1)); margin-top: 9px; color: #555; }
.resume--elegant .r-contact span + span::before { content: "   ·   "; color: #0f6f6a; }
.resume--elegant .r-section { margin-top: 16px; }
.resume--elegant .r-h { font-size: calc(11px * var(--rfs, 1)); font-weight: 700; letter-spacing: 1.8px; text-transform: uppercase; color: #0f6f6a; margin-bottom: 8px; padding-left: 9px; border-left: 3px solid #0f6f6a; }
.resume--elegant .r-job { margin-bottom: 11px; }
.resume--elegant .r-job-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.resume--elegant .r-role { font-size: calc(11.5px * var(--rfs, 1)); font-weight: 700; }
.resume--elegant .r-meta { font-size: calc(10px * var(--rfs, 1)); color: #888; white-space: nowrap; }
.resume--elegant .r-sub { font-size: calc(10.5px * var(--rfs, 1)); color: #0f6f6a; margin-bottom: 4px; }
.resume--elegant ul.r-bullets { margin-top: 3px; }
.resume--elegant .r-bullet { padding-left: 14px; margin-bottom: 3px; }
.resume--elegant .r-bullet::before { content: "–"; position: absolute; left: 2px; color: #0f6f6a; }
.resume--elegant .r-skills { line-height: 1.7; }

.resume--developer { font-family: "Helvetica Neue", Arial, sans-serif; font-size: calc(10.5px * var(--rfs, 1)); line-height: 1.45; padding: 0; color: #1a1a1a; }
.resume--developer .r-head { margin-bottom: 13px; }
.resume--developer .r-head-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; border-bottom: 2px solid #3b4a5a; padding-bottom: 8px; }
.resume--developer .r-name { font-size: calc(22px * var(--rfs, 1)); color: #3b4a5a; }
.resume--developer .r-target { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: calc(10px * var(--rfs, 1)); color: #0a7d5a; font-weight: 500; }
.resume--developer .r-contact { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: calc(9px * var(--rfs, 1)); margin-top: 7px; color: #555; }
.resume--developer .r-contact span + span::before { content: "  /  "; color: #0a7d5a; }
.resume--developer .r-section { margin-top: 12px; }
.resume--developer .r-h { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: calc(10px * var(--rfs, 1)); font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: #3b4a5a; margin-bottom: 6px; }
.resume--developer .r-h::before { content: "# "; color: #0a7d5a; }
.resume--developer .r-job { margin-bottom: 8px; }
.resume--developer .r-job-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.resume--developer .r-role { font-size: calc(11px * var(--rfs, 1)); }
.resume--developer .r-meta { font-family: ui-monospace, "SF Mono", Menlo, monospace; font-size: calc(9px * var(--rfs, 1)); color: #666; white-space: nowrap; }
.resume--developer .r-sub { font-size: calc(10px * var(--rfs, 1)); color: #0a7d5a; margin-bottom: 2px; }
.resume--developer ul.r-bullets { margin-top: 2px; }
.resume--developer .r-bullet { padding-left: 13px; margin-bottom: 2.5px; }
.resume--developer .r-bullet::before { content: "▹"; position: absolute; left: 2px; color: #0a7d5a; }
.resume--developer .r-skills { line-height: 1.6; }

/* ---- New Pro templates (print mirror of resume-templates.css) ----
   padding:0 here — the @page margin supplies the outer whitespace. */
.resume--twocol { font-family: "Helvetica Neue", Arial, "Liberation Sans", sans-serif; font-size: calc(11px * var(--rfs, 1)); line-height: 1.4; color: #1a1a1a; padding: 0; }
.resume--twocol .r-name { font-weight: 700; }
.resume--twocol .r-two { display: flex; gap: 16px; align-items: stretch; }
.resume--twocol .r-col-side { flex: 0 0 33%; min-width: 0; }
.resume--twocol .r-col-main { flex: 1; min-width: 0; }
.resume--twocol .r-section { margin-top: 11px; }
.resume--twocol .r-col > .r-section:first-child { margin-top: 0; }
.resume--twocol .r-h { font-size: calc(10.5px * var(--rfs, 1)); font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; }
.resume--twocol .r-job { margin-bottom: 8px; }
.resume--twocol .r-job-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
.resume--twocol .r-role { font-size: calc(11px * var(--rfs, 1)); font-weight: 700; }
.resume--twocol .r-meta { font-size: calc(9.5px * var(--rfs, 1)); color: #666; white-space: nowrap; }
.resume--twocol .r-sub { font-size: calc(10px * var(--rfs, 1)); color: #555; margin-bottom: 2px; }
.resume--twocol ul.r-bullets { margin-top: 2px; }
.resume--twocol .r-bullet { padding-left: 12px; margin-bottom: 2px; }
.resume--twocol .r-bullet::before { content: "•"; position: absolute; left: 2px; }
.resume--twocol .r-skills { line-height: 1.5; }
.resume--twocol .r-skills > div { margin-bottom: 3px; }

.resume--sidebar .r-head { padding-bottom: 9px; border-bottom: 2px solid #1f2a37; margin-bottom: 13px; }
.resume--sidebar .r-name { font-size: calc(22px * var(--rfs, 1)); color: #1f2a37; }
.resume--sidebar .r-target { font-size: calc(11px * var(--rfs, 1)); color: #555; font-weight: 700; margin-top: 2px; }
.resume--sidebar .r-contact { font-size: calc(9px * var(--rfs, 1)); color: #444; margin-top: 6px; }
.resume--sidebar .r-contact span + span::before { content: "  •  "; color: #aaa; }
.resume--sidebar .r-col-side { background: #1f2a37; color: #fff; border-radius: 5px; padding: 13px 12px; }
.resume--sidebar .r-col-main { padding-left: 5px; }
.resume--sidebar .r-h { color: #1f2a37; border-bottom: 1px solid #d5d5d5; padding-bottom: 3px; }
.resume--sidebar .r-col-side .r-h { color: #fff; border-bottom-color: rgba(255,255,255,.28); }
.resume--sidebar .r-col-side .r-role, .resume--sidebar .r-col-side .r-skills b { color: #fff; }
.resume--sidebar .r-col-side .r-sub, .resume--sidebar .r-col-side .r-meta { color: rgba(255,255,255,.72); }
.resume--sidebar .r-col-side .r-skills, .resume--sidebar .r-col-side .r-bullet { color: rgba(255,255,255,.9); }

.resume--split .r-head { padding-bottom: 10px; border-bottom: 1px solid #ddd; margin-bottom: 13px; }
.resume--split .r-name { font-size: calc(23px * var(--rfs, 1)); font-weight: 300; color: #111; letter-spacing: .5px; }
.resume--split .r-target { font-size: calc(11px * var(--rfs, 1)); color: #0f6f6a; font-weight: 600; margin-top: 2px; }
.resume--split .r-contact { font-size: calc(9.5px * var(--rfs, 1)); color: #555; margin-top: 7px; }
.resume--split .r-contact span + span::before { content: "  ·  "; color: #0f6f6a; }
.resume--split .r-col-side { order: 2; flex: 0 0 34%; border-left: 1px solid #e4e2dc; padding-left: 13px; }
.resume--split .r-col-main { order: 1; }
.resume--split .r-h { color: #0f6f6a; border-left: 3px solid #0f6f6a; padding-left: 8px; }
.resume--split .r-bullet::before { color: #0f6f6a; }

.resume--corporate .r-head { text-align: center; padding: 11px 10px; margin-bottom: 14px; background: #f2f1ec; border-top: 3px solid #1f3a5f; border-radius: 2px; }
.resume--corporate .r-name { font-size: calc(23px * var(--rfs, 1)); color: #1f3a5f; letter-spacing: .5px; }
.resume--corporate .r-target { font-size: calc(10.5px * var(--rfs, 1)); color: #555; font-weight: 600; margin-top: 3px; text-transform: uppercase; letter-spacing: 1px; }
.resume--corporate .r-contact { font-size: calc(9.5px * var(--rfs, 1)); color: #444; margin-top: 6px; }
.resume--corporate .r-contact span + span::before { content: "  •  "; color: #1f3a5f; }
.resume--corporate .r-col-side { flex: 0 0 32%; }
.resume--corporate .r-h { color: #1f3a5f; border-bottom: 1.5px solid #1f3a5f; padding-bottom: 2px; }
.resume--corporate .r-bullet::before { color: #1f3a5f; }

.resume--bold { font-family: "Helvetica Neue", Arial, sans-serif; font-size: calc(10.5px * var(--rfs, 1)); line-height: 1.45; color: #1a1a1a; padding: 0; }
.resume--bold .r-head { background: #0a0a0a; color: #fff; padding: 13px 15px; margin-bottom: 14px; border-radius: 3px; }
.resume--bold .r-name { font-size: calc(23px * var(--rfs, 1)); font-weight: 800; letter-spacing: -.3px; }
.resume--bold .r-target { font-size: calc(11px * var(--rfs, 1)); color: rgba(255,255,255,.85); font-weight: 700; margin-top: 3px; }
.resume--bold .r-contact { font-size: calc(9.5px * var(--rfs, 1)); color: rgba(255,255,255,.72); margin-top: 8px; }
.resume--bold .r-contact span + span::before { content: "   |   "; color: rgba(255,255,255,.4); }
.resume--bold .r-section { margin-top: 13px; }
.resume--bold .r-h { display: inline-block; font-size: calc(10px * var(--rfs, 1)); font-weight: 800; letter-spacing: 1px; text-transform: uppercase; color: #fff; background: #0a0a0a; padding: 3px 9px; margin-bottom: 7px; border-radius: 2px; }
.resume--bold .r-job { margin-bottom: 9px; }
.resume--bold .r-job-top { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
.resume--bold .r-role { font-size: calc(11px * var(--rfs, 1)); font-weight: 700; }
.resume--bold .r-meta { font-size: calc(9.5px * var(--rfs, 1)); color: #555; white-space: nowrap; }
.resume--bold .r-sub { font-size: calc(10px * var(--rfs, 1)); color: #444; margin-bottom: 3px; }
.resume--bold ul.r-bullets { margin-top: 2px; }
.resume--bold .r-bullet { padding-left: 13px; margin-bottom: 2.5px; }
.resume--bold .r-bullet::before { content: "▪"; position: absolute; left: 2px; }
.resume--bold .r-skills { line-height: 1.6; }
`;

const COVER_LETTER_CSS = `
.cl-doc { font-family: Georgia, "Times New Roman", serif; font-size: calc(12px * var(--rfs, 1)); line-height: 1.7; color: #1a1a1a; }
.cl-name { font-weight: 700; font-size: calc(15px * var(--rfs, 1)); margin-bottom: 4px; }
.cl-contact { color: #444; font-size: calc(10.5px * var(--rfs, 1)); margin-bottom: 14px; }
.cl-date { margin-bottom: 14px; }
.cl-doc p { margin: 0 0 12px; }
`;

function pageHtml(bodyHtml: string, css: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  @page { size: A4; margin: 14mm 12mm; }
  body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  ${css}
</style></head><body>${bodyHtml}</body></html>`;
}

async function renderPdf(html: string): Promise<Buffer> {
  const puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function buildResumePdf(data: ResumeData, variant: string): Promise<Buffer> {
  const html = pageHtml(resumeToHtml(data, variant), RESUME_TEMPLATE_CSS);
  return renderPdf(html);
}

export async function buildCoverLetterPdf(opts: { name: string; contact: string[]; body: string }): Promise<Buffer> {
  const html = pageHtml(coverLetterToHtml(opts), COVER_LETTER_CSS);
  return renderPdf(html);
}
