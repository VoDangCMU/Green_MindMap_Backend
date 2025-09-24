import { Router } from "express";
import checkRoutes from "@root/routes/checkRoutes";
import userRoutes from "@root/routes/userRoutes";
import tokenRouter from "@root/routes/tokenRoutes";
import locationRouter from "@root/routes/locationRoutes";
import templateRouter from "@root/routes/templateRoutes";
import traitRouter from "@root/routes/traitRoutes";
import {jwtAuthMiddleware} from "@root/middlewares/jwtMiddleware";
const router = Router();

router.use(checkRoutes);
router.use(userRoutes);
router.use(tokenRouter);
router.use(locationRouter);
router.use(templateRouter);
router.use(traitRouter)

export default router;
