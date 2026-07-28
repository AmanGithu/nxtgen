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

export default router;
