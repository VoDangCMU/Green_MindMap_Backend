import { Request, Response } from 'express';
import { z } from 'zod';
import AppDataSource from '../../infrastructure/database';
import { BigFive } from '../../entity/big_five';
import { Metrics } from '../../entity/metrics';
import { User } from '../../entity/user';
import { BehaviorFeedback } from '../../entity/behavior_feedback';
import { logger } from '../../infrastructure';
import axios from 'axios';

const BigFiveRepository = AppDataSource.getRepository(BigFive);
const MetricsRepository = AppDataSource.getRepository(Metrics);
const UserRepository = AppDataSource.getRepository(User);
const BehaviorFeedbackRepository = AppDataSource.getRepository(BehaviorFeedback);

const API_URL = "https://ai-greenmind.khoav4.com/daily_distance_km";

const DailyDistanceKmRequestSchema = z.object({
    distance_today: z.number(),
    base_avg_distance: z.number(),
    weight: z.number(),
    direction: z.string(),
    sigma_r: z.number(),
    alpha: z.number(),
    ocean_score: z.object({
        O: z.number(),
        C: z.number(),
        E: z.number(),
        A: z.number(),
        N: z.number(),
    })
});

const DailyDistanceKmResponseSchema = z.object({
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
    }),
    reason: z.string()
});

