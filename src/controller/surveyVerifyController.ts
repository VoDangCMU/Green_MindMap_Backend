import { Request, Response, RequestHandler } from "express";
import AppDataSource from "../infrastructure/database";
import { Feedback } from "../entity/feedback";
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
                    },
                    timeout: 30000
                }
            );

            const verifyResult = response.data;
            logger.info("Survey verified successfully", {
                modelId: verifyResult.model_id,
                match: verifyResult.match
            });

            // Save feedback to database
            const feedbackRepository = AppDataSource.getRepository(Feedback);
            const feedback = feedbackRepository.create({
                modelId: verifyResult.model_id,
                user_id: verifyResult.user_id,
                trait_checked: verifyResult.trait_checked,
                expected: verifyResult.expected,
                actual: verifyResult.actual,
                deviation: verifyResult.deviation,
                match: verifyResult.match,
                level: verifyResult.level,
                feedback: verifyResult.feedback
            });

            await feedbackRepository.save(feedback);
            logger.info("Feedback saved successfully", { feedbackId: feedback.id });

            // Return the same format as API response
            res.status(200).json(verifyResult);
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
     * GET /api/questions/feedbacks
     */
    public getFeedbacks: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();

        try {
            const feedbackRepository = AppDataSource.getRepository(Feedback);
            const feedbacks = await feedbackRepository.find({
                relations: ['model'],
                order: { createdAt: 'DESC' }
            });

            logger.info("Feedbacks retrieved successfully", { count: feedbacks.length });

            // Format response
            const formattedFeedbacks = feedbacks.map(feedback => ({
                id: feedback.id,
                model_id: feedback.modelId,
                user_id: feedback.user_id,
                trait_checked: feedback.trait_checked,
                expected: feedback.expected,
                actual: feedback.actual,
                deviation: feedback.deviation,
                match: feedback.match,
                level: feedback.level,
                feedback: feedback.feedback,
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
            }));

            res.status(200).json(formattedFeedbacks);
        } catch (error) {
            logger.error("Error retrieving feedbacks", error as Error);
            res.status(500).json({ message: "Internal server error" });
        }
    };
}

export default new SurveyVerifyController();
