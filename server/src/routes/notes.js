import { Router } from 'express';
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  permanentlyDeleteNote,
  restoreNote,
  getDeletedNotes,
} from '../controllers/noteController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllNotes);
router.get('/deleted', getDeletedNotes);
router.get('/:id', getNoteById);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);
router.post('/:id/restore', restoreNote);
router.delete('/:id/permanent', permanentlyDeleteNote);

export default router;
