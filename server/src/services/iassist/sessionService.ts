import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

interface EndSessionInput {
  durationSeconds: number;
  questionsAnswered: number;
  tokensUsed: number;
}

interface AddTranscriptInput {
  speaker: string;
  text: string;
  isQuestion?: boolean;
  response?: string;
  tokens?: number;
  timestamp?: number;
}

export const sessionService = {
  async getAll(userId: string, period?: 'week' | 'month' | 'all') {
    const now = new Date();
    let startedAtFilter: object | undefined;

    if (period === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      startedAtFilter = { gte: weekAgo };
    } else if (period === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      startedAtFilter = { gte: monthAgo };
    }

    return prisma.iAssistSession.findMany({
      where: {
        userId,
        ...(startedAtFilter && { startedAt: startedAtFilter }),
      },
      include: {
        assistant: { select: { id: true, name: true, category: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  },

  async getById(id: string, userId: string) {
    const session = await prisma.iAssistSession.findFirst({
      where: { id, userId },
      include: {
        assistant: { select: { id: true, name: true, category: true } },
        transcripts: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!session) throw new AppError('Session not found', 404);
    return session;
  },

  async create(userId: string, assistantId: string, platform: string) {
    const assistant = await prisma.iAssistant.findFirst({
      where: { id: assistantId, userId },
    });
    if (!assistant) throw new AppError('Assistant not found', 404);

    return prisma.iAssistSession.create({
      data: { userId, assistantId, platform },
      include: {
        assistant: { select: { id: true, name: true, category: true } },
      },
    });
  },

  async end(id: string, userId: string, stats: EndSessionInput) {
    const session = await prisma.iAssistSession.findFirst({
      where: { id, userId, status: 'ACTIVE' },
    });
    if (!session) throw new AppError('Active session not found', 404);

    await prisma.iAssistSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        durationSeconds: stats.durationSeconds,
        questionsAnswered: stats.questionsAnswered,
        tokensUsed: stats.tokensUsed,
      },
    });
  },

  async addTranscript(sessionId: string, data: AddTranscriptInput) {
    await prisma.sessionTranscript.create({
      data: {
        sessionId,
        speaker: data.speaker,
        text: data.text,
        isQuestion: data.isQuestion ?? false,
        response: data.response,
        tokens: data.tokens ?? 0,
        timestamp: data.timestamp ?? 0,
      },
    });
  },
};
