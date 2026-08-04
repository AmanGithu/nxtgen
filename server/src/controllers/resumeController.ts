import { Response } from 'express';
import { ResumeService } from '../services/resumeService';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import { entitlementService } from '../services/entitlementService';
import { FEATURE } from '../lib/entitlements';

const resumeService = new ResumeService();

/** Ledger charges throw a plain Error when the user is out of credits —
    surface that as 402 rather than a generic 500. */
function handleError(res: Response, action: string, error: any, userId?: string) {
  logger.error(`${action} error for user ${userId}: ${error.message}`);
  /* Prefer the status the error carries. The message sniffing below is a
     fallback for plain Errors thrown deeper in the service layer — without
     the statusCode branch, a deliberate 402 from an entitlement check would
     be reported to the client as a 500 server fault. */
  const status =
    typeof error.statusCode === 'number'
      ? error.statusCode
      : /not enough credits/i.test(error.message)
        ? 402
        : /not found/i.test(error.message)
          ? 404
          : 500;
  res.status(status).json({ message: error.message, ...(error.details ?? {}) });
}

export const listResumes = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    res.json(await resumeService.listResumes(userId));
  } catch (error: any) { handleError(res, 'List resumes', error, userId); }
};

export const getResume = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const resume = await resumeService.getResume(req.params.id as string, userId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });
    res.json(resume);
  } catch (error: any) { handleError(res, 'Get resume', error, userId); }
};

export const createResume = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    await entitlementService.assertCanCreateResume(userId);
    const { title, template, data } = req.body ?? {};
    await entitlementService.assertCanUseTemplate(userId, template);
    res.status(201).json(await resumeService.createResume(userId, { title, template, data }));
  } catch (error: any) { handleError(res, 'Create resume', error, userId); }
};

export const updateResume = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { data, template, title } = req.body;
    await entitlementService.assertCanUseTemplate(userId, template);
    await resumeService.updateResume(req.params.id as string, userId, { data, template, title });
    res.status(204).send();
  } catch (error: any) { handleError(res, 'Update resume', error, userId); }
};

export const renameResume = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: 'title is required' });
    await resumeService.renameResume(req.params.id as string, userId, title);
    res.status(204).send();
  } catch (error: any) { handleError(res, 'Rename resume', error, userId); }
};

export const deleteResume = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    await resumeService.deleteResume(req.params.id as string, userId);
    res.status(204).send();
  } catch (error: any) { handleError(res, 'Delete resume', error, userId); }
};

export const duplicateResume = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const r = await resumeService.duplicateResume(req.params.id as string, userId);
    if (!r) return res.status(404).json({ message: 'Resume not found' });
    res.status(201).json(r);
  } catch (error: any) { handleError(res, 'Duplicate resume', error, userId); }
};

export const importResume = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { fileBase64, fileName, mimeType, source } = req.body;
    if (!fileBase64 || !fileName) return res.status(400).json({ message: 'fileBase64 and fileName are required' });
    const buffer = Buffer.from(fileBase64, 'base64');
    const r = await resumeService.importResume(userId, buffer, fileName, mimeType || '', source === 'linkedin');
    res.status(201).json(r);
  } catch (error: any) { handleError(res, 'Import resume', error, userId); }
};

export const getReadiness = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const readiness = await resumeService.getReadiness(req.params.id as string, userId);
    if (!readiness) return res.status(404).json({ message: 'Resume not found' });
    res.json(readiness);
  } catch (error: any) { handleError(res, 'Get readiness', error, userId); }
};

export const matchAgainstJd = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { jd } = req.body;
    if (!jd || !jd.trim()) return res.json({ score: 0, matched: 0, total: 0, missing: [] });
    const result = await resumeService.matchAgainstJd(req.params.id as string, userId, jd);
    if (!result) return res.status(404).json({ message: 'Resume not found' });
    res.json(result);
  } catch (error: any) { handleError(res, 'Match against JD', error, userId); }
};

