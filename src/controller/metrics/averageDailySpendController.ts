import { Request, Response } from "express";
import AppDataSource from "../../infrastructure/database";
import { Metrics } from "../../entity/metrics";
import { AvgDailySpend } from "../../entity/daily_spend";
import { User } from "../../entity/user";
import { BigFive } from "../../entity/big_five";
import { BehaviorFeedback } from "../../entity/behavior_feedback";
import { logger } from "../../infrastructure";
import axios from "axios";
import { z } from "zod";

const MetricsRepo = AppDataSource.getRepository(Metrics);
const DailySpendRepo = AppDataSource.getRepository(AvgDailySpend);
const UserRepo = AppDataSource.getRepository(User);
const BigFiveRepo = AppDataSource.getRepository(BigFive);
const BehaviorFeedbackRepo = AppDataSource.getRepository(BehaviorFeedback);

const API_URL = "https://ai-greenmind.khoav4.com/avg_daily_spend";

const DEFAULTS = {
    weight: 0.2,
    sigma_r: 1.0,
    alpha: 0.5,
    direction: "down"
};

const AnalyzeResponseSchema = z.object({
    metric: z.string(),
    vt: z.number(),
    bt: z.number(),
    r: z.number(),
    n: z.number(),
    contrib: z.number(),
    new_ocean_score: z.object({
        O: z.number(),
        C: z.number(),
        E: z.number(),
        A: z.number(),
        N: z.number(),
    }),
    mechanismFeedback: z.object({
        awareness: z.string(),
        motivation: z.string(),
        capability: z.string(),
        opportunity: z.string(),
    }).optional(),
    reason: z.string().optional()
});

