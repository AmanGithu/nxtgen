import path from 'path';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../middleware/errorHandler';

const { PDFParse } = require('pdf-parse');

interface CreateDocInput {
  title: string;
  description?: string;
  content: string;
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
    const doc = await prisma.contextDocument.findFirst({ where: { id, userId } });
    if (!doc) throw new AppError('Document not found', 404);
    return doc;
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

  async delete(id: string, userId: string) {
    const doc = await prisma.contextDocument.findFirst({ where: { id, userId } });
    if (!doc) throw new AppError('Document not found', 404);

    await prisma.contextDocument.delete({ where: { id } });
  },
};
