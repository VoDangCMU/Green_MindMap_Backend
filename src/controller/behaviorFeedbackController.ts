import { Request, Response } from "express";
import AppDataSource from "../infrastructure/database";
import { BehaviorFeedback } from "../entity/behavior_feedback";
import { logger } from "../infrastructure";

const BehaviorFeedbackRepository = AppDataSource.getRepository(BehaviorFeedback);

class BehaviorFeedbackController {
    public getAllBehaviorFeedback = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                logger.warn("Unauthorized access to getAllBehaviorFeedback");
                return res.status(401).json({ error: "Unauthorized" });
            }

            logger.info("getAllBehaviorFeedback called", { userId });

            // Get all behavior feedbacks for this user
            const feedbacks = await BehaviorFeedbackRepository.find({
                where: {
                    userId: userId
                },
                order: {
                    createdAt: "DESC"
                }
            });

            logger.info("Successfully retrieved behavior feedbacks", {
                userId,
                count: feedbacks.length
            });

            return res.status(200).json({
                success: true,
                message: "Behavior feedbacks retrieved successfully",
                data: feedbacks,
                count: feedbacks.length
            });

        } catch (e) {
            logger.error("Failed to get behavior feedbacks", e as Error, {
                userId: req.user?.userId
            });
            return res.status(500).json({
                success: false,
                error: "Failed to get behavior feedbacks",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };
}

export default new BehaviorFeedbackController();

