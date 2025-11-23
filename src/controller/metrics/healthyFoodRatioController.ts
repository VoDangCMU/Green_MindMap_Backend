import {Request, Response} from 'express';
import {z} from 'zod';
import AppDataSource from '../../infrastructure/database';
import {BigFive} from '../../entity/big_five';
import {Metrics} from '../../entity/metrics';
import {User} from '../../entity/user';
import {logger} from '../../infrastructure';
import axios from 'axios';
import FormData from 'form-data';

const BigFiveRepository = AppDataSource.getRepository(BigFive);
const MetricsRepository = AppDataSource.getRepository(Metrics);
const UserRepository = AppDataSource.getRepository(User);

const API_URL = "https://ai-greenmind.khoav4.com/healthy_food_ratio";
const IMAGE_ANALYSIS_URL = "https://ai-greenmind.khoav4.com/analyze-image-plant";

const DEFAULTS = {
    base_likert: 4,
    weight: 0.25,
    direction: "up",
    sigma_r: 1.0,
    alpha: 0.5
};

const AnalyzeImageResponseSchema = z.object({
    vegetable_area: z.number(),
    dish_area: z.number(),
    vegetable_ratio_percent: z.number(),
    plant_image_base64: z.string()
});

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

class HealthyFoodRatioController {
    public getHealthyFoodRatio = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                logger.warn("Unauthorized access to getHealthyFoodRatio");
                return res.status(401).json({ error: "Unauthorized" });
            }

            logger.info("getHealthyFoodRatio called", { userId });

            // Tìm metric healthy_food_ratio của user
            const metricRecord = await MetricsRepository.findOne({
                where: {
                    userId: userId,
                    type: "healthy_food_ratio"
                }
            });

            if (!metricRecord) {
                logger.warn("No healthy_food_ratio metric found for user", { userId });
                return res.status(404).json({
                    error: "No healthy_food_ratio metric found for this user"
                });
            }

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
                metric: "healthy_food_ratio",
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

            logger.info("Successfully retrieved healthy_food_ratio metric", {
                userId,
                metric: response
            });

            return res.status(200).json(response);

        } catch (e) {
            logger.error("Failed to get healthy_food_ratio metric", e as Error, {
                userId: req.user?.userId
            });
            return res.status(500).json({
                error: "Failed to get healthy_food_ratio metric",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };

    public createOrUpdateHealthyFoodRatio = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                logger.warn("Unauthorized access to createOrUpdateHealthyFoodRatio");
                return res.status(401).json({ error: "Unauthorized" });
            }

            logger.info("createOrUpdateHealthyFoodRatio called", {
                userId,
                hasFile: !!req.file
            });

            // Kiểm tra file ảnh
            if (!req.file) {
                logger.warn("No image file provided");
                return res.status(400).json({
                    error: "No image file provided"
                });
            }

            // Tạo FormData để gửi ảnh đến API phân tích
            const formData = new FormData();
            formData.append('file', req.file.buffer, {
                filename: req.file.originalname,
                contentType: req.file.mimetype
            });

            logger.info("Calling image analysis API", {
                userId,
                filename: req.file.originalname,
                size: req.file.size
            });

            // Gọi API phân tích ảnh
            const imageAnalysisResponse = await axios.post(IMAGE_ANALYSIS_URL, formData, {
                headers: {
                    ...formData.getHeaders()
                }
            });

            if (imageAnalysisResponse.status !== 200) {
                logger.error("Image analysis API call failed", undefined, {
                    userId,
                    status: imageAnalysisResponse.status,
                    data: imageAnalysisResponse.data
                });
                return res.status(500).json({
                    error: "Image analysis failed",
                    details: imageAnalysisResponse.data
                });
            }

            const imageAnalysisResult = AnalyzeImageResponseSchema.safeParse(imageAnalysisResponse.data);

            if (!imageAnalysisResult.success) {
                logger.error("Invalid image analysis response", undefined, {
                    userId,
                    errors: imageAnalysisResult.error.errors
                });
                return res.status(500).json({
                    error: "Invalid response from image analysis API",
                    details: imageAnalysisResult.error.errors
                });
            }

            const { vegetable_ratio_percent } = imageAnalysisResult.data;

            logger.info("Image analysis completed", {
                userId,
                vegetable_ratio_percent
            });

            // Tìm hoặc tạo metric record
            let metricRecord = await MetricsRepository.findOne({
                where: {
                    userId: userId,
                    type: "healthy_food_ratio"
                }
            });

            let plantMeals = 0;
            let totalMeals = 0;

            if (metricRecord && metricRecord.metadata) {
                // Đã có metric, cập nhật
                plantMeals = metricRecord.metadata.plant_meals || 0;
                totalMeals = metricRecord.metadata.total_meals || 0;
            }

            // Cập nhật số liệu dựa trên vegetable_ratio_percent
            if (vegetable_ratio_percent >= 0.5) {
                plantMeals += 1;
                logger.info("Vegetable ratio >= 0.5, incrementing plant_meals", {
                    userId,
                    vegetable_ratio_percent,
                    plantMeals
                });
            }
            totalMeals += 1;

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

            // Gọi API external để tính metrics
            const apiPayload = {
                plant_meals: plantMeals,
                total_meals: totalMeals,
                base_likert: DEFAULTS.base_likert,
                weight: DEFAULTS.weight,
                direction: DEFAULTS.direction,
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

            logger.info("Calling healthy food ratio metrics API", {
                userId,
                payload: apiPayload
            });

            const response = await axios.post(API_URL, apiPayload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.status !== 200) {
                logger.error("Metrics API call failed", undefined, {
                    userId,
                    status: response.status,
                    data: response.data
                });
                return res.status(500).json({
                    error: "Metrics calculation failed",
                    details: response.data
                });
            }

            const apiResult = AnalyzeResponseSchema.safeParse(response.data);

            if (!apiResult.success) {
                logger.error("Invalid metrics API response", undefined, {
                    userId,
                    errors: apiResult.error.errors
                });
                return res.status(500).json({
                    error: "Invalid response from metrics API",
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
                    plant_meals: plantMeals,
                    total_meals: totalMeals
                };
                await MetricsRepository.save(metricRecord);

                logger.info("Updated healthy food ratio metric", {
                    userId,
                    plantMeals,
                    totalMeals,
                    vegetable_ratio_percent
                });
            } else {
                metricRecord = MetricsRepository.create({
                    userId: userId,
                    type: "healthy_food_ratio",
                    vt: result.vt,
                    bt: result.bt,
                    r: result.r,
                    n: result.n,
                    contrib: result.contrib,
                    metadata: {
                        plant_meals: plantMeals,
                        total_meals: totalMeals
                    }
                });
                await MetricsRepository.save(metricRecord);

                logger.info("Created healthy food ratio metric", {
                    userId,
                    plantMeals,
                    totalMeals,
                    vegetable_ratio_percent
                });
            }

            return res.status(200).json({
                metric: "healthy_food_ratio",
                vt: result.vt,
                bt: result.bt,
                r: result.r,
                n: result.n,
                contrib: result.contrib,
                new_ocean_score: result.new_ocean_score
            });

        } catch (e) {
            logger.error("Failed to create or update healthy food ratio", e as Error, {
                userId: req.user?.userId
            });
            return res.status(500).json({
                error: "Failed to create or update healthy food ratio",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };
}

export default new HealthyFoodRatioController();
