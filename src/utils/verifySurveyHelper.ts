import axios from "axios";
import AppDataSource from "../infrastructure/database";
import { Feedback } from "../entity/feedback";
import { Models } from "../entity/models";
import { logger } from "../infrastructure";

const VERIFY_SURVEY_API_URL = "https://ai-greenmind.khoav4.com/verify-survey";

interface OceanScore {
    O: number;
    C: number;
    E: number;
    A: number;
    N: number;
}

interface VerifySurveyResult {
    model_id: string;
    user_id: string;
    trait_checked: string;
    expected: number;
    actual: number;
    deviation: number;
    engagement: number;
    match: boolean;
    level: string;
    feedback: string[];
}

/**
 * Gọi API verify-survey với OCEAN score mới và lưu feedback vào database
 * @param userId - ID của user
 * @param oceanScore - OCEAN score mới sau khi cập nhật từ metric
 * @param metricName - Tên metric đang gọi (để logging)
 * @returns VerifySurveyResult hoặc null nếu có lỗi
 */
export async function verifySurveyAndSaveFeedback(
    userId: string,
    oceanScore: OceanScore,
    metricName: string
): Promise<VerifySurveyResult | null> {
    try {
        // Lấy model mới nhất để verify
        const ModelsRepository = AppDataSource.getRepository(Models);
        const latestModels = await ModelsRepository.find({
            order: { createdAt: 'DESC' },
            take: 1
        });

        if (latestModels.length === 0) {
            logger.warn("No model found for verify survey", { userId, metricName });
            return null;
        }

        const latestModel = latestModels[0];

        // Chuẩn bị request data cho verify-survey API
        const verifyRequest = {
            model: {
                id: latestModel.id,
                ocean: latestModel.ocean,
                behavior: latestModel.behavior,
                age: latestModel.age,
                location: latestModel.location,
                gender: latestModel.gender,
                keywords: latestModel.keywords
            },
            user_id: userId,
            survey_result: oceanScore
        };

        logger.info("Calling verify-survey API after metric update", {
            userId,
            metricName,
            modelId: latestModel.id,
            oceanScore
        });

        // Gọi API verify-survey
        const response = await axios.post(
            VERIFY_SURVEY_API_URL,
            verifyRequest,
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }
        );

        const verifyResult = response.data;

        // Tính toán deviation và engagement theo công thức mới
        // deviation = |expected - actual|
        // engagement = 1 - deviation
        const calculatedDeviation = Math.abs(verifyResult.expected - verifyResult.actual);
        const calculatedEngagement = 1 - calculatedDeviation;

        logger.info("Verify survey completed", {
            userId,
            metricName,
            modelId: verifyResult.model_id,
            deviation: calculatedDeviation,
            engagement: calculatedEngagement,
            match: verifyResult.match
        });

        // Lưu feedback vào database
        const feedbackRepository = AppDataSource.getRepository(Feedback);
        const feedback = feedbackRepository.create({
            modelId: verifyResult.model_id,
            user_id: verifyResult.user_id,
            trait_checked: verifyResult.trait_checked,
            expected: verifyResult.expected,
            actual: verifyResult.actual,
            deviation: calculatedDeviation,
            match: verifyResult.match,
            level: verifyResult.level,
            feedback: verifyResult.feedback
        });

        await feedbackRepository.save(feedback);
        logger.info("Feedback saved after metric update", {
            userId,
            metricName,
            feedbackId: feedback.id
        });

        // Return kết quả với deviation và engagement đã tính
        return {
            ...verifyResult,
            deviation: calculatedDeviation,
            engagement: calculatedEngagement
        };

    } catch (error) {
        logger.error("Error calling verify-survey after metric update", error as Error, {
            userId,
            metricName
        });
        return null;
    }
}

