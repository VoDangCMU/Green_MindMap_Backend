import { Router } from "express";
import templateController from "../controller/templateController";
import {jwtAuthMiddleware} from "../middlewares/jwtMiddleware";

const template = Router();
template.use(jwtAuthMiddleware)
template.post("/template/create", templateController.createTemplate);
template.get("/template/:id", templateController.getTemplateById);
template.put("/template/update/:id", templateController.updateTemplateById);
template.delete("/template/delete/:id", templateController.deleteTemplateById);

export default template;
