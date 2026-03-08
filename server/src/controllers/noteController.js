import { z } from 'zod';
import prisma from '../db.js';

const noteSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(200, '标题不能超过 200 个字符'),
  content: z.string().default(''),
  folderId: z.string().uuid().optional().nullable(),
  tagIds: z.array(z.string().uuid()).optional().default([]),
});

export const getAllNotes = async (req, res) => {
  try {
    const { folderId, tagId, search, page = '1', limit = '20' } = req.query;
    
    const where = {
      userId: req.user.userId,
      isDeleted: false,
    };

    if (folderId) {
      where.folderId = folderId;
    }

    if (tagId) {
      where.tags = {
        some: { tagId },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const notes = await prisma.note.findMany({
      where,
      include: {
        folder: { select: { id: true, name: true } },
        tags: { 
          include: { 
            tag: { select: { id: true, name: true, color: true } } 
          } 
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    });

    const total = await prisma.note.count({ where });

    res.json({
      success: true,
      data: {
        notes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};

export const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await prisma.note.findFirst({
      where: {
        id,
        userId: req.user.userId,
        isDeleted: false,
      },
      include: {
        folder: { select: { id: true, name: true } },
        tags: { 
          include: { 
            tag: { select: { id: true, name: true, color: true } } 
          } 
        },
      },
    });

    if (!note) {
      return res.status(404).json({ 
        success: false, 
        message: '笔记不存在' 
      });
    }

    res.json({
      success: true,
      data: note,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};

export const createNote = async (req, res) => {
  try {
    const validatedData = noteSchema.parse(req.body);

    const note = await prisma.note.create({
      data: {
        title: validatedData.title,
        content: validatedData.content,
        folderId: validatedData.folderId,
        userId: req.user.userId,
        tags: validatedData.tagIds?.length > 0 ? {
          create: validatedData.tagIds.map(tagId => ({
            tag: { connect: { id: tagId } },
          })),
        } : undefined,
      },
      include: {
        folder: { select: { id: true, name: true } },
        tags: { 
          include: { 
            tag: { select: { id: true, name: true, color: true } } 
          } 
        },
      },
    });

    res.status(201).json({
      success: true,
      data: note,
      message: '笔记创建成功',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '验证失败',
        errors: error.errors,
      });
    }
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};

export const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = noteSchema.parse(req.body);

    const existingNote = await prisma.note.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!existingNote) {
      return res.status(404).json({ 
        success: false, 
        message: '笔记不存在' 
      });
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        title: validatedData.title,
        content: validatedData.content,
        folderId: validatedData.folderId,
        tags: {
          deleteMany: {},
          create: validatedData.tagIds?.map(tagId => ({
            tag: { connect: { id: tagId } },
          })),
        },
      },
      include: {
        folder: { select: { id: true, name: true } },
        tags: { 
          include: { 
            tag: { select: { id: true, name: true, color: true } } 
          } 
        },
      },
    });

    res.json({
      success: true,
      data: note,
      message: '笔记更新成功',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: '验证失败',
        errors: error.errors,
      });
    }
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await prisma.note.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!note) {
      return res.status(404).json({ 
        success: false, 
        message: '笔记不存在' 
      });
    }

    await prisma.$transaction([
      prisma.note.update({
        where: { id },
        data: { isDeleted: true, deletedAt: new Date() },
      }),
      prisma.deletedNote.create({
        data: {
          noteId: id,
          title: note.title,
          content: note.content,
          folderId: note.folderId,
          userId: req.user.userId,
          originalNoteId: id,
        },
      }),
    ]);

    res.json({
      success: true,
      message: '笔记已移至回收站',
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};

export const permanentlyDeleteNote = async (req, res) => {
  try {
    const { id } = req.params;

    const note = await prisma.note.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!note) {
      return res.status(404).json({ 
        success: false, 
        message: '笔记不存在' 
      });
    }

    await prisma.$transaction([
      prisma.note.delete({ where: { id } }),
      prisma.deletedNote.deleteMany({ where: { originalNoteId: id } }),
    ]);

    res.json({
      success: true,
      message: '笔记已永久删除',
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};

export const restoreNote = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedNote = await prisma.deletedNote.findFirst({
      where: { originalNoteId: id, userId: req.user.userId },
    });

    if (!deletedNote) {
      return res.status(404).json({ 
        success: false, 
        message: '回收站中未找到该笔记' 
      });
    }

    await prisma.$transaction([
      prisma.note.update({
        where: { id },
        data: { isDeleted: false, deletedAt: null },
      }),
      prisma.deletedNote.deleteMany({ where: { originalNoteId: id } }),
    ]);

    res.json({
      success: true,
      message: '笔记已恢复',
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};

export const getDeletedNotes = async (req, res) => {
  try {
    const deletedNotes = await prisma.deletedNote.findMany({
      where: { userId: req.user.userId },
      orderBy: { deletedAt: 'desc' },
    });

    res.json({
      success: true,
      data: deletedNotes,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};
