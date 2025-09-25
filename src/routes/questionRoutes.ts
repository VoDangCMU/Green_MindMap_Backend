import { Router } from 'express';
import controller from '../controller';
import { jwtAuthMiddleware } from '../middlewares/jwtMiddleware';
import { staffOrAdminMiddleware, adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

// Question Management Routes

// Create single question (staff/admin only)
router.post('/', jwtAuthMiddleware, staffOrAdminMiddleware, controller.questions.CreateQuestion);

// Create multiple questions at once (staff/admin only) - for frontend batch upload
router.post('/batch', jwtAuthMiddleware, staffOrAdminMiddleware, controller.questions.CreateBatchQuestions);

// Get all questions (requires authentication)
router.get('/', jwtAuthMiddleware, controller.questions.GetQuestions);

// Get question by ID (requires authentication)
router.get('/:id', jwtAuthMiddleware, controller.questions.GetQuestionById);

// Get questions by template ID (requires authentication)
router.get('/template/:templateId', jwtAuthMiddleware, controller.questions.GetQuestionsByTemplate);

// Get questions by thread hall ID (requires authentication)
router.get('/threadhall/:threadHallId', jwtAuthMiddleware, controller.questions.GetQuestionsByThreadHall);

// Update question by ID (staff/admin only)
router.put('/:id', jwtAuthMiddleware, staffOrAdminMiddleware, controller.questions.UpdateQuestion);

// Delete question by ID (admin only)
router.delete('/:id', jwtAuthMiddleware, adminMiddleware, controller.questions.DeleteQuestion);

// Get questions for client in predefined format - requires authentication
router.get('/for-client', jwtAuthMiddleware, controller.questions.getQuestionsForClient);

// Get random questions from database in specific format - requires authentication
router.get('/random', jwtAuthMiddleware, controller.questions.getRandomQuestionsForClient);

export default router;
