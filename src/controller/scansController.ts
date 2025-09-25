import { Request, Response } from 'express';
import { z } from 'zod';
import AppDataSource from '../infrastructure/database';
import { Scans } from '../entity/scans';
import { User } from '../entity/user';
import { FoodItems } from '../entity/food_items';
import { logger } from '../infrastructure/logger';

const ScansSchema = z.object({
    userId: z.string().uuid(),
    foodItemsId: z.string().uuid(),
    scan_time: z.string().datetime()
});

const ScansUpdateSchema = z.object({
    scan_time: z.string().datetime().optional()
});

const ScansIdSchema = z.object({
    id: z.string().uuid(),
});

const UserIdSchema = z.object({
    userId: z.string().uuid(),
});

const ScansRepository = AppDataSource.getRepository(Scans);
const UserRepository = AppDataSource.getRepository(User);
const FoodItemsRepository = AppDataSource.getRepository(FoodItems);

function validateScansParams(req: Request, res: Response) {
    const parsed = ScansSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, { details: parsed.error });
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

function validateScansUpdateParams(req: Request, res: Response) {
    const parsed = ScansUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, { details: parsed.error });
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

class ScansController {
    public async createScan(req: Request, res: Response) {
        const data = validateScansParams(req, res);
        if (!data) return;

        try {
            // Check if User exists
            const user = await UserRepository.findOne({
                where: { id: data.userId }
            });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Check if FoodItems exists
            const foodItems = await FoodItemsRepository.findOne({
                where: { id: data.foodItemsId }
            });

            if (!foodItems) {
                return res.status(404).json({ message: "Food item not found" });
            }

            const scan = new Scans();
            scan.user = user;
            scan.foodItems = foodItems;
            scan.scan_time = new Date(data.scan_time);

            const savedScan = await ScansRepository.save(scan);
            return res.status(201).json(savedScan);
        } catch (e) {
            logger.error('Error creating scan', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async getScanById(req: Request, res: Response) {
        const parsed = ScansIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const scanId = parsed.data.id;

        try {
            const scan = await ScansRepository.findOne({
                where: { id: scanId },
                relations: ['user', 'foodItems', 'invoices']
            });

            if (!scan) {
                return res.status(404).json({ error: 'Scan not found' });
            }

            return res.status(200).json(scan);
        } catch (e) {
            logger.error('Error fetching scan', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async getScansByUserId(req: Request, res: Response) {
        const parsed = UserIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const userId = parsed.data.userId;

        try {
            const scans = await ScansRepository.find({
                where: { user: { id: userId } },
                relations: ['user', 'foodItems'],
                order: { scan_time: 'DESC' }
            });

            return res.status(200).json(scans);
        } catch (e) {
            logger.error('Error fetching scans by user ID', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async updateScanById(req: Request, res: Response) {
        const data = validateScansUpdateParams(req, res);
        if (!data) return;

        const parsed = ScansIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const scanId = parsed.data.id;

        try {
            const existedScan = await ScansRepository.findOne({
                where: { id: scanId }
            });

            if (!existedScan) {
                return res.status(404).json({ error: 'Scan not found' });
            }

            if (data.scan_time !== undefined) {
                existedScan.scan_time = new Date(data.scan_time);
            }

            const updatedScan = await ScansRepository.save(existedScan);
            return res.status(200).json(updatedScan);
        } catch (e) {
            logger.error('Error updating scan', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async deleteScanById(req: Request, res: Response) {
        const parsed = ScansIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const scanId = parsed.data.id;

        try {
            const scan = await ScansRepository.findOne({
                where: { id: scanId }
            });

            if (!scan) {
                return res.status(404).json({ error: 'Scan not found' });
            }

            await ScansRepository.delete(scanId);
            return res.status(200).json({ message: 'Scan deleted successfully', deletedData: scan });
        } catch (e) {
            logger.error('Error deleting scan', e as Error);
            return res.status(500).json({ error: 'Database error occurred while deleting the scan.' });
        }
    }

    public async getAllScans(req: Request, res: Response) {
        try {
            const scans = await ScansRepository.find({
                relations: ['user', 'foodItems'],
                order: { scan_time: 'DESC' }
            });

            return res.status(200).json(scans);
        } catch (e) {
            logger.error('Error fetching all scans', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }
}

export default new ScansController();
