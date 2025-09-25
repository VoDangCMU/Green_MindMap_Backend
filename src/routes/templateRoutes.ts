import { Router } from "express";
import controller from "../controller";
import { jwtAuthMiddleware } from "../middlewares/jwtMiddleware";
import { staffOrAdminMiddleware, adminMiddleware } from "../middlewares/adminMiddleware";

const router = Router();

// Template Management Routes

// Create single template (staff/admin only)
router.post("/", jwtAuthMiddleware, staffOrAdminMiddleware, controller.template.createTemplate);

// Create multiple templates at once (staff/admin only) - for frontend batch upload
router.post("/batch", jwtAuthMiddleware, staffOrAdminMiddleware, controller.template.createBatchTemplates);

// Process complex template request - NO AUTHENTICATION REQUIRED (as requested)
router.post("/process-complex", controller.template.processComplexTemplateRequest);

// Get all templates (requires authentication)
router.get("/", jwtAuthMiddleware, controller.template.getAllTemplates);

// Get template by ID (requires authentication)
router.get("/:id", jwtAuthMiddleware, controller.template.getTemplateById);

// Get templates by question type (requires authentication)
router.get("/type/:questionType", jwtAuthMiddleware, controller.template.getTemplatesByType);

// Update template by ID (staff/admin only)
router.put("/:id", jwtAuthMiddleware, staffOrAdminMiddleware, controller.template.updateTemplateById);

// Delete template by ID (admin only)
router.delete("/:id", jwtAuthMiddleware, adminMiddleware, controller.template.deleteTemplateById);

export default router;
