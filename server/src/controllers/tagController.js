import { z } from 'zod';
import prisma from '../db.js';

const tagSchema = z.object({
  name: z.string().min(1, '标签名称不能为空').max(50, '标签名称不能超过 50 个字符'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '颜色格式不正确').default('#6366f1'),
});

export const getAllTags = async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      where: { userId: req.user.userId },
      include: {
        _count: { select: { notes: true } },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: tags,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};

export const getTagById = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await prisma.tag.findFirst({
      where: { id, userId: req.user.userId },
      include: {
        _count: { select: { notes: true } },
      },
    });

    if (!tag) {
      return res.status(404).json({ 
        success: false, 
        message: '标签不存在' 
      });
    }

    res.json({
      success: true,
      data: tag,
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};

export const createTag = async (req, res) => {
  try {
    const validatedData = tagSchema.parse(req.body);

    const existingTag = await prisma.tag.findFirst({
      where: {
        name: validatedData.name,
        userId: req.user.userId,
      },
    });

    if (existingTag) {
      return res.status(400).json({ 
        success: false, 
        message: '该标签已存在' 
      });
    }

    const tag = await prisma.tag.create({
      data: {
        name: validatedData.name,
        color: validatedData.color,
        userId: req.user.userId,
      },
    });

    res.status(201).json({
      success: true,
      data: tag,
      message: '标签创建成功',
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

export const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const validatedData = tagSchema.parse(req.body);

    const existingTag = await prisma.tag.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!existingTag) {
      return res.status(404).json({ 
        success: false, 
        message: '标签不存在' 
      });
    }

    const tag = await prisma.tag.update({
      where: { id },
      data: {
        name: validatedData.name,
        color: validatedData.color,
      },
    });

    res.json({
      success: true,
      data: tag,
      message: '标签更新成功',
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

export const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await prisma.tag.findFirst({
      where: { id, userId: req.user.userId },
    });

    if (!tag) {
      return res.status(404).json({ 
        success: false, 
        message: '标签不存在' 
      });
    }

    await prisma.tag.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '标签已删除',
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '服务器错误',
      error: error.message 
    });
  }
};
