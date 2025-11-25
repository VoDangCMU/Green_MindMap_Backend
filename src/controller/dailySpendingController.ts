import { Request, Response } from "express";
import { z } from "zod";
import axios from "axios";

import AppDataSource from "../infrastructure/database";
import { AvgDailySpend } from "../entity/daily_spend";
import { BigFive } from "../entity/big_five";
import { Metrics } from "../entity/metrics";
import { User } from "../entity/user";
import { logger } from "../infrastructure";

const DailySpendingRepo = AppDataSource.getRepository(AvgDailySpend);
const UserRepo = AppDataSource.getRepository(User);
const BigFiveRepo = AppDataSource.getRepository(BigFive);
const MetricsRepo = AppDataSource.getRepository(Metrics);

const DEFAULTS = {
    weight: 0.2,
    direction: "down",
    sigma_r: 1.0,
    alpha: 0.5,
};

const AI_API_URL = "https://ai-greenmind.khoav4.com";

const CreateOrUpdateSpendSchema = z.object({
    spend: z.number(),
    date: z.string().date().optional(),
});

const CreateOrUpdateAverageDailySchema = z.object({
    daily_total: z.number(),
    base_avg: z.number(),
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

            const spendAmount = parsed.data.spend;

            let dailySpendRecord = await DailySpendingRepo.findOne({
                where: {
                    user: { id: userId },
                    day_spend: targetDate
                }
            });

            if (dailySpendRecord) {
                // Cập nhật: cộng thêm vào total_spend hiện tại
                dailySpendRecord.total_spend += spendAmount;

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
                // Tạo mới
                const newRecord = DailySpendingRepo.create({
                    user: user,
                    total_spend: spendAmount,
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

    public createOrUpdateAverageDaily = async (req: Request, res: Response) => {
        try {
            logger.info("createOrUpdateAverageDaily called", {
                userId: req.user?.userId,
                body: req.body
            });

            const parsed = CreateOrUpdateAverageDailySchema.safeParse(req.body);
            if (!parsed.success) {
                logger.warn("Invalid parameters for createOrUpdateAverageDaily", {
                    errors: parsed.error.errors
                });
                return res.status(400).json({
                    error: "Invalid parameters",
                    details: parsed.error.errors
                });
            }

            const userId = req.user?.userId;
            if (!userId) {
                logger.warn("Unauthorized access to createOrUpdateAverageDaily");
                return res.status(401).json({ error: "Unauthorized" });
            }

            const { daily_total, base_avg } = parsed.data;

            // Get user's BigFive scores
            const bigFive = await BigFiveRepo.findOne({
                where: { user: { id: userId } }
            });

            if (!bigFive) {
                logger.warn("BigFive not found for user", { userId });
                return res.status(404).json({ error: "BigFive scores not found for user" });
            }

            // Prepare ocean_score
            const ocean_score = {
                O: bigFive.openness,
                C: bigFive.conscientiousness,
                E: bigFive.extraversion,
                A: bigFive.agreeableness,
                N: bigFive.neuroticism
            };

            // Prepare request payload for AI API
            const apiPayload = {
                daily_total,
                base_avg,
                weight: DEFAULTS.weight,
                direction: DEFAULTS.direction,
                sigma_r: DEFAULTS.sigma_r,
                alpha: DEFAULTS.alpha,
                ocean_score
            };

            logger.info("Calling AI API for avg_daily_spend", {
                userId,
                payload: apiPayload
            });

            // Call AI API
            const aiResponse = await axios.post(
                `${AI_API_URL}/avg_daily_spend`,
                apiPayload,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const aiData = aiResponse.data;

            logger.info("AI API response received", {
                userId,
                metric: aiData.metric
            });

            // Update or create Metrics record
            let metricRecord = await MetricsRepo.findOne({
                where: {
                    userId: userId,
                    type: "avg_daily_spend"
                }
            });

            if (metricRecord) {
                metricRecord.vt = aiData.vt;
                metricRecord.bt = aiData.bt;
                metricRecord.r = aiData.r;
                metricRecord.n = aiData.n;
                metricRecord.contrib = aiData.contrib;
                metricRecord.metadata = {
                    mechanismFeedback: aiData.mechanismFeedback,
                    reason: aiData.reason
                };
            } else {
                metricRecord = MetricsRepo.create({
                    userId: userId,
                    type: "avg_daily_spend",
                    vt: aiData.vt,
                    bt: aiData.bt,
                    r: aiData.r,
                    n: aiData.n,
                    contrib: aiData.contrib,
                    metadata: {
                        mechanismFeedback: aiData.mechanismFeedback,
                        reason: aiData.reason
                    }
                });
            }

            await MetricsRepo.save(metricRecord);

            // Update BigFive with new ocean scores
            if (aiData.new_ocean_score) {
                bigFive.openness = aiData.new_ocean_score.O;
                bigFive.conscientiousness = aiData.new_ocean_score.C;
                bigFive.extraversion = aiData.new_ocean_score.E;
                bigFive.agreeableness = aiData.new_ocean_score.A;
                bigFive.neuroticism = aiData.new_ocean_score.N;

                await BigFiveRepo.save(bigFive);

                logger.info("BigFive updated with new ocean scores", {
                    userId,
                    newScores: aiData.new_ocean_score
                });
            }

            // Return the exact format as received from AI API
            return res.status(200).json(aiData);

        } catch (e) {
            if (axios.isAxiosError(e)) {
                logger.error("AI API call failed", e, {
                    userId: req.user?.userId,
                    response: e.response?.data
                });
                return res.status(e.response?.status || 500).json({
                    error: "Failed to calculate average daily spend",
                    details: e.response?.data || e.message
                });
            }

            logger.error("Failed to create or update average daily spend", e as Error, {
                userId: req.user?.userId
            });
            return res.status(500).json({
                error: "Failed to create or update average daily spend",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };
}

export default new DailySpendingController();
