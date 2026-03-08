import { Router } from 'express';
import {
  getAllFolders,
  getFolderTree,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
} from '../controllers/folderController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllFolders);
router.get('/tree', getFolderTree);
router.get('/:id', getFolderById);
router.post('/', createFolder);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);

export default router;
