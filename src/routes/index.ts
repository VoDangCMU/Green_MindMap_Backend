import { Router } from "express";
import checkRoutes from "@root/routes/check.routes";

const router = Router();

router.use(checkRoutes);

export default router;
