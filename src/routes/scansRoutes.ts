import { Router } from 'express';
import controller from '../controller';
import { jwtAuthMiddleware } from '../middlewares/jwtMiddleware';
import { adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

// Create Scan (requires authentication)
router.post('/', jwtAuthMiddleware, controller.scans.createScan);

// Get Scan by ID (requires authentication)
router.get('/:id', jwtAuthMiddleware, controller.scans.getScanById);

// Get Scans by User ID (requires authentication)
router.get('/user/:userId', jwtAuthMiddleware, controller.scans.getScansByUserId);

// Update Scan by ID (requires authentication)
router.put('/:id', jwtAuthMiddleware, controller.scans.updateScanById);

// Delete Scan by ID (requires authentication)
router.delete('/:id', jwtAuthMiddleware, controller.scans.deleteScanById);

// Get all Scans (admin only)
router.get('/', jwtAuthMiddleware, adminMiddleware, controller.scans.getAllScans);

export default router;