export const getTailorContext = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    res.json(await resumeService.getLatestTailorContext(req.params.id as string, userId));
  } catch (error: any) { handleError(res, 'Get tailor context', error, userId); }
};

export const runTailor = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    /* chargeCredits already logs the run, so this only has to gate it. */
    await entitlementService.assertWithinLimit(userId, FEATURE.TAILOR);
    const { jd, intensity } = req.body;
    if (!jd) return res.status(400).json({ message: 'jd is required' });
    res.json(await resumeService.runTailor(userId, req.params.id as string, jd, intensity || 'balanced'));
  } catch (error: any) { handleError(res, 'Run tailor', error, userId); }
};

export const applyTailoredVersion = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { jd, role, company, score, accepted } = req.body;
    const version = await resumeService.applyTailoredVersion(userId, {
      resumeId: req.params.id as string, jd, role, company, score, accepted: accepted || [],
    });
    if (!version) return res.status(404).json({ message: 'Resume not found' });
    res.status(201).json(version);
  } catch (error: any) { handleError(res, 'Apply tailored version', error, userId); }
};

export const getVersion = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const v = await resumeService.getVersion(req.params.versionId as string, userId);
    if (!v) return res.status(404).json({ message: 'Version not found' });
    res.json(v);
  } catch (error: any) { handleError(res, 'Get version', error, userId); }
};

export const updateVersion = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { data, template } = req.body;
    await entitlementService.assertCanUseTemplate(userId, template);
    await resumeService.updateVersion(req.params.versionId as string, userId, { data, template });
    res.status(204).send();
  } catch (error: any) { handleError(res, 'Update version', error, userId); }
};

export const duplicateVersion = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const v = await resumeService.duplicateVersion(req.params.versionId as string, userId);
    if (!v) return res.status(404).json({ message: 'Version not found' });
    res.status(201).json(v);
  } catch (error: any) { handleError(res, 'Duplicate version', error, userId); }
};

export const deleteVersion = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    await resumeService.deleteVersion(req.params.versionId as string, userId);
    res.status(204).send();
  } catch (error: any) { handleError(res, 'Delete version', error, userId); }
};

export const rewriteBullet = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { bullet, tone } = req.body;
    if (!bullet) return res.status(400).json({ message: 'bullet is required' });
    res.json(await resumeService.rewriteBullet(userId, bullet, tone || 'stronger'));
  } catch (error: any) { handleError(res, 'Rewrite bullet', error, userId); }
};

export const generateSummary = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { resume, jd } = req.body;
    if (!resume) return res.status(400).json({ message: 'resume is required' });
    res.json(await resumeService.generateSummary(userId, resume, jd));
  } catch (error: any) { handleError(res, 'Generate summary', error, userId); }
};

export const getCoverLetter = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    res.json(await resumeService.getCoverLetter(req.params.id as string, userId));
  } catch (error: any) { handleError(res, 'Get cover letter', error, userId); }
};

export const generateCoverLetter = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    res.json(await resumeService.generateCoverLetter(userId, req.params.id as string, req.body || {}));
  } catch (error: any) { handleError(res, 'Generate cover letter', error, userId); }
};

export const saveCoverLetter = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    await resumeService.saveCoverLetter(userId, req.params.id as string, req.body);
    res.status(204).send();
  } catch (error: any) { handleError(res, 'Save cover letter', error, userId); }
};

export const getInterviewPrep = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    res.json(await resumeService.getInterviewPrep(req.params.id as string, userId));
  } catch (error: any) { handleError(res, 'Get interview prep', error, userId); }
};

export const generateInterviewPrep = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    const { jd, role } = req.body;
    if (!jd) return res.status(400).json({ message: 'jd is required' });
    res.json(await resumeService.generateInterviewPrep(userId, req.params.id as string, { jd, role }));
  } catch (error: any) { handleError(res, 'Generate interview prep', error, userId); }
};

