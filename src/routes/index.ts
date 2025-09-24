import { Router } from "express";
import checkRoutes from "@root/routes/checkRoutes";
import userRoutes from "@root/routes/userRoutes";
import tokenRouter from "@root/routes/tokenRoutes";
import helloRoutes from "@root/routes/helloRoutes";
const router = Router();

router.use(checkRoutes);
router.use(userRoutes);
router.use(tokenRouter);
router.use(helloRoutes);

export default router;
