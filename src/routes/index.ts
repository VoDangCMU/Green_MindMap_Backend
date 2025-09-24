import { Router } from "express";
import checkRoutes from "./checkRoutes";
import userRoutes from "./userRoutes";
import tokenRouter from "./tokenRoutes";
import locationRouter from "./locationRoutes";
import templateRouter from "./templateRoutes";
import traitRouter from "./traitRoutes";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";
const router = Router();

router.use(checkRoutes);
router.use(userRoutes);
router.use(tokenRouter);
router.use(locationRouter);
router.use(templateRouter);
router.use(traitRouter)

export default router;
