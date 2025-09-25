import { Router } from 'express';
import controller from '../controller';
import { jwtAuthMiddleware } from '../middlewares/jwtMiddleware';
import { adminMiddleware, staffOrAdminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

// Create ThreadHall (staff/admin only)
router.post('/', jwtAuthMiddleware, staffOrAdminMiddleware, controller.threadHall.createThreadHall);

// Get ThreadHall by ID (requires authentication)
router.get('/:id', jwtAuthMiddleware, controller.threadHall.getThreadHallById);

// Update ThreadHall by ID (staff/admin only)
router.put('/:id', jwtAuthMiddleware, staffOrAdminMiddleware, controller.threadHall.updateThreadHallById);

// Delete ThreadHall by ID (admin only)
router.delete('/:id', jwtAuthMiddleware, adminMiddleware, controller.threadHall.deleteThreadHallById);

// Get all ThreadHalls (requires authentication)
router.get('/', jwtAuthMiddleware, controller.threadHall.getAllThreadHalls);

// Get ThreadHalls by Trait ID (requires authentication)
router.get('/trait/:traitId', jwtAuthMiddleware, controller.threadHall.getThreadHallsByTrait);

export default router;
