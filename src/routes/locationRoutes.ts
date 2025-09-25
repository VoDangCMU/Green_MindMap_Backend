import {Router} from "express";
import locationController from "../controller/locationController";
import { jwtAuthMiddleware } from "../middlewares/jwtMiddleware";

const location = Router();

locationRouter.use(jwtAuthMiddleware); // Re-enable JWT middleware for location routes
locationRouter.post("/location/create", locationController.create);

export default location;
