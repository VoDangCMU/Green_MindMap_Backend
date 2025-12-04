import { Router } from 'express';
import controller from '../controller';
import surveyVerifyController from '../controller/surveyVerifyController';
import { jwtAuthMiddleware } from '../middlewares/jwtMiddleware';
import { staffOrAdminMiddleware, adminMiddleware } from '../middlewares/adminMiddleware';

const router = Router();

// Question Management Routes

// Create single question (staff/admin only)
router.post('/', jwtAuthMiddleware, staffOrAdminMiddleware, controller.questions.CreateQuestion);

// Create multiple questions at once (staff/admin only) - for frontend batch upload
router.post('/batch', jwtAuthMiddleware, staffOrAdminMiddleware, controller.questions.CreateBatchQuestions);

// Create multiple questions from direct payload (staff/admin only)
router.post('/createQuestions', jwtAuthMiddleware, staffOrAdminMiddleware, controller.questions.createQuestions);

// Survey verify - no auth required
router.post('/survey-verify', surveyVerifyController.verifySurvey);

// Question Set Management Routes

// Create a new question set (requires authentication)
router.post('/sets', jwtAuthMiddleware, controller.questionSet.createQuestionSet);

// Get all question sets (requires authentication)
router.get('/sets', jwtAuthMiddleware, controller.questionSet.getQuestionSets);

// Get current user's question sets (requires authentication)
router.get('/sets/my-sets', jwtAuthMiddleware, controller.questionSet.getQuestionSetsByOwner);

// Get question sets by owner (requires authentication)
router.get('/sets/owner/:ownerId', jwtAuthMiddleware, controller.questionSet.getQuestionSetsByOwner);

// Get question set by ID (requires authentication)
router.get('/sets/:id', jwtAuthMiddleware, controller.questionSet.getQuestionSetById);

// Update question set by ID (requires authentication and ownership)
router.put('/sets/:id', jwtAuthMiddleware, controller.questionSet.updateQuestionSet);

// Delete question set by ID (requires authentication and ownership)
router.delete('/sets/:id', jwtAuthMiddleware, controller.questionSet.deleteQuestionSet);

// Question Query Routes

// Get all questions (requires authentication)
router.get('/', jwtAuthMiddleware, controller.questions.GetQuestions);

// Get questions for client in predefined format - requires authentication
router.get('/for-client', jwtAuthMiddleware, controller.questions.getQuestionsForClient);

// Get random questions from database in specific format - requires authentication
router.get('/random', jwtAuthMiddleware, controller.questions.getRandomQuestionsForClient);

// Get simple random questions - requires authentication
router.get('/random-simple', jwtAuthMiddleware, controller.questions.getRandomQuestions);

// Get survey questions based on user's location and age - requires authentication
router.get('/survey', jwtAuthMiddleware, controller.questions.getSurveyQuestions);

// Get current user's questions (requires authentication)
router.get('/my-questions', jwtAuthMiddleware, controller.questions.GetQuestionsByOwner);

// Get questions by template ID (requires authentication)
router.get('/template/:templateId', jwtAuthMiddleware, controller.questions.GetQuestionsByTemplate);

// Get questions by thread hall ID (requires authentication)
router.get('/threadhall/:threadHallId', jwtAuthMiddleware, controller.questions.GetQuestionsByThreadHall);

// Get questions by owner ID (requires authentication)
router.get('/owner/:ownerId', jwtAuthMiddleware, controller.questions.GetQuestionsByOwner);

// Get question by ID (requires authentication) - MUST be after specific routes
router.get('/:id', jwtAuthMiddleware, controller.questions.GetQuestionById);

// Update question by ID (staff/admin only)
router.put('/:id', jwtAuthMiddleware, staffOrAdminMiddleware, controller.questions.UpdateQuestion);

// Delete question by ID (admin only)
router.delete('/:id', jwtAuthMiddleware, adminMiddleware, controller.questions.DeleteQuestion);

export default router;
