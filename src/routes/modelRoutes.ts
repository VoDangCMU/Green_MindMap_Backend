import {Router} from "express";
import controller from "../controller";
import surveyVerifyController from "../controller/surveyVerifyController";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";

const modelRouter = Router();

modelRouter.post('/create', jwtAuthMiddleware, controller.model.createModel);
modelRouter.get('/getAll', jwtAuthMiddleware, controller.model.getAllModels);

// Get all feedbacks - no auth required
modelRouter.get('/feedbacks', surveyVerifyController.getFeedbacks);

export default modelRouter;
