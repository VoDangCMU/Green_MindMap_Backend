import { Request, Response } from "express";
import AppDataSource from "../infrastructure/database";
import { BehaviorFeedback } from "../entity/behavior_feedback";
import { User } from "../entity/user";
import { logger } from "../infrastructure";

const BehaviorFeedbackRepository = AppDataSource.getRepository(BehaviorFeedback);
const UserRepository = AppDataSource.getRepository(User);

class BehaviorFeedbackController {
    public getAllBehaviorFeedback = async (req: Request, res: Response) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                logger.warn("Unauthorized access to getAllBehaviorFeedback");
                return res.status(401).json({ error: "Unauthorized" });
            }

            logger.info("getAllBehaviorFeedback called", { userId });

            // Get all behavior feedbacks (not filtered by user)
            const feedbacks = await BehaviorFeedbackRepository.find({
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

    /**
     * Get mechanism feedbacks by userId
     * GET /api/behavior-feedbacks/user/:userId
     */
    public getMechanismFeedbacksByUser = async (req: Request, res: Response) => {
        try {
            const { userId } = req.params;

            if (!userId) {
                logger.warn("Missing userId parameter");
                return res.status(400).json({ error: "userId is required" });
            }

            logger.info("getMechanismFeedbacksByUser called", { userId });

            // Lấy thông tin user
            const user = await UserRepository.findOne({
                where: { id: userId }
            });

            const feedbacks = await BehaviorFeedbackRepository.find({
                where: { userId },
                order: { createdAt: "DESC" }
            });

            // Trích xuất chỉ mechanismFeedback từ các behavior feedbacks
            const mechanismFeedbacks = feedbacks
                .filter(bf => bf.mechanismFeedback)
                .map(bf => ({
                    id: bf.id,
                    metric: bf.metric,
                    mechanismFeedback: bf.mechanismFeedback,
                    createdAt: bf.createdAt
                }));

            // Tính tuổi từ dateOfBirth
            let age = null;
            if (user?.dateOfBirth) {
                const today = new Date();
                const birthDate = new Date(user.dateOfBirth);
                age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
            }

            logger.info("Successfully retrieved mechanism feedbacks for user", {
                userId,
                count: mechanismFeedbacks.length
            });

            return res.status(200).json({
                success: true,
                message: "Mechanism feedbacks retrieved successfully",
                user: user ? {
                    id: user.id,
                    fullName: user.fullName,
                    location: user.location,
                    age: age,
                    dateOfBirth: user.dateOfBirth,
                    gender: user.gender
                } : null,
                data: mechanismFeedbacks,
                count: mechanismFeedbacks.length
            });

        } catch (e) {
            logger.error("Failed to get mechanism feedbacks", e as Error, {
                userId: req.params.userId
            });
            return res.status(500).json({
                success: false,
                error: "Failed to get mechanism feedbacks",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };

    /**
     * Get mechanism feedbacks by modelId
     * GET /api/behavior-feedbacks/model/:modelId
     */
    public getMechanismFeedbacksByModel = async (req: Request, res: Response) => {
        try {
            const { modelId } = req.params;

            if (!modelId) {
                logger.warn("Missing modelId parameter");
                return res.status(400).json({ error: "modelId is required" });
            }

            logger.info("getMechanismFeedbacksByModel called", { modelId });

            const feedbacks = await BehaviorFeedbackRepository.find({
                where: { modelId },
                relations: ['user'],
                order: { createdAt: "DESC" }
            });

            // Trích xuất mechanismFeedback kèm thông tin user
            const mechanismFeedbacks = feedbacks
                .filter(bf => bf.mechanismFeedback)
                .map(bf => {
                    // Tính tuổi từ dateOfBirth
                    let age = null;
                    if (bf.user?.dateOfBirth) {
                        const today = new Date();
                        const birthDate = new Date(bf.user.dateOfBirth);
                        age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                        }
                    }

                    return {
                        id: bf.id,
                        metric: bf.metric,
                        mechanismFeedback: bf.mechanismFeedback,
                        user: bf.user ? {
                            id: bf.user.id,
                            fullName: bf.user.fullName,
                            location: bf.user.location,
                            age: age,
                            dateOfBirth: bf.user.dateOfBirth,
                            gender: bf.user.gender
                        } : null,
                        createdAt: bf.createdAt
                    };
                });

            logger.info("Successfully retrieved mechanism feedbacks for model", {
                modelId,
                count: mechanismFeedbacks.length
            });

            return res.status(200).json({
                success: true,
                message: "Mechanism feedbacks retrieved successfully",
                data: mechanismFeedbacks,
                count: mechanismFeedbacks.length
            });

        } catch (e) {
            logger.error("Failed to get mechanism feedbacks by model", e as Error, {
                modelId: req.params.modelId
            });
            return res.status(500).json({
                success: false,
                error: "Failed to get mechanism feedbacks",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };

    /**
     * Get mechanism feedbacks grouped by all users
     * GET /api/behavior-feedbacks/users
     */
    public getMechanismFeedbacksAllUsers = async (req: Request, res: Response) => {
        try {
            logger.info("getMechanismFeedbacksAllUsers called");

            const feedbacks = await BehaviorFeedbackRepository.find({
                relations: ['user'],
                order: { createdAt: "DESC" }
            });

            // Nhóm feedbacks theo userId và metric
            const groupedByUserAndMetric = new Map<string, {
                user: any;
                metrics: Map<string, any[]>;
                latestCreatedAt: Date;
            }>();

            feedbacks.forEach(bf => {
                if (!bf.mechanismFeedback || !bf.userId) return;

                if (!groupedByUserAndMetric.has(bf.userId)) {
                    // Tính tuổi từ dateOfBirth
                    let age = null;
                    if (bf.user?.dateOfBirth) {
                        const today = new Date();
                        const birthDate = new Date(bf.user.dateOfBirth);
                        age = today.getFullYear() - birthDate.getFullYear();
                        const monthDiff = today.getMonth() - birthDate.getMonth();
                        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                            age--;
                        }
                    }

                    groupedByUserAndMetric.set(bf.userId, {
                        user: bf.user ? {
                            id: bf.user.id,
                            fullName: bf.user.fullName,
                            location: bf.user.location,
                            age: age,
                            dateOfBirth: bf.user.dateOfBirth,
                            gender: bf.user.gender
                        } : null,
                        metrics: new Map<string, any[]>(),
                        latestCreatedAt: bf.createdAt
                    });
                }

                const userGroup = groupedByUserAndMetric.get(bf.userId)!;

                // Cập nhật latestCreatedAt nếu feedback này mới hơn
                if (bf.createdAt > userGroup.latestCreatedAt) {
                    userGroup.latestCreatedAt = bf.createdAt;
                }

                // Nhóm theo metric
                if (!userGroup.metrics.has(bf.metric)) {
                    userGroup.metrics.set(bf.metric, []);
                }

                userGroup.metrics.get(bf.metric)!.push({
                    id: bf.id,
                    awareness: bf.mechanismFeedback.awareness,
                    motivation: bf.mechanismFeedback.motivation,
                    capability: bf.mechanismFeedback.capability,
                    opportunity: bf.mechanismFeedback.opportunity,
                    createdAt: bf.createdAt
                });
            });

            // Flatten thành mảng [user, metric_type, mechanismFeedbacks[]]
            const result: any[] = [];

            Array.from(groupedByUserAndMetric.values())
                .sort((a, b) => b.latestCreatedAt.getTime() - a.latestCreatedAt.getTime())
                .forEach(userGroup => {
                    userGroup.metrics.forEach((mechanismFeedbacks, metricType) => {
                        result.push({
                            user: userGroup.user,
                            metricType: metricType,
                            mechanismFeedbacks: mechanismFeedbacks
                        });
                    });
                });

            logger.info("Successfully retrieved mechanism feedbacks for all users", {
                count: result.length
            });

            return res.status(200).json({
                success: true,
                message: "Mechanism feedbacks retrieved successfully",
                data: result,
                count: result.length
            });

        } catch (e) {
            logger.error("Failed to get mechanism feedbacks for all users", e as Error);
            return res.status(500).json({
                success: false,
                error: "Failed to get mechanism feedbacks",
                details: e instanceof Error ? e.message : String(e),
            });
        }
    };
}

export default new BehaviorFeedbackController();
