import {Router} from "express";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";
import controller from "../controller";


const router = Router();

router.post("/create-daily-spending", jwtAuthMiddleware, controller.dailyPending.CreateAvgDailySpend)
router.patch("/analyze/:id", jwtAuthMiddleware, controller.dailyPending.AnalyzeAvgDailySpend);
router.get("/get-by-id/:id", jwtAuthMiddleware, controller.dailyPending.GetAvgDailySpend);
router.delete("/:id", jwtAuthMiddleware, controller.dailyPending.DeleteAvgDailySpend);
router.get("/get-all", jwtAuthMiddleware, controller.dailyPending.GetAllAvgDailySpend);

export default router;