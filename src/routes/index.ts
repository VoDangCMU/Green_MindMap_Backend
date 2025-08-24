import { Router } from "express";
import checkRoutes from "@root/routes/checkRoutes";
import userRoutes from "@root/routes/userRoutes";
import tokenRouter from "@root/routes/tokenRoutes";
const router = Router();

router.use(checkRoutes);
router.use(userRoutes);
router.use(tokenRouter);

export default router;
