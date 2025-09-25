import { Request, Response } from 'express';
import { z } from 'zod';
import AppDataSource from '../infrastructure/database';
import { BigFive } from '../entity/big_five';
import { User } from '../entity/user';
import { logger } from '../infrastructure/logger';

const BigFiveSchema = z.object({
    openness: z.number().min(0).max(1),
    conscientiousness: z.number().min(0).max(1),
    extraversion: z.number().min(0).max(1),
    agreeableness: z.number().min(0).max(1),
    neuroticism: z.number().min(0).max(1),
    userId: z.string().uuid()
});

const BigFiveUpdateSchema = z.object({
    openness: z.number().min(0).max(1).optional(),
    conscientiousness: z.number().min(0).max(1).optional(),
    extraversion: z.number().min(0).max(1).optional(),
    agreeableness: z.number().min(0).max(1).optional(),
    neuroticism: z.number().min(0).max(1).optional()
});

const BigFiveIdSchema = z.object({
    id: z.string().uuid(),
});

const UserIdSchema = z.object({
    userId: z.string().uuid(),
});

const BigFiveRepository = AppDataSource.getRepository(BigFive);
const UserRepository = AppDataSource.getRepository(User);

function validateBigFiveParams(req: Request, res: Response) {
    const parsed = BigFiveSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, { details: parsed.error });
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

function validateBigFiveUpdateParams(req: Request, res: Response) {
    const parsed = BigFiveUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, { details: parsed.error });
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

class BigFiveController {
    public async createBigFive(req: Request, res: Response) {
        const data = validateBigFiveParams(req, res);
        if (!data) return;

        try {
            // Check if user exists
            const user = await UserRepository.findOne({
                where: { id: data.userId },
                relations: ['bigFive']
            });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Check if user already has BigFive data
            if (user.bigFive) {
                return res.status(400).json({ message: "User already has Big Five personality data" });
            }

            const bigFive = new BigFive();
            bigFive.openness = data.openness;
            bigFive.conscientiousness = data.conscientiousness;
            bigFive.extraversion = data.extraversion;
            bigFive.agreeableness = data.agreeableness;
            bigFive.neuroticism = data.neuroticism;
            bigFive.user = user;

            const savedBigFive = await BigFiveRepository.save(bigFive);

            return res.status(201).json(savedBigFive);
        } catch (e) {
            logger.error('Error creating Big Five data', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async getBigFiveById(req: Request, res: Response) {
        const parsed = BigFiveIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const bigFiveId = parsed.data.id;

        try {
            const bigFive = await BigFiveRepository.findOne({
                where: { id: bigFiveId },
                relations: ['user']
            });

            if (!bigFive) {
                return res.status(404).json({ error: 'Big Five data not found' });
            }

            return res.status(200).json(bigFive);
        } catch (e) {
            logger.error('Error fetching Big Five data', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async getBigFiveByUserId(req: Request, res: Response) {
        const parsed = UserIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const userId = parsed.data.userId;

        try {
            const bigFive = await BigFiveRepository.findOne({
                where: { user: { id: userId } },
                relations: ['user']
            });

            if (!bigFive) {
                return res.status(404).json({ error: 'Big Five data not found for this user' });
            }

            return res.status(200).json(bigFive);
        } catch (e) {
            logger.error('Error fetching Big Five data by user ID', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async updateBigFiveById(req: Request, res: Response) {
        const data = validateBigFiveUpdateParams(req, res);
        if (!data) return;

        const parsed = BigFiveIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const bigFiveId = parsed.data.id;

        try {
            const existedBigFive = await BigFiveRepository.findOne({
                where: { id: bigFiveId }
            });

            if (!existedBigFive) {
                return res.status(404).json({ error: 'Big Five data not found' });
            }

            // Update only provided fields
            if (data.openness !== undefined) existedBigFive.openness = data.openness;
            if (data.conscientiousness !== undefined) existedBigFive.conscientiousness = data.conscientiousness;
            if (data.extraversion !== undefined) existedBigFive.extraversion = data.extraversion;
            if (data.agreeableness !== undefined) existedBigFive.agreeableness = data.agreeableness;
            if (data.neuroticism !== undefined) existedBigFive.neuroticism = data.neuroticism;

            const updatedBigFive = await BigFiveRepository.save(existedBigFive);

            return res.status(200).json(updatedBigFive);
        } catch (e) {
            logger.error('Error updating Big Five data', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async deleteBigFiveById(req: Request, res: Response) {
        const parsed = BigFiveIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const bigFiveId = parsed.data.id;

        try {
            const bigFive = await BigFiveRepository.findOne({
                where: { id: bigFiveId }
            });

            if (!bigFive) {
                return res.status(404).json({ error: 'Big Five data not found' });
            }

            await BigFiveRepository.delete(bigFiveId);

            return res.status(200).json({ message: 'Big Five data deleted successfully', deletedData: bigFive });
        } catch (e) {
            logger.error('Error deleting Big Five data', e as Error);
            return res.status(500).json({ error: 'Database error occurred while deleting the Big Five data.' });
        }
    }

    public async getAllBigFive(req: Request, res: Response) {
        try {
            const bigFiveData = await BigFiveRepository.find({
                relations: ['user'],
                select: {
                    user: {
                        id: true,
                        username: true,
                        fullName: true
                    }
                }
            });

            return res.status(200).json(bigFiveData);
        } catch (e) {
            logger.error('Error fetching all Big Five data', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }
}

export default new BigFiveController();
