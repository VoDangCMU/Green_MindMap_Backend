import { Request, Response } from 'express';
import { z } from 'zod';
import AppDataSource from '../../infrastructure/database';
import { BigFive } from '../../entity/big_five';
import { Metrics } from '../../entity/metrics';
import { User } from '../../entity/user';
import { AvgDailySpend } from '../../entity/daily_spend';
import { logger } from '../../infrastructure';
import axios from 'axios';

const BigFiveRepository = AppDataSource.getRepository(BigFive);
const MetricsRepository = AppDataSource.getRepository(Metrics);
const UserRepository = AppDataSource.getRepository(User);
const DailySpendRepository = AppDataSource.getRepository(AvgDailySpend);

const API_URL = "https://ai-greenmind.khoav4.com/spend_variability";

const DEFAULTS = {
    base_likert: 3,
    weight: 0.2,
    sigma_r: 1.0,
    alpha: 0.5
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
    })
});

class SpendVariabilityController {
    public getSpendVariability = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                logger.warn("Unauthorized access to getSpendVariability");
                return res.status(401).json({ error: "Unauthorized" });
            }

            logger.info("getSpendVariability called", { userId });

            // Lấy ngày hiện tại
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayString = today.toISOString().split('T')[0];

            // Tìm metric spend_variability của user
            let metricRecord = await MetricsRepository.findOne({
                where: {
                    userId: userId,
                    type: "spend_variability"
                }
            });

            // Kiểm tra nếu đã có metric và last_day là hôm nay
            if (metricRecord && metricRecord.metadata && metricRecord.metadata.last_day === todayString) {
                logger.info("Spend variability is up to date, returning existing metric", {
                    userId,
                    last_day: todayString
                });

                // Lấy big_five hiện tại của user
                const user = await UserRepository.findOne({
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
                    metric: "spend_variability",
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
                    }
                };

                return res.status(200).json(response);
            }

            // Nếu chưa có hoặc cần cập nhật
            logger.info("Updating spend variability", { userId });

            // Lấy 7 ngày gần nhất của daily_spend
            const dailySpendRecords = await DailySpendRepository.find({
                where: {
                    user: { id: userId }
                },
                order: {
                    day_spend: "DESC"
                },
                take: 7
            });

            if (dailySpendRecords.length === 0) {
                logger.warn("No daily spend records found for user", { userId });
                return res.status(404).json({
                    error: "No daily spend records found for this user"
                });
            }

            // Lấy total_spend của 7 ngày (đảo ngược để có thứ tự từ cũ đến mới)
            const dailySpendArray = dailySpendRecords.reverse().map(record => record.total_spend);

            // Xác định direction: so sánh ngày đầu và ngày cuối
            const direction = dailySpendArray[0] < dailySpendArray[dailySpendArray.length - 1] ? "up" : "down";

            logger.info("Daily spend array prepared", {
                userId,
                dailySpendArray,
                direction
            });

            // Lấy big_five của user
            const user = await UserRepository.findOne({
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

            // Gọi API external
            const apiPayload = {
                daily_spend: dailySpendArray,
                base_likert: DEFAULTS.base_likert,
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

            logger.info("Calling spend variability API", {
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
                return res.status(500).json({
                    error: "Spend variability calculation failed",
                    details: response.data
                });
            }

            const apiResult = AnalyzeResponseSchema.safeParse(response.data);

            if (!apiResult.success) {
                logger.error("Invalid API response", undefined, {
                    userId,
                    errors: apiResult.error.errors
                });
                return res.status(500).json({
                    error: "Invalid response from API",
                    details: apiResult.error.errors
                });
            }

            const result = apiResult.data;

            // Cập nhật Big Five
            const newBigFive = new BigFive();
            newBigFive.openness = result.new_ocean_score.O;
            newBigFive.conscientiousness = result.new_ocean_score.C;
            newBigFive.extraversion = result.new_ocean_score.E;
            newBigFive.agreeableness = result.new_ocean_score.A;
            newBigFive.neuroticism = result.new_ocean_score.N;
            await BigFiveRepository.save(newBigFive);

            // Cập nhật user với big five mới
            user.bigFive = newBigFive;
            await UserRepository.save(user);

            // Cập nhật hoặc tạo metric
            if (metricRecord) {
                metricRecord.vt = result.vt;
                metricRecord.bt = result.bt;
                metricRecord.r = result.r;
                metricRecord.n = result.n;
                metricRecord.contrib = result.contrib;
                metricRecord.metadata = {
                    daily_spend: dailySpendArray,
                    last_day: todayString
                };
                await MetricsRepository.save(metricRecord);

                logger.info("Updated spend variability metric", {
                    userId,
                    last_day: todayString
                });
            } else {
                metricRecord = MetricsRepository.create({
                    userId: userId,
                    type: "spend_variability",
                    vt: result.vt,
                    bt: result.bt,
                    r: result.r,
                    n: result.n,
                    contrib: result.contrib,
                    metadata: {
                        daily_spend: dailySpendArray,
                        last_day: todayString
                    }
                });
                await MetricsRepository.save(metricRecord);

                logger.info("Created spend variability metric", {
                    userId,
                    last_day: todayString
                });
            }

            // Trả về response
            const finalResponse = {
                metric: "spend_variability",
                vt: result.vt,
                bt: result.bt,
                r: result.r,
                n: result.n,
                contrib: result.contrib,
                new_ocean_score: result.new_ocean_score
            };

            logger.info("Successfully retrieved spend variability metric", {
                userId,
                metric: finalResponse
            });

            return res.status(200).json(finalResponse);

        } catch (e) {
            logger.error("Failed to get spend variability", e as Error, {
                userId: req.user?.userId
            });
            return res.status(500).json({
                error: "Failed to get spend variability",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };
}

export default new SpendVariabilityController();
