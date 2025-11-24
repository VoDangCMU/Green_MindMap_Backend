import { Router } from "express";
import questionRouter from "../routes/questionRoutes";
import userRoutes from "./userRoutes";
import tokenRouter from "./tokenRoutes";
import locationRouter from "./locationRoutes";
import templateRouter from "./templateRoutes";
import traitRouter from "./traitRoutes";
import bigFiveRouter from "./bigFiveRoutes";
import behaviorRouter from "./behaviorRoutes";
import threadHallRouter from "./threadHallRoutes";
import userAnswersRouter from "./userAnswersRoutes";
import scenariosSurveyRouter from "./scenariosSurveyRoutes";
import modelRouter from "./modelRoutes";
import dailySpendingRouter from "./dailySpendingRoutes";
import preAppSurveyRouter from "./preAppSurveyRoutes";
import todoRouter from "./todoRoutes";
import nightOutFreqRoutes from "../routes/nightOutFreqRoutes";
import metricsRouter from "./metricsRoutes";
import brandRouter from "./brandRoutes";
import ocrRouter from "./ocrRoutes";

const router = Router();

router.use("/auth", userRoutes); // Changed from /api/users to /auth
router.use("/tokens", tokenRouter);
router.use("/locations", locationRouter);
router.use("/questions", questionRouter);
router.use("/templates", templateRouter);
router.use("/traits", traitRouter);
router.use("/big-five", bigFiveRouter);
router.use("/behaviors", behaviorRouter);
router.use("/thread-halls", threadHallRouter);
router.use("/user-answers", userAnswersRouter);
router.use("/scenarios-survey", scenariosSurveyRouter);
router.use("/models", modelRouter);
router.use("/daily-spending", dailySpendingRouter)
router.use("/pre-app-survey", preAppSurveyRouter);
router.use("/todos", todoRouter);
router.use("/night-out-freq", nightOutFreqRoutes);
router.use("/metrics", metricsRouter);
router.use("/brands", brandRouter);
router.use("/ocr", ocrRouter);

export default router;
