import { Router } from "express";
import checkRoutes from "@root/routes/checkRoutes";
import userRoutes from "@root/routes/userRoutes";
import tokenRouter from "@root/routes/tokenRoutes";
import locationRouter from "@root/routes/locationRoutes";
import templateRouter from "@root/routes/templateRoutes";
import user_answerRoutes from "@root/routes/user_answerRoutes";
import {jwtAuthMiddleware} from "@root/middlewares/jwtMiddleware";
const router = Router();

router.use(checkRoutes);
router.use(userRoutes);
router.use(tokenRouter);
router.use(locationRouter);
router.use(templateRouter);
router.use(user_answerRoutes)

export default router;
