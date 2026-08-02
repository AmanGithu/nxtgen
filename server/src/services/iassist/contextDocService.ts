import path from 'path';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

interface CreateDocInput {
  title: string;
  description?: string;
  content: string;
}

interface UpdateDocInput {
  title?: string;
  description?: string | null;
  content?: string;
}

export const contextDocService = {
  async getAll(userId: string, search?: string) {
    const documents = await prisma.contextDocument.findMany({
      where: {
        userId,
        ...(search && { title: { contains: search } }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        wordCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return { documents, total: documents.length };
  },

  async getById(id: string, userId: string) {
    const doc = await prisma.contextDocument.findFirst({
      where: { id, userId },
      include: {
        materials: { select: { assistant: { select: { name: true } } } },
      },
    });
    if (!doc) throw new AppError('Document not found', 404);

    const { materials, ...rest } = doc;
    // Which assistants would lose this context if the document were deleted.
    const usedBy = [...new Set(materials.map((m) => m.assistant.name))];

    return { ...rest, usedBy };
  },

  async create(userId: string, data: CreateDocInput) {
    const wordCount = data.content.split(/\s+/).filter(Boolean).length;

    return prisma.contextDocument.create({
      data: {
        userId,
        title: data.title,
        description: data.description,
        content: data.content,
        wordCount,
      },
    });
  },

  async createFromFile(
    userId: string,
    file: { buffer: Buffer; originalname: string; size: number },
    title: string,
    description?: string
  ) {
    const ext = path.extname(file.originalname).toLowerCase();
    let content: string;

    if (ext === '.pdf') {
      const parser = new PDFParse({ data: file.buffer });
      try {
        const pdfData = await parser.getText({ pageJoiner: '\n' });
        content = pdfData.text?.trim() || '';
      } finally {
        await parser.destroy();
      }
      if (!content) throw new AppError('Could not extract text from PDF', 400);
    } else if (ext === '.docx') {
      const { value } = await mammoth.extractRawText({ buffer: file.buffer });
      content = value?.trim() || '';
      if (!content) throw new AppError('Could not extract text from DOCX', 400);
    } else if (ext === '.doc') {
      throw new AppError('Legacy .doc files are not supported. Please save as .docx or PDF.', 400);
    } else {
      content = file.buffer.toString('utf-8');
    }

    const wordCount = content.split(/\s+/).filter(Boolean).length;

    return prisma.contextDocument.create({
      data: {
        userId,
        title,
        description,
        fileName: file.originalname,
        fileType: ext.slice(1),
        fileSize: file.size,
        content,
        wordCount,
      },
    });
  },

  async update(id: string, userId: string, data: UpdateDocInput) {
    const doc = await prisma.contextDocument.findFirst({ where: { id, userId } });
    if (!doc) throw new AppError('Document not found', 404);

    if (data.content !== undefined && doc.fileName) {
      throw new AppError('Cannot edit the content of an uploaded file. Delete it and upload a new version.', 400);
    }

    return prisma.contextDocument.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.content !== undefined && {
          content: data.content,
          wordCount: data.content.split(/\s+/).filter(Boolean).length,
        }),
      },
    });
  },

  async delete(id: string, userId: string) {
    const doc = await prisma.contextDocument.findFirst({ where: { id, userId } });
    if (!doc) throw new AppError('Document not found', 404);

    await prisma.contextDocument.delete({ where: { id } });
  },
};
