import {Request, Response} from 'express';
import {z} from 'zod';
import AppDataSource from '../infrastructure/database';
import {HealthyFoodRatio} from '../entity/healthy_food_ratio';
import {BigFive} from '../entity/big_five';
import {Metrics} from '../entity/metrics';
import {User} from '../entity/user';
import {logger} from '../infrastructure/logger';
import NUMBER from "../config/schemas/Number";
import axios from 'axios';

const HealthyFoodRatioSchema = z.object({
    plant_meals: NUMBER,
    total_meals: NUMBER,
});

const HealthyFoodRatioRepository = AppDataSource.getRepository(HealthyFoodRatio);
const BigFiveRepository = AppDataSource.getRepository(BigFive);
const MetricsRepository = AppDataSource.getRepository(Metrics);
const UserRepository = AppDataSource.getRepository(User);

class HealthyFoodRatioController {
    public async createHealthyFoodRatio(req: Request, res: Response) {
        const parsed = HealthyFoodRatioSchema.safeParse(req.body);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, {details: parsed.error});
            return res.status(400).json(parsed.error);
        }

        if (!req.user || !req.user.userId) {
            return res.status(401).json({message: "Unauthorized"});
        }

        const userId = req.user.userId;
        const {plant_meals, total_meals} = parsed.data;

        try {
            // Check if user exists
            const existedUser = await UserRepository.findOne({
                where: {id: userId}
            });

            if (!existedUser) {
                return res.status(404).json({message: 'User not found'});
            }

            // Get OCEAN scores from big_five table
            const bigFive = await BigFiveRepository.findOne({
                where: {user: {id: userId}}
            });

            if (!bigFive) {
                return res.status(404).json({message: 'Big Five scores not found for this user'});
            }

            // Create or update healthy food ratio record
            let healthyFoodRatio = await HealthyFoodRatioRepository.findOne({
                where: {userId: userId}
            });

            if (!healthyFoodRatio) {
                healthyFoodRatio = HealthyFoodRatioRepository.create({
                    userId: userId,
                    plantMeals: plant_meals,
                    totalMeals: total_meals,
                    baseLikert: 4,
                    weight: 0.25,
                    direction: "up",
                    sigmaR: 1.0,
                    alpha: 0.5,
                    user: existedUser
                });
            } else {
                healthyFoodRatio.plantMeals = plant_meals;
                healthyFoodRatio.totalMeals = total_meals;
            }

            await HealthyFoodRatioRepository.save(healthyFoodRatio);

            // Prepare request for AI API
            const aiRequest = {
                plant_meals: plant_meals,
                total_meals: total_meals,
                base_likert: healthyFoodRatio.baseLikert,
                weight: healthyFoodRatio.weight,
                direction: healthyFoodRatio.direction,
                sigma_r: healthyFoodRatio.sigmaR,
                alpha: healthyFoodRatio.alpha,
                ocean_score: {
                    O: bigFive.openness,
                    C: bigFive.conscientiousness,
                    E: bigFive.extraversion,
                    A: bigFive.agreeableness,
                    N: bigFive.neuroticism
                }
            };

            logger.info("Sending request to AI API", {userId, aiRequest});

            // Send request to AI API
            const aiResponse = await axios.post(
                'https://ai-greenmind.khoav4.com/healthy_food_ratio',
                aiRequest,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    timeout: 10000
                }
            );

            const aiData = aiResponse.data;

            logger.info("Received response from AI API", {userId, aiData});

            // Update big_five table with new OCEAN scores
            if (aiData.new_ocean_score) {
                bigFive.openness = aiData.new_ocean_score.O;
                bigFive.conscientiousness = aiData.new_ocean_score.C;
                bigFive.extraversion = aiData.new_ocean_score.E;
                bigFive.agreeableness = aiData.new_ocean_score.A;
                bigFive.neuroticism = aiData.new_ocean_score.N;
                await BigFiveRepository.save(bigFive);
            }

            // Create or update metrics record
            const metric = MetricsRepository.create({
                userId: userId,
                metric: aiData.metric || "healthy_food_ratio",
                vt: aiData.vt,
                bt: aiData.bt,
                r: aiData.r,
                n: aiData.n,
                contrib: aiData.contrib,
                user: existedUser
            });

            await MetricsRepository.save(metric);

            logger.info("Updated big_five and metrics tables", {userId});

            // Return response to client
            return res.status(200).json({
                metric: aiData.metric,
                vt: aiData.vt,
                bt: aiData.bt,
                r: aiData.r,
                n: aiData.n,
                contrib: aiData.contrib,
                new_ocean_score: aiData.new_ocean_score
            });

        } catch (e: any) {
            if (axios.isAxiosError(e)) {
                logger.error('Error calling AI API', e as Error, {
                    status: e.response?.status,
                    data: e.response?.data
                });
                return res.status(502).json({
                    message: "Error communicating with AI service",
                    details: e.response?.data
                });
            }
            logger.error('Error processing healthy food ratio', e as Error);
            return res.status(500).json({message: "Internal server error"});
        }
    }

    // Get healthy food ratio for current user
    public async getHealthyFoodRatio(req: Request, res: Response) {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({message: "Unauthorized"});
        }

        const userId = req.user.userId;

        try {
            const healthyFoodRatio = await HealthyFoodRatioRepository.findOne({
                where: {userId: userId}
            });

            if (!healthyFoodRatio) {
                return res.status(404).json({message: 'Healthy food ratio not found for this user'});
            }

            return res.status(200).json({
                message: "Healthy food ratio retrieved successfully",
                data: healthyFoodRatio
            });
        } catch (e) {
            logger.error('Error fetching healthy food ratio', e as Error);
            return res.status(500).json({message: "Internal server error"});
        }
    }

    // Get all metrics for current user
    public async getMetrics(req: Request, res: Response) {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({message: "Unauthorized"});
        }

        const userId = req.user.userId;

        try {
            const metrics = await MetricsRepository.find({
                where: {userId: userId},
                order: {createdAt: "DESC"}
            });

            return res.status(200).json({
                message: "Metrics retrieved successfully",
                data: metrics,
                count: metrics.length
            });
        } catch (e) {
            logger.error('Error fetching metrics', e as Error);
            return res.status(500).json({message: "Internal server error"});
        }
    }

    // Get latest metric for current user
    public async getLatestMetric(req: Request, res: Response) {
        if (!req.user || !req.user.userId) {
            return res.status(401).json({message: "Unauthorized"});
        }

        const userId = req.user.userId;

        try {
            const metric = await MetricsRepository.findOne({
                where: {userId: userId},
                order: {createdAt: "DESC"}
            });

            if (!metric) {
                return res.status(404).json({message: 'No metrics found for this user'});
            }

            return res.status(200).json({
                message: "Latest metric retrieved successfully",
                data: metric
            });
        } catch (e) {
            logger.error('Error fetching latest metric', e as Error);
            return res.status(500).json({message: "Internal server error"});
        }
    }
}

export default new HealthyFoodRatioController();

