import {Router} from "express";
import controller from "../controller";
import surveyVerifyController from "../controller/surveyVerifyController";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";

const modelRouter = Router();

modelRouter.post('/create', jwtAuthMiddleware, controller.model.createModel);
modelRouter.post('/behavior/create', jwtAuthMiddleware, controller.model.createBehaviorModel);
modelRouter.get('/getAll', jwtAuthMiddleware, controller.model.getAllModels);
modelRouter.get('/:id', jwtAuthMiddleware, controller.model.getModelById);

// Get all feedbacks - no auth required
modelRouter.get('/feedbacks', surveyVerifyController.getFeedbacks);

export default modelRouter;
