import {Router} from "express";
import healthyFoodRatioController from "../controller/healthyFoodRatioController";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";

const router = Router();

// Create/Update healthy food ratio and get metrics from AI
router.post("/", jwtAuthMiddleware, healthyFoodRatioController.createHealthyFoodRatio);

// Get healthy food ratio for current user
router.get("/", jwtAuthMiddleware, healthyFoodRatioController.getHealthyFoodRatio);

// Get all metrics for current user
router.get("/metrics", jwtAuthMiddleware, healthyFoodRatioController.getMetrics);

// Get latest metric for current user
router.get("/metrics/latest", jwtAuthMiddleware, healthyFoodRatioController.getLatestMetric);

export default router;
