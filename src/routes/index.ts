import { Router } from "express";
import checkRoutes from "@root/routes/checkRoutes";
import userRoutes from "@root/routes/userRoutes";
import tokenRouter from "@root/routes/tokenRoutes";
import locationRouter from "@root/routes/locationRoutes";
import {jwtAuthMiddleware} from "@root/middlewares/jwtMiddleware";
const router = Router();

router.use(checkRoutes);
router.use(userRoutes);
router.use(tokenRouter);
router.use(locationRouter);

export default router;
