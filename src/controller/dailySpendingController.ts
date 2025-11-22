import { Request, Response } from "express";
import { z } from "zod";

import AppDataSource from "../infrastructure/database";
import { AvgDailySpend } from "../entity/daily_spend";
import { User } from "../entity/user";
import { logger } from "../infrastructure";

const DailySpendingRepo = AppDataSource.getRepository(AvgDailySpend);
const UserRepo = AppDataSource.getRepository(User);

const API_URL = "https://ai-greenmind.khoav4.com/avg_daily_spend";

const DEFAULTS = {
    weight: 0.2,
    sigma_r: 1.0,
    alpha: 0.5,
};

const DailySpendingParamsSchema = z.object({
    date: z.string().date().optional(),
    dailyTotal: z.number().optional(),
    direction: z.string().default("down"),
    baseAvg: z.number(),
    weight: z.number().min(0).max(1).optional().default(DEFAULTS.weight),
    sigma_r: z.number().optional().default(DEFAULTS.sigma_r),
    alpha: z.number().optional().default(DEFAULTS.alpha),
});

const CreateOrUpdateSpendSchema = z.object({
    spend: z.union([
        z.array(z.number()),
        z.number()
    ]),
    date: z.string().date().optional(),
});

export class DailySpendingController {
    public CreateOrUpdateSpend = async (req: Request, res: Response) => {
        try {
            logger.info("CreateOrUpdateSpend called", {
                userId: req.user?.userId,
                body: req.body
            });

            const parsed = CreateOrUpdateSpendSchema.safeParse(req.body);
            if (!parsed.success) {
                logger.warn("Invalid parameters for CreateOrUpdateSpend", {
                    errors: parsed.error.errors
                });
                return res.status(400).json({ error: "Invalid parameters", details: parsed.error.errors });
            }

            const userId = req.user?.userId;
            if (!userId) {
                logger.warn("Unauthorized access to CreateOrUpdateSpend");
                return res.status(401).json({ error: "Unauthorized" });
            }

            const user = await UserRepo.findOne({
                where: { id: userId }
            });

            if (!user) {
                logger.warn("User not found", { userId });
                return res.status(404).json({ error: "User not found" });
            }

            const targetDate = parsed.data.date ? new Date(parsed.data.date) : new Date();
            targetDate.setHours(0, 0, 0, 0);

            const spendArray = Array.isArray(parsed.data.spend)
                ? parsed.data.spend
                : [parsed.data.spend];

            let dailySpendRecord = await DailySpendingRepo.findOne({
                where: {
                    user: { id: userId },
                    day_spend: targetDate
                }
            });

            if (dailySpendRecord) {
                const currentSpend = dailySpendRecord.spend || [];
                dailySpendRecord.spend = [...currentSpend, ...spendArray];
                dailySpendRecord.total_spend = dailySpendRecord.spend.reduce((sum, val) => sum + val, 0);

                const saved = await DailySpendingRepo.save(dailySpendRecord);

                logger.info("Spend updated successfully", {
                    userId,
                    recordId: saved.id,
                    totalSpend: saved.total_spend,
                    date: targetDate
                });

                return res.status(200).json({
                    success: true,
                    message: "Spend updated successfully",
                    data: saved
                });
            } else {
                const total = spendArray.reduce((sum, val) => sum + val, 0);

                const newRecord = DailySpendingRepo.create({
                    user: user,
                    spend: spendArray,
                    total_spend: total,
                    day_spend: targetDate
                });

                const saved = await DailySpendingRepo.save(newRecord);

                logger.info("Spend created successfully", {
                    userId,
                    recordId: saved.id,
                    totalSpend: saved.total_spend,
                    date: targetDate
                });

                return res.status(200).json({
                    success: true,
                    message: "Spend created successfully",
                    data: saved
                });
            }

        } catch (e) {
            logger.error("Failed to create or update spend", e as Error, {
                userId: req.user?.userId
            });
            return res.status(400).json({
                error: "Failed to create or update spend",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };
}

export default new DailySpendingController();
