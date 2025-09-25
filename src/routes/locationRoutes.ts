import { Router } from "express";
import locationController from "../controller/locationController";
import { jwtAuthMiddleware } from "../middlewares/jwtMiddleware";

const router = Router();

router.use(jwtAuthMiddleware); // Re-enable JWT middleware for location routes
router.post("/create", locationController.createLocation);

export default router;
