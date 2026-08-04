import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { Resume, ResumeVersion, CoverLetter, InterviewPrep, Prisma } from '@prisma/client';

export class ResumeRepository {
  async findByUserId(userId: string): Promise<(Resume & { versions: ResumeVersion[] })[]> {
    logger.debug(`DB Query: findByUserId in Resume. userId: ${userId}`);
    return prisma.resume.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { versions: { orderBy: { updatedAt: 'desc' } } }
    });
  }

  async findById(id: string, userId: string): Promise<Resume | null> {
    logger.debug(`DB Query: findById in Resume. id: ${id}, userId: ${userId}`);
    return prisma.resume.findFirst({ where: { id, userId } });
  }

  /** `tx` lets the caller run this inside a transaction that also enforces the
      per-plan résumé cap, so the count and the insert cannot interleave. */
  async create(userId: string, data: { title: string; template: string; data: string }, tx?: any): Promise<Resume> {
    logger.debug(`DB Query: create Resume. userId: ${userId}, title: ${data.title}`);
    return (tx ?? prisma).resume.create({ data: { userId, ...data } });
  }

  async update(id: string, userId: string, data: Prisma.ResumeUpdateInput): Promise<Prisma.BatchPayload> {
    logger.debug(`DB Query: update Resume. id: ${id}, userId: ${userId}`);
    return prisma.resume.updateMany({ where: { id, userId }, data });
  }

  async delete(id: string, userId: string): Promise<Prisma.BatchPayload> {
    logger.debug(`DB Query: delete Resume. id: ${id}, userId: ${userId}`);
    return prisma.resume.deleteMany({ where: { id, userId } });
  }

  // ---------------- versions ----------------
  async findVersionById(id: string, userId: string): Promise<ResumeVersion | null> {
    logger.debug(`DB Query: findVersionById in ResumeVersion. id: ${id}, userId: ${userId}`);
    return prisma.resumeVersion.findFirst({ where: { id, resume: { userId } } });
  }

  async findLatestVersionWithJd(resumeId: string, userId: string): Promise<ResumeVersion | null> {
    logger.debug(`DB Query: findLatestVersionWithJd. resumeId: ${resumeId}, userId: ${userId}`);
    return prisma.resumeVersion.findFirst({
      where: { resumeId, resume: { userId }, jdText: { not: null } },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async createVersion(data: {
    resumeId: string; role: string; company: string; template: string; data: string;
    ats: number; jdText?: string; jdKeywords?: string;
  }): Promise<ResumeVersion> {
    logger.debug(`DB Query: create ResumeVersion. resumeId: ${data.resumeId}, role: ${data.role}`);
    return prisma.resumeVersion.create({ data });
  }

  async updateVersion(id: string, userId: string, data: Prisma.ResumeVersionUpdateInput): Promise<Prisma.BatchPayload> {
    logger.debug(`DB Query: update ResumeVersion. id: ${id}, userId: ${userId}`);
    return prisma.resumeVersion.updateMany({ where: { id, resume: { userId } }, data });
  }

  async deleteVersion(id: string, userId: string): Promise<void> {
    logger.debug(`DB Query: delete ResumeVersion. id: ${id}, userId: ${userId}`);
    await prisma.resumeVersion.deleteMany({ where: { id, resume: { userId } } });
  }

  // ---------------- cover letter ----------------
  async findCoverLetter(resumeId: string, userId: string): Promise<CoverLetter | null> {
    logger.debug(`DB Query: findCoverLetter. resumeId: ${resumeId}, userId: ${userId}`);
    return prisma.coverLetter.findFirst({ where: { resumeId, resume: { userId } } });
  }

  async upsertCoverLetter(resumeId: string, data: {
    company: string; role: string; manager: string; tone: string; jd: string; body: string;
  }): Promise<CoverLetter> {
    logger.debug(`DB Query: upsert CoverLetter. resumeId: ${resumeId}`);
    return prisma.coverLetter.upsert({
      where: { resumeId },
      create: { resumeId, ...data },
      update: data
    });
  }

  // ---------------- interview prep ----------------
  async findInterviewPrep(resumeId: string, userId: string): Promise<InterviewPrep | null> {
    logger.debug(`DB Query: findInterviewPrep. resumeId: ${resumeId}, userId: ${userId}`);
    return prisma.interviewPrep.findFirst({ where: { resumeId, resume: { userId } } });
  }

  async upsertInterviewPrep(resumeId: string, data: { role: string; jd: string; questions: string }): Promise<InterviewPrep> {
    logger.debug(`DB Query: upsert InterviewPrep. resumeId: ${resumeId}`);
    return prisma.interviewPrep.upsert({
      where: { resumeId },
      create: { resumeId, ...data },
      update: data
    });
  }
}
