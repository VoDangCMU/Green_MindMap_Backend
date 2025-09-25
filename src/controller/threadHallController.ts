import { Request, Response } from 'express';
import { z } from 'zod';
import AppDataSource from '../infrastructure/database';
import { ThreadHall } from '../entity/thread_halls';
import { Traits } from '../entity/traits';
import { logger } from '../infrastructure/logger';

const ThreadHallSchema = z.object({
    name: z.string(),
    description: z.string(),
    traitsId: z.string().uuid()
});

const ThreadHallUpdateSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional()
});

const ThreadHallIdSchema = z.object({
    id: z.string().uuid(),
});

const ThreadHallRepository = AppDataSource.getRepository(ThreadHall);
const TraitsRepository = AppDataSource.getRepository(Traits);

function validateThreadHallParams(req: Request, res: Response) {
    const parsed = ThreadHallSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, { details: parsed.error });
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

function validateThreadHallUpdateParams(req: Request, res: Response) {
    const parsed = ThreadHallUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, { details: parsed.error });
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

class ThreadHallController {
    public async createThreadHall(req: Request, res: Response) {
        const data = validateThreadHallParams(req, res);
        if (!data) return;

        try {
            // Check if Traits exists
            const traits = await TraitsRepository.findOne({
                where: { id: data.traitsId }
            });

            if (!traits) {
                return res.status(404).json({ message: "Traits not found" });
            }

            const threadHall = new ThreadHall();
            threadHall.name = data.name;
            threadHall.description = data.description;
            threadHall.traits = traits;

            const savedThreadHall = await ThreadHallRepository.save(threadHall);
            return res.status(201).json(savedThreadHall);
        } catch (e) {
            logger.error('Error creating thread hall', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async getThreadHallById(req: Request, res: Response) {
        const parsed = ThreadHallIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const threadHallId = parsed.data.id;

        try {
            const threadHall = await ThreadHallRepository.findOne({
                where: { id: threadHallId },
                relations: ['traits', 'behaviors', 'questions']
            });

            if (!threadHall) {
                return res.status(404).json({ error: 'ThreadHall not found' });
            }

            return res.status(200).json(threadHall);
        } catch (e) {
            logger.error('Error fetching thread hall', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async updateThreadHallById(req: Request, res: Response) {
        const data = validateThreadHallUpdateParams(req, res);
        if (!data) return;

        const parsed = ThreadHallIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const threadHallId = parsed.data.id;

        try {
            const existedThreadHall = await ThreadHallRepository.findOne({
                where: { id: threadHallId }
            });

            if (!existedThreadHall) {
                return res.status(404).json({ error: 'ThreadHall not found' });
            }

            if (data.name !== undefined) existedThreadHall.name = data.name;
            if (data.description !== undefined) existedThreadHall.description = data.description;

            const updatedThreadHall = await ThreadHallRepository.save(existedThreadHall);
            return res.status(200).json(updatedThreadHall);
        } catch (e) {
            logger.error('Error updating thread hall', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async deleteThreadHallById(req: Request, res: Response) {
        const parsed = ThreadHallIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const threadHallId = parsed.data.id;

        try {
            const threadHall = await ThreadHallRepository.findOne({
                where: { id: threadHallId }
            });

            if (!threadHall) {
                return res.status(404).json({ error: 'ThreadHall not found' });
            }

            await ThreadHallRepository.delete(threadHallId);
            return res.status(200).json({ message: 'ThreadHall deleted successfully', deletedData: threadHall });
        } catch (e) {
            logger.error('Error deleting thread hall', e as Error);
            return res.status(500).json({ error: 'Database error occurred while deleting the thread hall.' });
        }
    }

    public async getAllThreadHalls(req: Request, res: Response) {
        try {
            const threadHalls = await ThreadHallRepository.find({
                relations: ['traits']
            });

            return res.status(200).json(threadHalls);
        } catch (e) {
            logger.error('Error fetching all thread halls', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async getThreadHallsByTrait(req: Request, res: Response) {
        const traitId = req.params.traitId;

        if (!traitId) {
            return res.status(400).json({ message: "Trait ID is required" });
        }

        try {
            const threadHalls = await ThreadHallRepository.find({
                where: { traits: { id: traitId } },
                relations: ['traits']
            });

            return res.status(200).json(threadHalls);
        } catch (e) {
            logger.error('Error fetching thread halls by trait', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }
}

export default new ThreadHallController();
