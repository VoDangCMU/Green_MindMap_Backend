import { Router } from "express";
import controller from "@root/controller";

const router = Router();

// Check health
router.get("/check", controller.health.checkHealth);

export default router;