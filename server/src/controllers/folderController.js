import { z } from 'zod';
import prisma from '../db.js';

const folderSchema = z.object({
  name: z.string().min(1, '文件夹名称不能为空').max(100, '文件夹名称不能超过 100 个字符'),
  parentId: z.string().uuid().optional().nullable(),
});

export const getAllFolders = async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId: req.user.userId },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { children: true, notes: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json({
      success: true,
      data: folders,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};

export const getFolderTree = async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId: req.user.userId, parentId: null },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,
              },
            },
          },
        },
        _count: { select: { notes: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: folders,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};

export const getFolderById = async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await prisma.folder.findFirst({
      where: { id, userId: req.user.userId },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        notes: { 
          select: { id: true, title: true, updatedAt: true },
          where: { isDeleted: false },
        },
      },
    });

    if (!folder) {
      return res.status(404).json({ 
        success: false, 
        message: '文件夹不存在' 
      });
    }

    res.json({
      success: true,
      data: folder,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};

export const createFolder = async (req, res) => {
  try {
    const validatedData = folderSchema.parse(req.body);

    if (validatedData.parentId) {
      const parentFolder = await prisma.folder.findFirst({
        where: { id: validatedData.parentId, userId: req.user.userId },
      });

      if (!parentFolder) {
        return res.status(400).json({ 
          success: false, 
          message: '父文件夹不存在' 
        });
      }
    }

    const folder = await prisma.folder.create({
      data: {
        name: validatedData.name,
        parentId: validatedData.parentId,
        userId: req.user.userId,
      },
      include: {
        parent: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: folder,
      message: '文件夹创建成功',
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

export const updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = folderSchema.parse(req.body);

    const existingFolder = await prisma.folder.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!existingFolder) {
      return res.status(404).json({ 
        success: false, 
        message: '文件夹不存在' 
      });
    }

    if (validatedData.parentId === id) {
      return res.status(400).json({ 
        success: false, 
        message: '文件夹不能是自己子文件夹' 
      });
    }

    const folder = await prisma.folder.update({
      where: { id },
      data: {
        name: validatedData.name,
        parentId: validatedData.parentId,
      },
      include: {
        parent: { select: { id: true, name: true } },
      },
    });

    res.json({
      success: true,
      data: folder,
      message: '文件夹更新成功',
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

export const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;

    const folder = await prisma.folder.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!folder) {
      return res.status(404).json({ 
        success: false, 
        message: '文件夹不存在' 
      });
    }

    await prisma.folder.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '文件夹已删除',
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};
