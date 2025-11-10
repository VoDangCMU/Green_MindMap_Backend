import { Request, Response, RequestHandler } from "express";
import AppDataSource from "../infrastructure/database";
import { Todo } from "../entity/todos";
import { getLogger } from "../infrastructure/logger";

interface TodoNode {
    title: string;
    completed?: boolean;
    completedItems?: number;
    totalItems?: number;
    subtasks?: TodoNode[];
}

interface CreateTodoRequest {
    title: string;
    parent_id?: string | null;
    completed?: boolean;
}

interface CreateTodosListRequest {
    todos: CreateTodoRequest[];
}

class TodoController {
    /**
     * Create a single todo item
     * POST /api/todos
     * Body: { title, parent_id?, completed? }
     */
    public createTodo: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const userId = (req as any).userId;
        const { title, parent_id = null, completed = false } = req.body;

        if (!title) {
            res.status(400).json({ message: "Title is required" });
            return;
        }

        try {
            const todoRepository = AppDataSource.getRepository(Todo);

            // Validate parent exists if parent_id is provided
            if (parent_id) {
                const parent = await todoRepository.findOne({
                    where: { id: parent_id, user_id: userId }
                });

                if (!parent) {
                    res.status(404).json({ message: "Parent todo not found" });
                    return;
                }
            }

            // Get the max order for this parent
            const maxOrder = await todoRepository
                .createQueryBuilder("todo")
                .where("todo.user_id = :userId", { userId })
                .andWhere("todo.parent_id IS NULL")
                .andWhere(parent_id ? "todo.parent_id = :parent_id" : "1=1", { parent_id })
                .select("MAX(todo.order)", "maxOrder")
                .getRawOne();

            const newTodo = todoRepository.create({
                title,
                parent_id,
                completed,
                user_id: userId,
                order: (maxOrder?.maxOrder || 0) + 1
            });

            await todoRepository.save(newTodo);

            logger.info("Todo created", { todoId: newTodo.id, userId });
            res.status(201).json({
                message: "Todo created successfully",
                data: newTodo
            });
        } catch (error) {
            logger.error("Error creating todo", error as Error);
            res.status(500).json({ message: "Internal server error" });
        }
    };

    /**
     * Create multiple todos with the same parent
     * POST /api/todos/batch
     * Body: { todos: [{ title, parent_id?, completed? }], parent_id? }
     */
    public createTodosList: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const userId = (req as any).userId;
        const { todos, parent_id = null } = req.body;

        if (!todos || !Array.isArray(todos) || todos.length === 0) {
            res.status(400).json({ message: "Todos array is required" });
            return;
        }

        try {
            const todoRepository = AppDataSource.getRepository(Todo);

            // Validate parent exists if parent_id is provided
            if (parent_id) {
                const parent = await todoRepository.findOne({
                    where: { id: parent_id, user_id: userId }
                });

                if (!parent) {
                    res.status(404).json({ message: "Parent todo not found" });
                    return;
                }
            }

            // Get the max order for this parent
            const maxOrder = await todoRepository
                .createQueryBuilder("todo")
                .where("todo.user_id = :userId", { userId })
                .andWhere(parent_id ? "todo.parent_id = :parent_id" : "todo.parent_id IS NULL", { parent_id })
                .select("MAX(todo.order)", "maxOrder")
                .getRawOne();

            let currentOrder = (maxOrder?.maxOrder || 0) + 1;

            const newTodos = todos.map((todo: CreateTodoRequest) => {
                const todoItem = todoRepository.create({
                    title: todo.title,
                    parent_id: todo.parent_id !== undefined ? todo.parent_id : parent_id,
                    completed: todo.completed || false,
                    user_id: userId,
                    order: currentOrder++
                });
                return todoItem;
            });

            await todoRepository.save(newTodos);

            logger.info("Multiple todos created", { count: newTodos.length, userId });
            res.status(201).json({
                message: "Todos created successfully",
                data: newTodos
            });
        } catch (error) {
            logger.error("Error creating todos list", error as Error);
            res.status(500).json({ message: "Internal server error" });
        }
    };

    /**
     * Get all todos for the current user in tree structure
     * GET /api/todos
     */
    public getTodos: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const userId = (req as any).userId;

        try {
            const todoRepository = AppDataSource.getRepository(Todo);

            // Get all todos for the user
            const allTodos = await todoRepository.find({
                where: { user_id: userId },
                order: { order: 'ASC' }
            });

            // Build tree structure
            const todoMap = new Map<string, any>();
            const rootTodos: any[] = [];

            // First pass: create all nodes
            allTodos.forEach(todo => {
                todoMap.set(todo.id, {
                    id: todo.id,
                    title: todo.title,
                    completed: todo.completed,
                    completedItems: 0,
                    totalItems: 0,
                    subtasks: [],
                    parent_id: todo.parent_id,
                    order: todo.order,
                    createdAt: todo.createdAt,
                    updatedAt: todo.updatedAt
                });
            });

            // Second pass: build relationships and calculate stats
            allTodos.forEach(todo => {
                const node = todoMap.get(todo.id);
                
                if (todo.parent_id) {
                    const parent = todoMap.get(todo.parent_id);
                    if (parent) {
                        parent.subtasks.push(node);
                    }
                } else {
                    rootTodos.push(node);
                }
            });

            // Calculate completedItems and totalItems recursively
            const calculateStats = (node: any): { completed: number; total: number } => {
                if (node.subtasks.length === 0) {
                    return {
                        completed: node.completed ? 1 : 0,
                        total: 1
                    };
                }

                let completed = 0;
                let total = 0;

                node.subtasks.forEach((subtask: any) => {
                    const stats = calculateStats(subtask);
                    completed += stats.completed;
                    total += stats.total;
                });

                node.completedItems = completed;
                node.totalItems = total;

                return { completed, total };
            };

            rootTodos.forEach(root => calculateStats(root));

            logger.info("Todos retrieved", { userId, count: rootTodos.length });
            res.status(200).json({
                message: "Todos retrieved successfully",
                data: rootTodos
            });
        } catch (error) {
            logger.error("Error getting todos", error as Error);
            res.status(500).json({ message: "Internal server error" });
        }
    };

    /**
     * Get a single todo by ID
     * GET /api/todos/:id
     */
    public getTodoById: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const userId = (req as any).userId;
        const { id } = req.params;

        try {
            const todoRepository = AppDataSource.getRepository(Todo);

            const todo = await todoRepository.findOne({
                where: { id, user_id: userId }
            });

            if (!todo) {
                res.status(404).json({ message: "Todo not found" });
                return;
            }

            // Get subtasks
            const subtasks = await todoRepository.find({
                where: { parent_id: id, user_id: userId },
                order: { order: 'ASC' }
            });

            const result = {
                ...todo,
                subtasks
            };

            logger.info("Todo retrieved", { todoId: id, userId });
            res.status(200).json({
                message: "Todo retrieved successfully",
                data: result
            });
        } catch (error) {
            logger.error("Error getting todo", error as Error);
            res.status(500).json({ message: "Internal server error" });
        }
    };

    /**
     * Update a todo
     * PUT /api/todos/:id
     */
    public updateTodo: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const userId = (req as any).userId;
        const { id } = req.params;
        const { title, completed, parent_id } = req.body;

        try {
            const todoRepository = AppDataSource.getRepository(Todo);

            const todo = await todoRepository.findOne({
                where: { id, user_id: userId }
            });

            if (!todo) {
                res.status(404).json({ message: "Todo not found" });
                return;
            }

            // Validate parent if changing parent_id
            if (parent_id !== undefined && parent_id !== todo.parent_id) {
                if (parent_id) {
                    // Check for circular dependency
                    if (parent_id === id) {
                        res.status(400).json({ message: "Cannot set todo as its own parent" });
                        return;
                    }

                    const parent = await todoRepository.findOne({
                        where: { id: parent_id, user_id: userId }
                    });

                    if (!parent) {
                        res.status(404).json({ message: "Parent todo not found" });
                        return;
                    }
                }
            }

            if (title !== undefined) todo.title = title;
            if (completed !== undefined) todo.completed = completed;
            if (parent_id !== undefined) todo.parent_id = parent_id;

            await todoRepository.save(todo);

            logger.info("Todo updated", { todoId: id, userId });
            res.status(200).json({
                message: "Todo updated successfully",
                data: todo
            });
        } catch (error) {
            logger.error("Error updating todo", error as Error);
            res.status(500).json({ message: "Internal server error" });
        }
    };

    /**
     * Delete a todo and all its subtasks
     * DELETE /api/todos/:id
     */
    public deleteTodo: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const userId = (req as any).userId;
        const { id } = req.params;

        try {
            const todoRepository = AppDataSource.getRepository(Todo);

            const todo = await todoRepository.findOne({
                where: { id, user_id: userId }
            });

            if (!todo) {
                res.status(404).json({ message: "Todo not found" });
                return;
            }

            // Delete will cascade to subtasks due to onDelete: 'CASCADE'
            await todoRepository.remove(todo);

            logger.info("Todo deleted", { todoId: id, userId });
            res.status(200).json({
                message: "Todo deleted successfully"
            });
        } catch (error) {
            logger.error("Error deleting todo", error as Error);
            res.status(500).json({ message: "Internal server error" });
        }
    };

    /**
     * Toggle todo completed status
     * PATCH /api/todos/:id/toggle
     */
    public toggleTodo: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const userId = (req as any).userId;
        const { id } = req.params;

        try {
            const todoRepository = AppDataSource.getRepository(Todo);

            const todo = await todoRepository.findOne({
                where: { id, user_id: userId }
            });

            if (!todo) {
                res.status(404).json({ message: "Todo not found" });
                return;
            }

            todo.completed = !todo.completed;
            await todoRepository.save(todo);

            logger.info("Todo toggled", { todoId: id, userId, completed: todo.completed });
            res.status(200).json({
                message: "Todo toggled successfully",
                data: todo
            });
        } catch (error) {
            logger.error("Error toggling todo", error as Error);
            res.status(500).json({ message: "Internal server error" });
        }
    };
}

export default new TodoController();
