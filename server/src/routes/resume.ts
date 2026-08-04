import { Router } from 'express';
import {
  listResumes, getResume, createResume, updateResume, renameResume, deleteResume, duplicateResume,
  importResume, getReadiness, matchAgainstJd, getTailorContext, runTailor, applyTailoredVersion,
  getVersion, updateVersion, duplicateVersion, deleteVersion,
  rewriteBullet, generateSummary,
  getCoverLetter, generateCoverLetter, saveCoverLetter,
  getInterviewPrep, generateInterviewPrep,
  exportResumeDocx, exportVersionDocx, exportCoverLetterDocx,
  exportResumePdf, exportVersionPdf, exportCoverLetterPdf,
} from '../controllers/resumeController';
import { authenticate } from '../middleware/auth';
import { entitlementService } from '../services/entitlementService';

const router = Router();

router.use(authenticate);

router.get('/', listResumes);
router.post('/', createResume);
router.post('/import', importResume);

/** Tier, limits and usage — what the UI needs to render locks and counters. */
router.get('/entitlements', async (req: any, res, next) => {
  try {
    res.json({ success: true, ...(await entitlementService.snapshot(req.user.id)) });
  } catch (e) { next(e); }
});

router.get('/:id', getResume);
router.patch('/:id', updateResume);
router.patch('/:id/rename', renameResume);
router.delete('/:id', deleteResume);
router.post('/:id/duplicate', duplicateResume);

router.get('/:id/readiness', getReadiness);
router.post('/:id/match', matchAgainstJd);
router.get('/:id/tailor-context', getTailorContext);
router.post('/:id/tailor', runTailor);
router.post('/:id/tailor/apply', applyTailoredVersion);

router.get('/:id/versions/:versionId', getVersion);
router.patch('/:id/versions/:versionId', updateVersion);
router.post('/:id/versions/:versionId/duplicate', duplicateVersion);
router.delete('/:id/versions/:versionId', deleteVersion);
router.get('/:id/versions/:versionId/export/docx', exportVersionDocx);
router.get('/:id/versions/:versionId/export/pdf', exportVersionPdf);

router.post('/:id/ai/rewrite-bullet', rewriteBullet);
router.post('/:id/ai/generate-summary', generateSummary);

router.get('/:id/cover-letter', getCoverLetter);
router.post('/:id/cover-letter/generate', generateCoverLetter);
router.put('/:id/cover-letter', saveCoverLetter);
router.get('/:id/cover-letter/export/docx', exportCoverLetterDocx);
router.get('/:id/cover-letter/export/pdf', exportCoverLetterPdf);

router.get('/:id/interview-prep', getInterviewPrep);
router.post('/:id/interview-prep/generate', generateInterviewPrep);

router.get('/:id/export/docx', exportResumeDocx);
router.get('/:id/export/pdf', exportResumePdf);

export default router;
