import { Router } from "express";
import locationController from "../controller/locationController";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";

const locationRouter = Router();

locationRouter.use(jwtAuthMiddleware);
locationRouter.post("/location/create", locationController.create);

export default locationRouter;