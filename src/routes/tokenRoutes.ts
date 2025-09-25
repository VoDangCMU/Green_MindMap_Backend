import { Router } from "express";
import controller from "../controller";
import { jwtAuthMiddleware } from "../middlewares/jwtMiddleware";

const tokenRouter = Router();
tokenRouter.use(jwtAuthMiddleware); // Re-enable JWT middleware for token routes
tokenRouter.get("/token/access-token", controller.token.GetNewToken);

export default tokenRouter;