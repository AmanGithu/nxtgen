import { PrismaClient, BatchStatus, MaterialType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seeds a live batch for the demo student so the student dashboard has real
 * data to render — enrolment, progress, scheduled classes and study
 * materials. Idempotent: re-running updates rather than duplicating.
 */
async function main() {
  console.log('🌱 Seeding student batch data…');

  const student = await prisma.user.findUnique({ where: { email: 'student@example.com' } });
  if (!student) throw new Error('Seed the base data first — student@example.com not found.');

  const course = await prisma.course.findFirst({ where: { category: 'AI' }, orderBy: { sortOrder: 'asc' } });
  if (!course) throw new Error('No AI course found — run the base seed first.');

  const now = new Date();
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  // ─── Batch ───
  const batch = await prisma.batch.upsert({
    where: { id: 'demo-batch-18' },
    update: { name: 'Batch 18 — GenAI Masterclass', status: BatchStatus.ACTIVE },
    create: {
      id: 'demo-batch-18',
      name: 'Batch 18 — GenAI Masterclass',
      courseId: course.id,
      startDate: daysFromNow(-30),
      endDate: daysFromNow(60), // max access duration
      maxStudents: 30,
      driveFolder: 'https://drive.google.com/drive/folders/demo-batch-18',
      status: BatchStatus.ACTIVE,
    },
  });
  console.log(`✅ Batch: ${batch.name}`);

  // ─── Enrolment ───
  await prisma.batchStudent.upsert({
    where: { batchId_studentId: { batchId: batch.id, studentId: student.id } },
    update: {},
    create: { batchId: batch.id, studentId: student.id },
  });
  console.log('✅ Student enrolled');

  // ─── Progress ───
  const modules = Array.isArray(course.modules) ? (course.modules as any[]) : [];
  await prisma.studentProgress.upsert({
    where: { userId_courseId: { userId: student.id, courseId: course.id } },
    update: { overallProgress: 68 },
    create: {
      userId: student.id,
      courseId: course.id,
      completedModules: modules.slice(0, 2).map((m: any) => m.id ?? m.title),
      overallProgress: 68,
      assignmentScores: { 'LLM Prompting': 92, 'Vector DB Setup': 88, 'Python API Mastery': 95 },
      quizScores: { 'Module 1': 90, 'Module 2': 84 },
      lastAccessedAt: now,
    },
  });
  console.log('✅ Progress: 68%');

  // ─── Classes: some past, some upcoming ───
  const classes = [
    { id: 'demo-cls-1', title: 'Prompt Engineering Foundations', dateTime: daysFromNow(-14), duration: 90 },
    { id: 'demo-cls-2', title: 'Vector Databases & Embeddings', dateTime: daysFromNow(-7), duration: 90 },
    { id: 'demo-cls-3', title: 'Advanced RAG Architectures', dateTime: daysFromNow(2), duration: 90 },
    { id: 'demo-cls-4', title: 'Multi-Agent Orchestration', dateTime: daysFromNow(9), duration: 120 },
    { id: 'demo-cls-5', title: 'Capstone Review & Q&A', dateTime: daysFromNow(16), duration: 60 },
  ];
  for (const c of classes) {
    await prisma.classSchedule.upsert({
      where: { id: c.id },
      update: { title: c.title, dateTime: c.dateTime },
      create: {
        ...c,
        batchId: batch.id,
        zoomLink: 'https://zoom.us/j/demo-nxtgen-class',
        status: c.dateTime < now ? 'completed' : 'scheduled',
      },
    });
  }
  console.log(`✅ ${classes.length} classes scheduled`);

  // ─── Study materials, newest first ───
  const materials = [
    { id: 'demo-mat-1', type: MaterialType.NOTES, title: 'Advanced Vector Databases & Indexing Strategies', description: 'Reference architecture guide for Qdrant and Pinecone.' },
    { id: 'demo-mat-2', type: MaterialType.RECORDING, title: 'Interview with Lead Architect: Scaling RAG', description: 'Behind the scenes of enterprise-grade production pipelines.' },
    { id: 'demo-mat-3', type: MaterialType.NOTES, title: 'Semantic Search Visualiser — Lecture Slides', description: 'Comprehensive slide deck with high-resolution diagrams.' },
    { id: 'demo-mat-4', type: MaterialType.ASSIGNMENT, title: 'Build a Retrieval Pipeline', description: 'Hands-on assignment: ingest, chunk, embed and query.' },
    { id: 'demo-mat-5', type: MaterialType.QUIZ, title: 'Evaluation Metrics: RAGAS & Beyond', description: 'Short quiz on retrieval evaluation.' },
  ];
  for (const [i, m] of materials.entries()) {
    await prisma.studyMaterial.upsert({
      where: { id: m.id },
      update: { title: m.title },
      create: {
        ...m,
        batchId: batch.id,
        driveFileId: `demo-drive-file-${i + 1}`,
        driveUrl: `https://drive.google.com/file/d/demo-drive-file-${i + 1}/view`,
        sortOrder: i,
      },
    });
  }
  console.log(`✅ ${materials.length} study materials`);

  // ─── Link certifications to the course, for the student's cert tab ───
  const certs = await prisma.certification.findMany({ take: 4, where: { isActive: true } });
  for (const c of certs) {
    const existing = await prisma.courseCertification.findFirst({
      where: { courseId: course.id, certificationId: c.id },
    });
    if (!existing) {
      await prisma.courseCertification.create({
        data: { courseId: course.id, certificationId: c.id },
      });
    }
  }
  console.log(`✅ ${certs.length} certifications linked to ${course.title}`);

  console.log('🎉 Student seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
