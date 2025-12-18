import { Request, Response, RequestHandler } from "express";
import AppDataSource from "../infrastructure/database";
import { Feedback } from "../entity/feedback";
import { BehaviorFeedback } from "../entity/behavior_feedback";
import { getLogger } from "../infrastructure/logger";
import axios from "axios";

interface VerifySurveyRequest {
    model: {
        id: string;
        ocean: string;
        behavior: string;
        age: string;
        location: string;
        gender: string;
        keywords: string;
    };
    user_id: string;
    survey_result: {
        O: number;
        C: number;
        E: number;
        A: number;
        N: number;
    };
}

interface VerifySurveyResponse {
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

class SurveyVerifyController {
    /**
     * Verify survey results against AI model
     * POST /api/survey/verify
     */
    public verifySurvey: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();

        try {
            const requestData: VerifySurveyRequest = req.body;

            // Validate request data
            if (!requestData.model || !requestData.user_id || !requestData.survey_result) {
                res.status(400).json({ message: "Missing required fields" });
                return;
            }

            logger.info("Verifying survey", {
                modelId: requestData.model.id,
                userId: requestData.user_id
            });

            // Call AI verify-survey API
            const response = await axios.post<VerifySurveyResponse>(
                'https://ai-greenmind.khoav4.com/verify-survey',
                requestData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            const verifyResult = response.data;

            const calculatedDeviation = Math.abs(verifyResult.expected - verifyResult.actual);
            const calculatedEngagement = 1 - calculatedDeviation;

            logger.info("Survey verified successfully", {
                modelId: verifyResult.model_id,
                match: verifyResult.match,
                deviation: calculatedDeviation,
                engagement: calculatedEngagement
            });

            // Save feedback to database
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
            logger.info("Feedback saved successfully", { feedbackId: feedback.id });

            // Return response với deviation và engagement đã tính toán
            res.status(200).json({
                ...verifyResult,
                deviation: calculatedDeviation,
                engagement: calculatedEngagement
            });
        } catch (error) {
            logger.error("Error verifying survey", error as Error);

            if (axios.isAxiosError(error)) {
                res.status(error.response?.status || 500).json({
                    message: "Survey verification failed",
                    error: error.response?.data || error.message
                });
            } else {
                res.status(500).json({ message: "Internal server error" });
            }
        }
    };

    /**
     * Get all feedbacks
     * GET /api/models/feedbacks
     */
    public getFeedbacks: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();

        try {
            const feedbackRepository = AppDataSource.getRepository(Feedback);
            const behaviorFeedbackRepository = AppDataSource.getRepository(BehaviorFeedback);

            const feedbacks = await feedbackRepository.find({
                relations: ['model'],
                order: { createdAt: 'DESC' }
            });

            logger.info("Feedbacks retrieved successfully", { count: feedbacks.length });

            // Cache behavior feedbacks theo modelId để tránh query nhiều lần
            const behaviorFeedbackCache = new Map<string, any[]>();

            // Format response với engagement được tính từ deviation
            const formattedFeedbacks = await Promise.all(feedbacks.map(async (feedback) => {
                // Tính engagement = 1 - |deviation|
                const engagement = 1 - Math.abs(Number(feedback.deviation));

                // Lấy behavior feedbacks từ cache hoặc query mới
                let mechanismFeedbacksByMetric: any[] = [];

                if (feedback.modelId) {
                    if (!behaviorFeedbackCache.has(feedback.modelId)) {
                        // Lấy tất cả behavior feedbacks của model này
                        const behaviorFeedbacks = await behaviorFeedbackRepository.find({
                            where: { modelId: feedback.modelId },
                            order: { createdAt: 'DESC' }
                        });

                        // Nhóm behavior feedbacks theo metricType
                        const groupedByMetric = new Map<string, any[]>();

                        behaviorFeedbacks.forEach(bf => {
                            if (!bf.mechanismFeedback) return;

                            if (!groupedByMetric.has(bf.metric)) {
                                groupedByMetric.set(bf.metric, []);
                            }

                            groupedByMetric.get(bf.metric)!.push({
                                id: bf.id,
                                awareness: bf.mechanismFeedback.awareness,
                                motivation: bf.mechanismFeedback.motivation,
                                capability: bf.mechanismFeedback.capability,
                                opportunity: bf.mechanismFeedback.opportunity,
                                createdAt: bf.createdAt
                            });
                        });

                        // Chuyển đổi thành mảng [metricType, mechanismFeedbacks[]]
                        const result = Array.from(groupedByMetric.entries()).map(([metricType, mechanismFeedbacks]) => ({
                            metricType,
                            mechanismFeedbacks
                        }));

                        behaviorFeedbackCache.set(feedback.modelId, result);
                    }

                    mechanismFeedbacksByMetric = behaviorFeedbackCache.get(feedback.modelId) || [];
                }

                return {
                    id: feedback.id,
                    model_id: feedback.modelId,
                    user_id: feedback.user_id,
                    trait_checked: feedback.trait_checked,
                    expected: feedback.expected,
                    actual: feedback.actual,
                    deviation: feedback.deviation,
                    engagement: engagement,
                    match: feedback.match,
                    level: feedback.level,
                    feedback: feedback.feedback,
                    mechanismFeedbacks: mechanismFeedbacksByMetric,
                    createdAt: feedback.createdAt,
                    updatedAt: feedback.updatedAt,
                    model: feedback.model ? {
                        id: feedback.model.id,
                        ocean: feedback.model.ocean,
                        behavior: feedback.model.behavior,
                        age: feedback.model.age,
                        location: feedback.model.location,
                        gender: feedback.model.gender,
                        keywords: feedback.model.keywords
                    } : null
                };
            }));

            res.status(200).json(formattedFeedbacks);
        } catch (error) {
            logger.error("Error retrieving feedbacks", error as Error);
            res.status(500).json({ message: "Internal server error" });
        }
    };
}

export default new SurveyVerifyController();
