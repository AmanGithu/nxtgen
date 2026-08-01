import { Router } from 'express';
import authRouter from './auth';
import coursesRouter from './courses';
import certificationsRouter from './certifications';
import internshipsRouter from './internships';
import upcomingRouter from './upcoming';
import corporateRouter from './corporate';
import adminRouter from './admin';
import studentRouter from './student';
import toolsRouter from './tools';
import iassistRouter from './iassist';
import iassistDesktopRouter from './iassistDesktop';

const router = Router();

router.use('/auth', authRouter);
router.use('/courses', coursesRouter);
router.use('/certifications', certificationsRouter);
router.use('/internships', internshipsRouter);
router.use('/upcoming-batches', upcomingRouter);
router.use('/corporate', corporateRouter);
router.use('/admin', adminRouter);
router.use('/student', studentRouter);
router.use('/tools', toolsRouter);
router.use('/iassist/desktop', iassistDesktopRouter);
router.use('/iassist', iassistRouter);

export default router;
