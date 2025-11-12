import {Router} from "express";
import controller from "../controller";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";

const router = Router();

router.get('/get-survey-scenario', jwtAuthMiddleware, controller.surveyScenarios.GetSurveyScenarios);
router.post('/create-survey-scenario', jwtAuthMiddleware, controller.surveyScenarios.CreateSurveyScenario);
router.put('/attach-question/:id', jwtAuthMiddleware, controller.surveyScenarios.AttachQuestions);
router.delete('/delete-survey-scenarios/:id', jwtAuthMiddleware, controller.surveyScenarios.DeleteSurveyScenario);
router.post('/simulate-scenario/:id', jwtAuthMiddleware, controller.surveyScenarios.SimulateScenario);
router.get('/get-simulated/:id', jwtAuthMiddleware, controller.surveyScenarios.GetSimulatedDetails);
router.get('/get-all-simulated-scenarios', jwtAuthMiddleware, controller.surveyScenarios.GetAllSimulatedScenarios);

export default router;
