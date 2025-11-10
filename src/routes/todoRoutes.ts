import { Router } from "express";
import todoController from "../controller/todoController";
import { jwtAuthMiddleware } from "../middlewares/jwtMiddleware";

const router = Router();

// All routes require authentication
router.use(jwtAuthMiddleware);

// Create a single todo
router.post("/", todoController.createTodo);

// Create multiple todos (batch)
router.post("/batch", todoController.createTodosList);

// Get all todos (tree structure)
router.get("/", todoController.getTodos);

// Get a single todo by ID
router.get("/:id", todoController.getTodoById);

// Update a todo
router.put("/:id", todoController.updateTodo);

// Toggle todo completed status
router.patch("/:id/toggle", todoController.toggleTodo);

// Delete a todo
router.delete("/:id", todoController.deleteTodo);

export default router;
