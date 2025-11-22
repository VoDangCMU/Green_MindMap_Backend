import {Router} from "express";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";
import controller from "../controller";

const router = Router();

router.post("/avg-spend", jwtAuthMiddleware, controller.metrics.updateAvgSpend);

export default router;

