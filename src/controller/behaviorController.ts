import { Request, Response } from 'express';
import { z } from 'zod';
import AppDataSource from '../infrastructure/database';
import { Behavior } from '../entity/behaviors';
import { ThreadHall } from '../entity/thread_halls';
import { logger } from '../infrastructure/logger';

const BehaviorSchema = z.object({
    name: z.string(),
    type: z.string(),
    keywords: z.array(z.string()),
    description: z.string().optional(),
    threadHallId: z.string().uuid()
});

const BehaviorUpdateSchema = z.object({
    name: z.string().optional(),
    type: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    description: z.string().optional()
});

const BehaviorIdSchema = z.object({
    id: z.string().uuid(),
});

const BehaviorRepository = AppDataSource.getRepository(Behavior);
const ThreadHallRepository = AppDataSource.getRepository(ThreadHall);

function validateBehaviorParams(req: Request, res: Response) {
    const parsed = BehaviorSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, { details: parsed.error });
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

function validateBehaviorUpdateParams(req: Request, res: Response) {
    const parsed = BehaviorUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, { details: parsed.error });
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

class BehaviorController {
    public async createBehavior(req: Request, res: Response) {
        const data = validateBehaviorParams(req, res);
        if (!data) return;

        try {
            // Check if ThreadHall exists
            const threadHall = await ThreadHallRepository.findOne({
                where: { id: data.threadHallId }
            });

            if (!threadHall) {
                return res.status(404).json({ message: "ThreadHall not found" });
            }

            const behavior = new Behavior();
            behavior.name = data.name;
            behavior.type = data.type;
            behavior.keywords = data.keywords;
            behavior.description = data.description;
            behavior.threadHall = threadHall;

            const savedBehavior = await BehaviorRepository.save(behavior);
            return res.status(201).json(savedBehavior);
        } catch (e) {
            logger.error('Error creating behavior', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async getBehaviorById(req: Request, res: Response) {
        const parsed = BehaviorIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const behaviorId = parsed.data.id;

        try {
            const behavior = await BehaviorRepository.findOne({
                where: { id: behaviorId },
                relations: ['threadHall']
            });

            if (!behavior) {
                return res.status(404).json({ error: 'Behavior not found' });
            }

            return res.status(200).json(behavior);
        } catch (e) {
            logger.error('Error fetching behavior', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async updateBehaviorById(req: Request, res: Response) {
        const data = validateBehaviorUpdateParams(req, res);
        if (!data) return;

        const parsed = BehaviorIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const behaviorId = parsed.data.id;

        try {
            const existedBehavior = await BehaviorRepository.findOne({
                where: { id: behaviorId }
            });

            if (!existedBehavior) {
                return res.status(404).json({ error: 'Behavior not found' });
            }

            if (data.name !== undefined) existedBehavior.name = data.name;
            if (data.type !== undefined) existedBehavior.type = data.type;
            if (data.keywords !== undefined) existedBehavior.keywords = data.keywords;
            if (data.description !== undefined) existedBehavior.description = data.description;

            const updatedBehavior = await BehaviorRepository.save(existedBehavior);
            return res.status(200).json(updatedBehavior);
        } catch (e) {
            logger.error('Error updating behavior', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async deleteBehaviorById(req: Request, res: Response) {
        const parsed = BehaviorIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const behaviorId = parsed.data.id;

        try {
            const behavior = await BehaviorRepository.findOne({
                where: { id: behaviorId }
            });

            if (!behavior) {
                return res.status(404).json({ error: 'Behavior not found' });
            }

            await BehaviorRepository.delete(behaviorId);
            return res.status(200).json({ message: 'Behavior deleted successfully', deletedData: behavior });
        } catch (e) {
            logger.error('Error deleting behavior', e as Error);
            return res.status(500).json({ error: 'Database error occurred while deleting the behavior.' });
        }
    }

    public async getAllBehaviors(req: Request, res: Response) {
        try {
            const behaviors = await BehaviorRepository.find({
                relations: ['threadHall']
            });

            return res.status(200).json(behaviors);
        } catch (e) {
            logger.error('Error fetching all behaviors', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async getBehaviorsByThreadHall(req: Request, res: Response) {
        const threadHallId = req.params.threadHallId;

        if (!threadHallId) {
            return res.status(400).json({ message: "ThreadHall ID is required" });
        }

        try {
            const behaviors = await BehaviorRepository.find({
                where: { threadHall: { id: threadHallId } },
                relations: ['threadHall']
            });

            return res.status(200).json(behaviors);
        } catch (e) {
            logger.error('Error fetching behaviors by thread hall', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }
}

export default new BehaviorController();
