import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';
import type { AssistantCategory, MaterialRole } from '@prisma/client';

interface CreateAssistantInput {
  name: string;
  category: AssistantCategory;
  targetRole?: string;
  experienceYears?: number;
  instructions?: string;
}

interface UpdateAssistantInput {
  name?: string;
  category?: AssistantCategory;
  targetRole?: string;
  experienceYears?: number;
  instructions?: string;
}

interface AddMaterialInput {
  role: MaterialRole;
  title: string;
  documentId?: string;
  content?: string;
}

const assistantInclude = {
  materials: {
    select: { id: true, role: true, title: true, documentId: true, content: true },
  },
  _count: { select: { sessions: true } },
  sessions: { select: { startedAt: true }, orderBy: { startedAt: 'desc' as const }, take: 1 },
} as const;

export const assistantService = {
  async getAll(userId: string) {
    const assistants = await prisma.iAssistant.findMany({
      where: { userId },
      include: assistantInclude,
      orderBy: { updatedAt: 'desc' },
    });

    return assistants.map((a) => ({
      id: a.id,
      name: a.name,
      category: a.category,
      targetRole: a.targetRole,
      experienceYears: a.experienceYears,
      instructions: a.instructions,
      materials: a.materials.map((m) => ({
        id: m.id,
        role: m.role,
        title: m.title,
        documentId: m.documentId,
        hasContent: !!(m.content || m.documentId),
      })),
      sessionCount: a._count.sessions,
      lastUsedAt: a.sessions[0]?.startedAt ?? null,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  },

  async getById(id: string, userId: string) {
    const assistant = await prisma.iAssistant.findFirst({
      where: { id, userId },
      include: assistantInclude,
    });

    if (!assistant) throw new AppError('Assistant not found', 404);

    return {
      ...assistant,
      materials: assistant.materials.map((m) => ({
        id: m.id,
        role: m.role,
        title: m.title,
        documentId: m.documentId,
        hasContent: !!(m.content || m.documentId),
      })),
      sessionCount: assistant._count.sessions,
      lastUsedAt: assistant.sessions[0]?.startedAt ?? null,
    };
  },

  async create(userId: string, data: CreateAssistantInput) {
    return prisma.iAssistant.create({
      data: { userId, ...data },
    });
  },

  async update(id: string, userId: string, data: UpdateAssistantInput) {
    const assistant = await prisma.iAssistant.findFirst({ where: { id, userId } });
    if (!assistant) throw new AppError('Assistant not found', 404);

    return prisma.iAssistant.update({ where: { id }, data });
  },

  async delete(id: string, userId: string) {
    const assistant = await prisma.iAssistant.findFirst({ where: { id, userId } });
    if (!assistant) throw new AppError('Assistant not found', 404);

    await prisma.iAssistant.delete({ where: { id } });
  },

  async addMaterial(assistantId: string, userId: string, data: AddMaterialInput) {
    const assistant = await prisma.iAssistant.findFirst({ where: { id: assistantId, userId } });
    if (!assistant) throw new AppError('Assistant not found', 404);

    if (data.role === 'RESUME' || data.role === 'JOB_DESCRIPTION') {
      const existing = await prisma.assistantMaterial.findFirst({
        where: { assistantId, role: data.role },
      });
      if (existing) {
        throw new AppError(`This assistant already has a ${data.role === 'RESUME' ? 'resume' : 'job description'} attached`, 409);
      }
    }

    if (data.documentId) {
      const doc = await prisma.contextDocument.findFirst({
        where: { id: data.documentId, userId },
      });
      if (!doc) throw new AppError('Document not found', 404);
    }

    const material = await prisma.assistantMaterial.create({
      data: {
        assistantId,
        role: data.role,
        title: data.title,
        documentId: data.documentId ?? null,
        content: data.content ?? null,
      },
    });

    return {
      id: material.id,
      role: material.role,
      title: material.title,
      documentId: material.documentId,
      hasContent: !!(material.content || material.documentId),
    };
  },

  async removeMaterial(assistantId: string, materialId: string, userId: string) {
    const assistant = await prisma.iAssistant.findFirst({ where: { id: assistantId, userId } });
    if (!assistant) throw new AppError('Assistant not found', 404);

    const material = await prisma.assistantMaterial.findFirst({
      where: { id: materialId, assistantId },
    });
    if (!material) throw new AppError('Material not found', 404);

    await prisma.assistantMaterial.delete({ where: { id: materialId } });
  },

  async getWithContext(assistantId: string) {
    const assistant = await prisma.iAssistant.findUnique({
      where: { id: assistantId },
      include: {
        materials: {
          include: {
            document: { select: { content: true } },
          },
        },
      },
    });

    if (!assistant) throw new AppError('Assistant not found', 404);

    return {
      ...assistant,
      materials: assistant.materials.map((m) => ({
        id: m.id,
        role: m.role,
        title: m.title,
        content: m.content || m.document?.content || null,
      })),
    };
  },
};
