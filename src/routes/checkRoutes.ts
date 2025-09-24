import { Router } from "express";
import controller from "../controller";

const router = Router();

router.get("/check", controller.health.checkHealth);

export default router;