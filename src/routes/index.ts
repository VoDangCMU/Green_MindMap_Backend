import { Router } from "express";
import checkRoutes from "@root/routes/checkRoutes";
import userRoutes from "@root/routes/userRoutes";
const router = Router();

router.use(checkRoutes);
router.use(userRoutes)
export default router;
