import { Router } from "express";
import templateController from "@root/controller/templateController";

const router = Router();

router.post("/template/create", templateController.createTemplate);
router.get("/template/:id", templateController.getTemplateById);
router.put("/template/update/:id", templateController.updateTemplateById);
router.delete("/template/delete/:id", templateController.deleteTemplateById);

export default router;
