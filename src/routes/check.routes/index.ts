import { Router } from "express";
import { healthCheckController } from "@root/controller/check.controller";

const router = Router();

router.get("/check", healthCheckController);

export default router;