export const exportResumeDocx = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    /* Checked before rendering so a blocked request costs no PDF/DOCX work. */
    await entitlementService.assertWithinLimit(userId, FEATURE.EXPORT);
    await entitlementService.assertResumeTemplateAllowed(userId, req.params.id as string);
    const out = await resumeService.exportResumeDocx(req.params.id as string, userId);
    if (!out) return res.status(404).json({ message: 'Resume not found' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${out.fileName}"`);
    res.send(out.buffer);
    await entitlementService.recordUse(userId, FEATURE.EXPORT, out.fileName);
  } catch (error: any) { handleError(res, 'Export resume docx', error, userId); }
};

export const exportVersionDocx = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    /* Checked before rendering so a blocked request costs no PDF/DOCX work. */
    await entitlementService.assertWithinLimit(userId, FEATURE.EXPORT);
    await entitlementService.assertVersionTemplateAllowed(userId, req.params.versionId as string);
    const out = await resumeService.exportVersionDocx(req.params.versionId as string, userId);
    if (!out) return res.status(404).json({ message: 'Version not found' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${out.fileName}"`);
    res.send(out.buffer);
    await entitlementService.recordUse(userId, FEATURE.EXPORT, out.fileName);
  } catch (error: any) { handleError(res, 'Export version docx', error, userId); }
};

export const exportCoverLetterDocx = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    /* Checked before rendering so a blocked request costs no PDF/DOCX work. */
    await entitlementService.assertWithinLimit(userId, FEATURE.EXPORT);
    const out = await resumeService.exportCoverLetterDocx(req.params.id as string, userId);
    if (!out) return res.status(404).json({ message: 'Cover letter not found' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${out.fileName}"`);
    res.send(out.buffer);
    await entitlementService.recordUse(userId, FEATURE.EXPORT, out.fileName);
  } catch (error: any) { handleError(res, 'Export cover letter docx', error, userId); }
};

export const exportResumePdf = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    /* Checked before rendering so a blocked request costs no PDF/DOCX work. */
    await entitlementService.assertWithinLimit(userId, FEATURE.EXPORT);
    await entitlementService.assertResumeTemplateAllowed(userId, req.params.id as string);
    const out = await resumeService.exportResumePdf(req.params.id as string, userId);
    if (!out) return res.status(404).json({ message: 'Resume not found' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${out.fileName}"`);
    res.send(out.buffer);
    await entitlementService.recordUse(userId, FEATURE.EXPORT, out.fileName);
  } catch (error: any) { handleError(res, 'Export resume pdf', error, userId); }
};

export const exportVersionPdf = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    /* Checked before rendering so a blocked request costs no PDF/DOCX work. */
    await entitlementService.assertWithinLimit(userId, FEATURE.EXPORT);
    await entitlementService.assertVersionTemplateAllowed(userId, req.params.versionId as string);
    const out = await resumeService.exportVersionPdf(req.params.versionId as string, userId);
    if (!out) return res.status(404).json({ message: 'Version not found' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${out.fileName}"`);
    res.send(out.buffer);
    await entitlementService.recordUse(userId, FEATURE.EXPORT, out.fileName);
  } catch (error: any) { handleError(res, 'Export version pdf', error, userId); }
};

export const exportCoverLetterPdf = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  try {
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    /* Checked before rendering so a blocked request costs no PDF/DOCX work. */
    await entitlementService.assertWithinLimit(userId, FEATURE.EXPORT);
    const out = await resumeService.exportCoverLetterPdf(req.params.id as string, userId);
    if (!out) return res.status(404).json({ message: 'Cover letter not found' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${out.fileName}"`);
    res.send(out.buffer);
    await entitlementService.recordUse(userId, FEATURE.EXPORT, out.fileName);
  } catch (error: any) { handleError(res, 'Export cover letter pdf', error, userId); }
};
