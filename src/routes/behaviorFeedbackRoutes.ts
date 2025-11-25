import { Router } from "express";
import controller from "../controller";
import { jwtAuthMiddleware } from "../middlewares/jwtMiddleware";

const router = Router();

router.get("/", jwtAuthMiddleware, controller.behaviorFeedback.getAllBehaviorFeedback);

export default router;