class DailyDistanceKmController {
    public getDailyDistanceKm = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                logger.warn("Unauthorized access to getDailyDistanceKm");
                return res.status(401).json({ error: "Unauthorized" });
            }

            logger.info("getDailyDistanceKm called", { userId });

            // Get metric record for daily_distance_km
            const metricRecord = await MetricsRepository.findOne({
                where: {
                    userId: userId,
                    type: "daily_distance_km"
                }
            });

            if (!metricRecord) {
                logger.warn("Daily distance km metric not found for user", { userId });
                return res.status(404).json({
                    error: "Daily distance km metric not found for this user"
                });
            }

            // Get user's current BigFive scores
            const user = await UserRepository.findOne({
                where: { id: userId },
                relations: { bigFive: true }
            });

            if (!user || !user.bigFive) {
                logger.warn("User or big five data not found", { userId });
                return res.status(404).json({
                    error: "User or big five data not found"
                });
            }

            // Construct response
            const response = {
                metric: "daily_distance_km",
                vt: metricRecord.vt,
                bt: metricRecord.bt,
                r: metricRecord.r,
                n: metricRecord.n,
                contrib: metricRecord.contrib,
                new_ocean_score: {
                    O: user.bigFive.openness,
                    C: user.bigFive.conscientiousness,
                    E: user.bigFive.extraversion,
                    A: user.bigFive.agreeableness,
                    N: user.bigFive.neuroticism
                },
                mechanismFeedback: metricRecord.metadata?.mechanismFeedback,
                reason: metricRecord.metadata?.reason
            };

            logger.info("Successfully retrieved daily distance km metric", {
                userId,
                metric: response
            });

            return res.status(200).json(response);

        } catch (e) {
            logger.error("Failed to get daily distance km", e as Error, {
                userId: req.user?.userId
            });
            return res.status(500).json({
                error: "Failed to get daily distance km",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };

    public updateDailyDistanceKm = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                logger.warn("Unauthorized access to updateDailyDistanceKm");
                return res.status(401).json({ error: "Unauthorized" });
            }

            logger.info("updateDailyDistanceKm called", {
                userId,
                body: req.body
            });

            // Validate request body
            const parsed = DailyDistanceKmRequestSchema.safeParse(req.body);
            if (!parsed.success) {
                logger.warn("Invalid request parameters", {
                    errors: parsed.error.errors
                });
                return res.status(400).json({
                    error: "Invalid parameters",
                    details: parsed.error.errors
                });
            }

            const requestData = parsed.data;

            // Call external API with the exact request format
            logger.info("Calling daily distance km API", {
                userId,
                payload: requestData
            });

            const apiResponse = await axios.post(API_URL, requestData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (apiResponse.status !== 200) {
                logger.error("API call failed", undefined, {
                    userId,
                    status: apiResponse.status,
                    data: apiResponse.data
                });
                return res.status(apiResponse.status).json({
                    error: "Daily distance km calculation failed",
                    details: apiResponse.data
                });
            }

            const apiResult = DailyDistanceKmResponseSchema.safeParse(apiResponse.data);

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

            // Update BigFive with new ocean scores
            const user = await UserRepository.findOne({
                where: { id: userId },
                relations: { bigFive: true }
            });

            if (!user) {
                logger.warn("User not found", { userId });
                return res.status(404).json({ error: "User not found" });
            }

            // Update or create BigFive
            let bigFive = user.bigFive;
            if (!bigFive) {
                bigFive = new BigFive();
                bigFive.user = user;
            }

            bigFive.openness = result.new_ocean_score.O;
            bigFive.conscientiousness = result.new_ocean_score.C;
            bigFive.extraversion = result.new_ocean_score.E;
            bigFive.agreeableness = result.new_ocean_score.A;
            bigFive.neuroticism = result.new_ocean_score.N;

            await BigFiveRepository.save(bigFive);

            logger.info("BigFive updated", {
                userId,
                newScores: result.new_ocean_score
            });

            // Update or create Metrics record
            let metricRecord = await MetricsRepository.findOne({
                where: {
                    userId: userId,
                    type: "daily_distance_km"
                }
            });

            if (metricRecord) {
                metricRecord.vt = result.vt;
                metricRecord.bt = result.bt;
                metricRecord.r = result.r;
                metricRecord.n = result.n;
                metricRecord.contrib = result.contrib;
                metricRecord.metadata = {
                    distance_today: requestData.distance_today,
                    base_avg_distance: requestData.base_avg_distance,
                    direction: requestData.direction,
                    mechanismFeedback: result.mechanismFeedback,
                    reason: result.reason
                };
            } else {
                metricRecord = MetricsRepository.create({
                    userId: userId,
                    type: "daily_distance_km",
                    vt: result.vt,
                    bt: result.bt,
                    r: result.r,
                    n: result.n,
                    contrib: result.contrib,
                    metadata: {
                        distance_today: requestData.distance_today,
                        base_avg_distance: requestData.base_avg_distance,
                        direction: requestData.direction,
                        mechanismFeedback: result.mechanismFeedback,
                        reason: result.reason
                    }
                });
            }

            await MetricsRepository.save(metricRecord);

            logger.info("Metrics updated", {
                userId,
                type: "daily_distance_km"
            });

            // Save feedback to behavior_feedbacks table
            if (result.mechanismFeedback) {
                const behaviorFeedback = BehaviorFeedbackRepository.create({
                    userId: userId,
                    metric: "daily_distance_km",
                    vt: result.vt,
                    bt: result.bt,
                    r: result.r,
                    n: result.n,
                    contrib: result.contrib,
                    mechanismFeedback: result.mechanismFeedback,
                    reason: result.reason,
                    oceanScore: result.new_ocean_score
                });

                await BehaviorFeedbackRepository.save(behaviorFeedback);
                logger.info("Behavior feedback saved", { userId, feedbackId: behaviorFeedback.id });
            }

            // Return the exact format as received from API
            return res.status(200).json(result);

        } catch (e) {
            if (axios.isAxiosError(e)) {
                logger.error("API call failed", e, {
                    userId: req.user?.userId,
                    response: e.response?.data
                });
                return res.status(e.response?.status || 500).json({
                    error: "Failed to calculate daily distance km",
                    details: e.response?.data || e.message
                });
            }

            logger.error("Failed to update daily distance km", e as Error, {
                userId: req.user?.userId
            });
            return res.status(500).json({
                error: "Failed to update daily distance km",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };
}

export default new DailyDistanceKmController();
