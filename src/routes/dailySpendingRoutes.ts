import {Router} from "express";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";
import controller from "../controller";


const router = Router();

router.get("/", jwtAuthMiddleware, controller.dailyPending.getAverageDailySpend);
router.post("/spend", jwtAuthMiddleware, controller.dailyPending.CreateOrUpdateSpend);
router.post("/average-daily", jwtAuthMiddleware, controller.dailyPending.createOrUpdateAverageDaily);

export default router;