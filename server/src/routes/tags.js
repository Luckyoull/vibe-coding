import { Router } from 'express';
import {
  getAllTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
} from '../controllers/tagController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllTags);
router.get('/:id', getTagById);
router.post('/', createTag);
router.put('/:id', updateTag);
router.delete('/:id', deleteTag);

export default router;
