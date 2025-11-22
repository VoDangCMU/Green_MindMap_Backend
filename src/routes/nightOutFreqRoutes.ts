import { Router } from "express";
import controller from "../controller";
import { jwtAuthMiddleware } from "../middlewares/jwtMiddleware";

const nightOutFreqRouter = Router();


nightOutFreqRouter.patch("/night-out", jwtAuthMiddleware, controller.nightOutFreq.patchNightOut);

export default nightOutFreqRouter;
