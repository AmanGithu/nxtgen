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

  async verifyOwnership(sessionId: string, userId: string) {
    const session = await prisma.iAssistSession.findFirst({
      where: { id: sessionId, userId },
      select: { id: true, status: true, assistantId: true },
    });
    if (!session) throw new AppError('Session not found', 404);
    return session;
  },

  async getAnalytics(userId: string) {
    const [aggregates, categoryBreakdown, weeklyRaw] = await Promise.all([
      prisma.iAssistSession.aggregate({
        where: { userId, status: 'COMPLETED' },
        _count: true,
        _sum: { questionsAnswered: true, tokensUsed: true, durationSeconds: true },
        _avg: { durationSeconds: true, questionsAnswered: true },
      }),

      prisma.iAssistSession.groupBy({
        by: ['assistantId'],
        where: { userId, status: 'COMPLETED' },
        _count: true,
        _sum: { questionsAnswered: true, durationSeconds: true },
      }),

      prisma.iAssistSession.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { startedAt: true, durationSeconds: true, questionsAnswered: true },
        orderBy: { startedAt: 'asc' },
      }),
    ]);

    const assistantIds = categoryBreakdown
      .map((g) => g.assistantId)
      .filter((id): id is string => id !== null);

    const assistants = assistantIds.length > 0
      ? await prisma.iAssistant.findMany({
          where: { id: { in: assistantIds } },
          select: { id: true, name: true, category: true },
        })
      : [];

    const assistantMap = new Map(assistants.map((a) => [a.id, a]));

    const categoryStats: Record<string, { sessions: number; questions: number; durationSeconds: number }> = {};
    for (const g of categoryBreakdown) {
      const ast = g.assistantId ? assistantMap.get(g.assistantId) : null;
      const cat = ast?.category || 'GENERAL';
      if (!categoryStats[cat]) categoryStats[cat] = { sessions: 0, questions: 0, durationSeconds: 0 };
      categoryStats[cat].sessions += g._count;
      categoryStats[cat].questions += g._sum.questionsAnswered || 0;
      categoryStats[cat].durationSeconds += g._sum.durationSeconds || 0;
    }

    const weeklyActivity: { date: string; sessions: number; questions: number; durationSeconds: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = day.toISOString().slice(0, 10);
      const daySessions = weeklyRaw.filter(
        (s) => s.startedAt.toISOString().slice(0, 10) === dateStr,
      );
      weeklyActivity.push({
        date: dateStr,
        sessions: daySessions.length,
        questions: daySessions.reduce((sum, s) => sum + s.questionsAnswered, 0),
        durationSeconds: daySessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0),
      });
    }

    return {
      totalSessions: aggregates._count,
      totalQuestions: aggregates._sum.questionsAnswered || 0,
      totalTokens: aggregates._sum.tokensUsed || 0,
      totalDurationSeconds: aggregates._sum.durationSeconds || 0,
      avgDurationSeconds: Math.round(aggregates._avg.durationSeconds || 0),
      avgQuestions: Math.round((aggregates._avg.questionsAnswered || 0) * 10) / 10,
      categoryBreakdown: categoryStats,
      weeklyActivity,
    };
  },

  async addTranscript(sessionId: string, userId: string, data: AddTranscriptInput) {
    await this.verifyOwnership(sessionId, userId);

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
