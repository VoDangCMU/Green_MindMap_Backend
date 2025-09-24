import { Router } from "express";
import locationController from "../controller/locationController";

const locationRouter = Router();


locationRouter.post("/location/create", locationController.create);

export default locationRouter;