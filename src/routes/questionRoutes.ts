import {Router} from "express";
import controller from "../controller";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";


const questionRouter = Router();

questionRouter.use(jwtAuthMiddleware)
questionRouter.get('/questions/get-question', controller.questions.GetQuestions);
questionRouter.get('/questions/get-question-by-id/:id', controller.questions.GetQuestionById);
questionRouter.put('/questions/update-question/:id', controller.questions.UpdateQuestion);
questionRouter.delete('/questions/delete-question/:id', controller.questions.DeleteQuestion);
questionRouter.post('/questions/create-question', controller.questions.CreateQuestion);

export default questionRouter;