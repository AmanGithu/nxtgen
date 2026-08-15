import { Router } from 'express';
import authRouter from './auth';
import coursesRouter from './courses';
import certificationsRouter from './certifications';
import internshipsRouter from './internships';
import upcomingRouter from './upcoming';
import corporateRouter from './corporate';
import adminRouter from './admin';
import adminPricingRouter from './adminPricing';
import studentRouter from './student';
import toolsRouter from './tools';
import siteRouter from './site';
import resumeRouter from './resume';
import linkedinRouter from './linkedin';
import guestRouter from './guest';
import billingRouter from './billing';
import checkoutRouter from './checkout';
import webhooksRouter from './webhooks';
import iassistRouter from './iassist';
import iassistDesktopRouter from './iassistDesktop';
import agentsRouter from './agents';
import livekitRouter from './livekit';
import whatsappRouter from './whatsapp';
import themeAssetsRouter from './themeAssets';
import siteAssetsRouter from './siteAssets';
import leadsRouter from './leads';
import siteManagerRouter from './siteManager';
import analyticsRouter from './analytics';

const router = Router();

router.use('/auth', authRouter);
router.use('/courses', coursesRouter);
router.use('/certifications', certificationsRouter);
router.use('/internships', internshipsRouter);
router.use('/upcoming-batches', upcomingRouter);
router.use('/corporate', corporateRouter);
/* Before '/admin', not after. The admin router ends in a catch-all, so a
   later registration here would never be reached — the same ordering trap
   that made GET /resumes/entitlements resolve as a résumé id lookup. */
router.use('/admin/pricing', adminPricingRouter);
router.use('/admin', adminRouter);
router.use('/student', studentRouter);
router.use('/tools', toolsRouter);
router.use('/site', siteRouter);
router.use('/resumes', resumeRouter);
router.use('/linkedin', linkedinRouter);
router.use('/guest', guestRouter);
router.use('/billing/checkout', checkoutRouter);
router.use('/billing', billingRouter);
/* Mounted at /api/webhooks to match the raw-body parser in index.ts. */
router.use('/webhooks', webhooksRouter);
router.use('/agents', agentsRouter);
router.use('/livekit', livekitRouter);
router.use('/whatsapp', whatsappRouter);
router.use('/theme-assets', themeAssetsRouter);
router.use('/site-assets', siteAssetsRouter);
router.use('/leads', leadsRouter);
router.use('/site-manager', siteManagerRouter);
router.use('/analytics', analyticsRouter);
router.use('/iassist/desktop', iassistDesktopRouter);
router.use('/iassist', iassistRouter);

export default router;