class AverageDailySpendController {
    public getAvgDailySpend = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                logger.warn("Unauthorized access to getAvgDailySpend");
                return res.status(401).json({ error: "Unauthorized" });
            }

            logger.info("getAvgDailySpend called", { userId });

            // Tìm metric avg_daily_spend của user
            const metricRecord = await MetricsRepo.findOne({
                where: {
                    userId: userId,
                    type: "avg_daily_spend"
                }
            });

            if (!metricRecord) {
                logger.warn("No avg_daily_spend metric found for user", { userId });
                return res.status(404).json({
                    error: "No avg_daily_spend metric found for this user"
                });
            }

            // Lấy big_five hiện tại của user
            const user = await UserRepo.findOne({
                where: { id: userId },
                relations: {
                    bigFive: true
                }
            });

            if (!user || !user.bigFive) {
                logger.warn("User or big five data not found", { userId });
                return res.status(404).json({
                    error: "User or big five data not found"
                });
            }

            const response = {
                metric: "avg_daily_spend",
                vt: metricRecord.vt,
                bt: metricRecord.bt,
                r: metricRecord.r,
                n: metricRecord.n,
                contrib: metricRecord.contrib || 0,
                new_ocean_score: {
                    O: user.bigFive.openness,
                    C: user.bigFive.conscientiousness,
                    E: user.bigFive.extraversion,
                    A: user.bigFive.agreeableness,
                    N: user.bigFive.neuroticism
                },
                mechanismFeedback: metricRecord.metadata?.mechanismFeedback || null,
                reason: metricRecord.metadata?.reason || null
            };

            logger.info("Successfully retrieved avg_daily_spend metric", {
                userId,
                metric: response
            });

            return res.status(200).json(response);

        } catch (e) {
            logger.error("Failed to get avg_daily_spend metric", e as Error, {
                userId: req.user?.userId
            });
            return res.status(500).json({
                error: "Failed to get avg_daily_spend metric",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };

    public updateAvgSpend = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                logger.warn("Unauthorized access to updateAvgSpend");
                return res.status(401).json({ error: "Unauthorized" });
            }

            logger.info("updateAvgSpend called", { userId });

            // Get user
            const user = await UserRepo.findOne({
                where: { id: userId },
                relations: {
                    bigFive: true
                }
            });

            if (!user) {
                logger.warn("User not found", { userId });
                return res.status(404).json({
                    error: "User not found"
                });
            }

            // Get daily spend records
            const dailySpendRecords = await DailySpendRepo.find({
                where: {
                    user: { id: userId }
                },
                order: {
                    day_spend: "DESC"
                }
            });

            if (dailySpendRecords.length === 0) {
                logger.info("No daily spend records for user", { userId });
                return res.status(404).json({
                    error: "No daily spend records found for this user"
                });
            }

            // Tìm metric hiện tại
            let metricRecord = await MetricsRepo.findOne({
                where: {
                    userId: userId,
                    type: "avg_daily_spend"
                }
            });

            // Lấy ngày mới nhất
            const latestRecord = dailySpendRecords[0];
            const latestDate = new Date(latestRecord.day_spend).toISOString().split('T')[0];
            const latestTotalSpend = latestRecord.total_spend || 0;

            let totalSpend: number;
            let totalDays: number;

            if (metricRecord && metricRecord.metadata) {
                // Có metric rồi, kiểm tra last_day_spend
                const lastDaySpend = metricRecord.metadata.last_day_spend;

                if (lastDaySpend === latestDate) {
                    // Ngày trùng, không cần cập nhật
                    logger.info("Last day spend matches latest date, no update needed", {
                        userId,
                        date: latestDate
                    });

                    // Return current metric data in proper format
                    if (!user.bigFive) {
                        logger.warn("User big five data not found", { userId });
                        return res.status(404).json({
                            error: "User big five data not found"
                        });
                    }

                    return res.status(200).json({
                        metric: "avg_daily_spend",
                        vt: metricRecord.vt,
                        bt: metricRecord.bt,
                        r: metricRecord.r,
                        n: metricRecord.n,
                        contrib: metricRecord.contrib || 0,
                        new_ocean_score: {
                            O: user.bigFive.openness,
                            C: user.bigFive.conscientiousness,
                            E: user.bigFive.extraversion,
                            A: user.bigFive.agreeableness,
                            N: user.bigFive.neuroticism
                        },
                        mechanismFeedback: metricRecord.metadata?.mechanismFeedback || null,
                        reason: metricRecord.metadata?.reason || null
                    });
                } else {
                    // Ngày khác, cập nhật
                    totalSpend = (metricRecord.metadata.total_spend || 0) + latestTotalSpend;
                    totalDays = (metricRecord.metadata.day_spend || 0) + 1;
                }
            } else {
                // Chưa có metric, tính từ đầu
                totalSpend = dailySpendRecords.reduce((sum, record) => {
                    return sum + (record.total_spend || 0);
                }, 0);
                totalDays = dailySpendRecords.length;
            }

            // Tính avg spend
            const avgSpend = totalSpend / totalDays;

            // Kiểm tra big_five
            if (!user.bigFive) {
                logger.warn("User does not have big five data", { userId });
                return res.status(404).json({
                    error: "User does not have big five data"
                });
            }

            const direction = latestTotalSpend > avgSpend ? "up" : "down";

            // Gọi API để tính toán metrics mới
            const apiPayload = {
                daily_total: latestTotalSpend,
                base_avg: avgSpend,
                weight: DEFAULTS.weight,
                direction: direction,
                sigma_r: DEFAULTS.sigma_r,
                alpha: DEFAULTS.alpha,
                ocean_score: {
                    O: user.bigFive.openness,
                    C: user.bigFive.conscientiousness,
                    E: user.bigFive.extraversion,
                    A: user.bigFive.agreeableness,
                    N: user.bigFive.neuroticism
                }
            };

            logger.info("Calling external API", {
                userId,
                payload: apiPayload
            });

            const response = await axios.post(API_URL, apiPayload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status !== 200) {
                logger.error("API call failed", undefined, {
                    userId,
                    status: response.status,
                    data: response.data
                });
                return res.status(response.status).json({
                    error: "API call failed",
                    details: response.data
                });
            }

            const parsed = AnalyzeResponseSchema.safeParse(response.data);

            if (!parsed.success) {
                logger.error("Invalid API response", undefined, {
                    userId,
                    errors: parsed.error.errors
                });
                return res.status(500).json({
                    error: "Invalid API response",
                    details: parsed.error.errors
                });
            }

            const apiResult = parsed.data;

            // Cập nhật Big Five
            const newBigFive = new BigFive();
            newBigFive.openness = apiResult.new_ocean_score.O;
            newBigFive.conscientiousness = apiResult.new_ocean_score.C;
            newBigFive.extraversion = apiResult.new_ocean_score.E;
            newBigFive.agreeableness = apiResult.new_ocean_score.A;
            newBigFive.neuroticism = apiResult.new_ocean_score.N;
            await BigFiveRepo.save(newBigFive);

            user.bigFive = newBigFive;
            await UserRepo.save(user);

            logger.info("BigFive updated with new ocean scores", {
                userId,
                newScores: apiResult.new_ocean_score
            });

            // Update or create Metrics record
            if (metricRecord) {
                metricRecord.vt = apiResult.vt;
                metricRecord.bt = apiResult.bt;
                metricRecord.r = apiResult.r;
                metricRecord.n = apiResult.n;
                metricRecord.contrib = apiResult.contrib;
                metricRecord.metadata = {
                    base_avg: avgSpend,
                    total_spend: totalSpend,
                    day_spend: totalDays,
                    last_day_spend: latestDate,
                    mechanismFeedback: apiResult.mechanismFeedback,
                    reason: apiResult.reason
                };
                await MetricsRepo.save(metricRecord);

                logger.info("Updated avg spend metric", {
                    userId,
                    avgSpend,
                    totalDays,
                    lastDaySpend: latestDate
                });
            } else {
                metricRecord = MetricsRepo.create({
                    userId: userId,
                    type: "avg_daily_spend",
                    vt: apiResult.vt,
                    bt: apiResult.bt,
                    r: apiResult.r,
                    n: apiResult.n,
                    contrib: apiResult.contrib,
                    metadata: {
                        base_avg: avgSpend,
                        total_spend: totalSpend,
                        day_spend: totalDays,
                        last_day_spend: latestDate,
                        mechanismFeedback: apiResult.mechanismFeedback,
                        reason: apiResult.reason
                    }
                });
                await MetricsRepo.save(metricRecord);

                logger.info("Created avg spend metric", {
                    userId,
                    avgSpend,
                    totalDays,
                    lastDaySpend: latestDate
                });
            }

            // Save feedback to behavior_feedbacks table
            if (apiResult.mechanismFeedback) {
                const behaviorFeedback = BehaviorFeedbackRepo.create({
                    userId: userId,
                    metric: "avg_daily_spend",
                    vt: apiResult.vt,
                    bt: apiResult.bt,
                    r: apiResult.r,
                    n: apiResult.n,
                    contrib: apiResult.contrib,
                    mechanismFeedback: apiResult.mechanismFeedback,
                    reason: apiResult.reason,
                    oceanScore: apiResult.new_ocean_score
                });

                await BehaviorFeedbackRepo.save(behaviorFeedback);
                logger.info("Behavior feedback saved", { userId, feedbackId: behaviorFeedback.id });
            }

            // Return the proper format matching other metrics
            return res.status(200).json({
                metric: apiResult.metric,
                vt: apiResult.vt,
                bt: apiResult.bt,
                r: apiResult.r,
                n: apiResult.n,
                contrib: apiResult.contrib,
                new_ocean_score: apiResult.new_ocean_score,
                mechanismFeedback: apiResult.mechanismFeedback || null,
                reason: apiResult.reason || null
            });

        } catch (e) {
            if (axios.isAxiosError(e)) {
                logger.error("AI API call failed", e, {
                    userId: req.user?.userId,
                    response: e.response?.data
                });
                return res.status(e.response?.status || 500).json({
                    error: "Failed to process avg daily spend",
                    details: e.response?.data || e.message
                });
            }

            logger.error("Failed to update avg spend", e as Error, {
                userId: req.user?.userId
            });
            return res.status(500).json({
                error: "Failed to update avg spend",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };
}

export default new AverageDailySpendController();
