import { Router } from "express";
import caloriesRouter from "../routes/caloriesRoutes";
import invoicesRouter from "../routes/invoicesRoutes";
import questionRouter from "../routes/questionRoutes";
import checkRoutes from "./checkRoutes";
import userRoutes from "./userRoutes";
import tokenRouter from "./tokenRoutes";
import locationRouter from "./locationRoutes";
import templateRouter from "./templateRoutes";
import traitRouter from "./traitRoutes";
import foodItemsRouter from "../routes/fooditemsRoutes";
import bigFiveRouter from "./bigFiveRoutes";
import behaviorRouter from "./behaviorRoutes";
import threadHallRouter from "./threadHallRoutes";
import scansRouter from "./scansRoutes";
import userAnswersRouter from "./userAnswersRoutes";
import scenariosSurveyRouter from "./scenariosSurveyRoutes";
import modelRouter from "./modelRoutes";
import preAppSurveyRouter from "./preAppSurveyRoutes";
import todoRouter from "./todoRoutes";

const router = Router();

router.use("/check", checkRoutes);
router.use("/auth", userRoutes); // Changed from /api/users to /auth
router.use("/tokens", tokenRouter);
router.use("/locations", locationRouter);
router.use("/calories", caloriesRouter);
router.use("/invoices", invoicesRouter);
router.use("/questions", questionRouter);
router.use("/templates", templateRouter);
router.use("/traits", traitRouter);
router.use("/food-items", foodItemsRouter);
router.use("/big-five", bigFiveRouter);
router.use("/behaviors", behaviorRouter);
router.use("/thread-halls", threadHallRouter);
router.use("/scans", scansRouter);
router.use("/user-answers", userAnswersRouter);
router.use("/scenarios-survey", scenariosSurveyRouter);
router.use("/models", modelRouter);
router.use("/pre-app-survey", preAppSurveyRouter);
router.use("/todos", todoRouter);

export default router;
