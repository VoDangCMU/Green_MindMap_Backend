import { Router } from 'express';
import controller from '../controller';
import { jwtAuthMiddleware } from '../middlewares/jwtMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

// Create BigFive data (requires authentication)
router.post('/', jwtAuthMiddleware, controller.bigFive.createBigFive);

// Get BigFive data by ID (requires authentication)
router.get('/:id', jwtAuthMiddleware, controller.bigFive.getBigFiveById);

// Get BigFive data by User ID (requires authentication)
router.get('/user/:userId', jwtAuthMiddleware, controller.bigFive.getBigFiveByUserId);

// Update BigFive data by ID (requires authentication)
router.put('/:id', jwtAuthMiddleware, controller.bigFive.updateBigFiveById);

// Delete BigFive data by ID (requires authentication)
router.delete('/:id', jwtAuthMiddleware, controller.bigFive.deleteBigFiveById);

// Get all BigFive data (admin only)
router.get('/', jwtAuthMiddleware, adminMiddleware, controller.bigFive.getAllBigFive);

export default router;
