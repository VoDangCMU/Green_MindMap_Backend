import { RequestHandler } from "express";
import { z } from "zod";
import { In } from "typeorm";
import NUMBER from "../config/schemas/Number";
import TEXT from "../config/schemas/Text";

import { SurveyScenario } from "../entity/survey_scenario";
import { Questions } from "../entity/questions";
import { User } from "../entity/user";
import AppDataSource from "../infrastructure/database";
import { logger } from "../infrastructure";

const SurveyScenarioParamsSchema = z.object({
    minAge: NUMBER,
    maxAge: NUMBER,
    location: z.string().optional(),
    gender: TEXT.optional(),
});

const QuestionIdsSchema = z.object({
    questionIds: z.array(z.string().uuid()).min(1, {
        message: "At least one question ID is required",
    }),
});

class SurveyScenarioController {
    private SurveyScenarioRepo = AppDataSource.getRepository(SurveyScenario);
    private QuestionsRepo = AppDataSource.getRepository(Questions);
    private UserRepo = AppDataSource.getRepository(User);

    public CreateSurveyScenario: RequestHandler = async (req, res) => {
        try {
            const parsed = SurveyScenarioParamsSchema.safeParse(req.body);
            if (!parsed.success)
                return res.status(400).json({
                    success: false,
                    message: "Invalid input",
                    error: parsed.error.format(),
                });

            const { minAge, maxAge, location, gender } = parsed.data;

            if (minAge > maxAge)
                return res.status(400).json({ success: false, message: "Min age cannot be greater than max age" });

            const scenario = this.SurveyScenarioRepo.create();
            scenario.minAge = minAge;
            scenario.maxAge = maxAge;
            scenario.location = location || undefined as any;
            scenario.gender = gender?.toLowerCase() === "all" ? undefined as any : (gender?.toLowerCase() || undefined as any);
            scenario.status = "active";

            await this.SurveyScenarioRepo.save(scenario);

            return res.status(201).json({
                success: true,
                message: "Survey scenario created successfully",
                data: scenario,
            });
        } catch (error: any) {
            logger.error("Error creating survey scenario", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    };

    public AttachQuestions: RequestHandler = async (req, res) => {
        try {
            const { id: scenarioId } = req.params;
            const parsed = QuestionIdsSchema.safeParse(req.body);
            if (!parsed.success)
                return res.status(400).json({ success: false, message: "Invalid input", error: parsed.error.format() });

            const { questionIds } = parsed.data;

            const scenario = await this.SurveyScenarioRepo.findOne({
                where: { id: scenarioId },
                relations: ["questions"],
            });
            if (!scenario)
                return res.status(404).json({ success: false, message: "Scenario not found" });

            // Validate questions exist
            const questions = await this.QuestionsRepo.findBy({ id: In(questionIds) });
            if (questions.length !== questionIds.length)
                return res.status(404).json({ success: false, message: "One or more questions not found" });

            scenario.questions = questions;
            await this.SurveyScenarioRepo.save(scenario);

            return res.status(200).json({
                success: true,
                message: "Questions attached successfully",
                data: scenario,
            });
        } catch (error: any) {
            logger.error("Error attaching questions", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    };

    public GetSurveyScenarios: RequestHandler = async (_req, res) => {
        try {
            const scenarios = await this.SurveyScenarioRepo.find({
                relations: ["questions"],
                order: { createdAt: "DESC" },
            });

            return res.status(200).json({
                success: true,
                message: "Survey scenarios retrieved successfully",
                data: scenarios,
            });
        } catch (error: any) {
            logger.error("Error getting survey scenarios", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    };

    public DeleteSurveyScenario: RequestHandler = async (req, res) => {
        try {
            const { id } = req.params;
            const result = await this.SurveyScenarioRepo.delete(id);
            if (result.affected === 0)
                return res.status(404).json({ success: false, message: "Scenario not found" });

            return res.status(200).json({
                success: true,
                message: "Survey scenario deleted successfully",
            });
        } catch (error: any) {
            logger.error("Error deleting survey scenario", error);
            return res.status(500).json({ success: false, message: error.message });
        }
    };

    public GetQuestionsFromScenario: RequestHandler = async (req, res) => {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const userId = req.user.userId;

            // Get user information
            const user = await this.UserRepo.findOne({
                where: { id: userId },
                select: ['id', 'location', 'dateOfBirth', 'gender', 'fullName']
            });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Calculate user's age
            const currentDate = new Date();
            const birthDate = new Date(user.dateOfBirth);
            let userAge = currentDate.getFullYear() - birthDate.getFullYear();
            const monthDiff = currentDate.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
                userAge--;
            }

            const userLocation = user.location || null;
            const userGender = user.gender?.toLowerCase() || null;

            logger.info("Getting questions from scenario for user", { userId, userAge, userLocation, userGender });

            // Find matching scenario
            const queryBuilder = this.SurveyScenarioRepo.createQueryBuilder('scenario')
                .leftJoinAndSelect('scenario.questions', 'questions')
                .leftJoinAndSelect('questions.questionOptions', 'options')
                .leftJoinAndSelect('questions.template', 'template')
                .leftJoinAndSelect('template.model', 'model')
                .leftJoinAndSelect('questions.model', 'questionModel')
                .where('scenario.status = :status', { status: 'active' })
                .andWhere('scenario.minAge <= :userAge', { userAge })
                .andWhere('scenario.maxAge >= :userAge', { userAge });

            // Add location filter (match if scenario.location is null OR matches user location)
            if (userLocation) {
                queryBuilder.andWhere('(scenario.location IS NULL OR scenario.location = :userLocation)', { userLocation });
            } else {
                queryBuilder.andWhere('scenario.location IS NULL');
            }

            // Add gender filter (match if scenario.gender is null OR matches user gender)
            if (userGender) {
                queryBuilder.andWhere('(scenario.gender IS NULL OR scenario.gender = :userGender)', { userGender });
            } else {
                queryBuilder.andWhere('scenario.gender IS NULL');
            }

            queryBuilder.orderBy('options.order', 'ASC');

            const matchingScenarios = await queryBuilder.getMany();

            if (!matchingScenarios || matchingScenarios.length === 0) {
                return res.status(404).json({
                    message: "No matching scenario found for this user",
                    userInfo: {
                        userId,
                        age: userAge,
                        location: userLocation,
                        gender: userGender
                    }
                });
            }

            // Get the first matching scenario
            const scenario = matchingScenarios[0];

            if (!scenario.questions || scenario.questions.length === 0) {
                return res.status(404).json({
                    message: "No questions found in the matching scenario",
                    scenarioId: scenario.id
                });
            }

            // Helper function to generate default options based on question type
            const generateDefaultOptions = (questionType: string) => {
                switch (questionType?.toLowerCase()) {
                    case 'yesno':
                    case 'binary':
                        return [
                            { text: 'Có', value: 'yes', order: 0 },
                            { text: 'Không', value: 'no', order: 1 }
                        ];
                    case 'frequency':
                        return [
                            { text: 'Không bao giờ', value: '1', order: 0 },
                            { text: 'Thỉnh thoảng', value: '2', order: 1 },
                            { text: 'Thường xuyên', value: '3', order: 2 },
                            { text: 'Rất thường xuyên', value: '4', order: 3 }
                        ];
                    case 'likert5':
                        return [
                            { text: 'Rất không thích', value: '1', order: 0 },
                            { text: 'Không thích', value: '2', order: 1 },
                            { text: 'Bình thường', value: '3', order: 2 },
                            { text: 'Thích', value: '4', order: 3 },
                            { text: 'Rất thích', value: '5', order: 4 }
                        ];
                    case 'rating':
                        return [
                            { text: 'Rất tệ', value: '1', order: 0 },
                            { text: 'Tệ', value: '2', order: 1 },
                            { text: 'Bình thường', value: '3', order: 2 },
                            { text: 'Tốt', value: '4', order: 3 },
                            { text: 'Rất tốt', value: '5', order: 4 }
                        ];
                    default:
                        return [];
                }
            };

            // Helper function to extract trait from various sources
            const extractTrait = (question: Questions): string | null => {
                if (question.trait) {
                    return question.trait.toUpperCase();
                }
                if (question.template?.trait) {
                    return question.template.trait.toUpperCase();
                }
                if (question.template?.intent) {
                    const match = question.template.intent.match(/^([OCEAN])/i);
                    if (match) {
                        return match[1].toUpperCase();
                    }
                }
                const model = question.model || question.template?.model;
                if (model?.ocean) {
                    const match = model.ocean.match(/^([OCEAN])/i);
                    if (match) {
                        return match[1].toUpperCase();
                    }
                }
                return null;
            };

            // Transform questions to response format (same as /questions/survey)
            const transformedQuestions = scenario.questions.map(question => {
                let options = question.questionOptions
                    ?.sort((a, b) => a.order - b.order)
                    ?.map(option => ({
                        text: option.text,
                        value: option.value,
                        order: option.order
                    })) || [];

                const questionType = question.template?.question_type;
                if (!options.length ||
                    (questionType === 'yesno' && options.length < 2) ||
                    (questionType === 'binary' && options.length < 2) ||
                    (questionType === 'frequency' && options.length < 4) ||
                    (questionType === 'likert5' && options.length < 5) ||
                    (questionType === 'rating' && options.length < 5)) {

                    const defaultOptions = questionType ? generateDefaultOptions(questionType) : [];
                    if (defaultOptions.length > 0) {
                        options = defaultOptions;
                    }
                }

                const modelData = question.model || question.template?.model;

                return {
                    id: question.id,
                    question: question.question,
                    templateId: question.templateId,
                    behaviorInput: question.behaviorInput,
                    behaviorNormalized: question.behaviorNormalized,
                    trait: extractTrait(question),
                    model: modelData ? {
                        id: modelData.id,
                        ocean: modelData.ocean,
                        behavior: modelData.behavior,
                        age: modelData.age,
                        location: modelData.location,
                        gender: modelData.gender,
                        keywords: modelData.keywords
                    } : null,
                    template: question.template ? {
                        id: question.template.id,
                        intent: question.template.intent,
                        question_type: question.template.question_type,
                        trait: question.template.trait
                    } : null,
                    options: options,
                    createdAt: question.createdAt,
                    updatedAt: question.updatedAt
                };
            });

            return res.status(200).json({
                message: "Questions from scenario retrieved successfully",
                data: transformedQuestions,
                count: transformedQuestions.length,
                scenarioInfo: {
                    scenarioId: scenario.id,
                    minAge: scenario.minAge,
                    maxAge: scenario.maxAge,
                    location: scenario.location,
                    gender: scenario.gender
                },
                userInfo: {
                    userId,
                    age: userAge,
                    location: userLocation,
                    gender: userGender
                }
            });
        } catch (error: any) {
            logger.error("Error getting questions from scenario", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message
            });
        }
    };

    public SimulateScenario: RequestHandler = async (req, res) => {
        try {
            const { id: scenarioId } = req.params;

            if (!scenarioId) {
                return res.status(400).json({
                    success: false,
                    message: "Scenario ID is required"
                });
            }

            // Find scenario with all related data
            const scenario = await this.SurveyScenarioRepo.findOne({
                where: { id: scenarioId },
                relations: ["questions", "questions.questionOptions", "questions.template", "questions.model", "questions.template.model"],
            });

            if (!scenario) {
                return res.status(404).json({
                    success: false,
                    message: "Scenario not found"
                });
            }

            if (!scenario.questions || scenario.questions.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No questions found in this scenario",
                    scenarioId: scenario.id
                });
            }

            // Helper function to generate default options based on question type
            const generateDefaultOptions = (questionType: string) => {
                switch (questionType?.toLowerCase()) {
                    case 'yesno':
                    case 'binary':
                        return [
                            { text: 'Có', value: 'yes', order: 0 },
                            { text: 'Không', value: 'no', order: 1 }
                        ];
                    case 'frequency':
                        return [
                            { text: 'Không bao giờ', value: '1', order: 0 },
                            { text: 'Thỉnh thoảng', value: '2', order: 1 },
                            { text: 'Thường xuyên', value: '3', order: 2 },
                            { text: 'Rất thường xuyên', value: '4', order: 3 }
                        ];
                    case 'likert5':
                        return [
                            { text: 'Rất không thích', value: '1', order: 0 },
                            { text: 'Không thích', value: '2', order: 1 },
                            { text: 'Bình thường', value: '3', order: 2 },
                            { text: 'Thích', value: '4', order: 3 },
                            { text: 'Rất thích', value: '5', order: 4 }
                        ];
                    case 'rating':
                        return [
                            { text: 'Rất tệ', value: '1', order: 0 },
                            { text: 'Tệ', value: '2', order: 1 },
                            { text: 'Bình thường', value: '3', order: 2 },
                            { text: 'Tốt', value: '4', order: 3 },
                            { text: 'Rất tốt', value: '5', order: 4 }
                        ];
                    default:
                        return [];
                }
            };

            // Helper function to extract trait from various sources
            const extractTrait = (question: Questions): string | null => {
                if (question.trait) {
                    return question.trait.toUpperCase();
                }
                if (question.template?.trait) {
                    return question.template.trait.toUpperCase();
                }
                if (question.template?.intent) {
                    const match = question.template.intent.match(/^([OCEAN])/i);
                    if (match) {
                        return match[1].toUpperCase();
                    }
                }
                const model = question.model || question.template?.model;
                if (model?.ocean) {
                    const match = model.ocean.match(/^([OCEAN])/i);
                    if (match) {
                        return match[1].toUpperCase();
                    }
                }
                return null;
            };

            // Transform questions to response format
            const transformedQuestions = scenario.questions.map(question => {
                let options = question.questionOptions
                    ?.sort((a, b) => a.order - b.order)
                    ?.map(option => ({
                        text: option.text,
                        value: option.value,
                        order: option.order
                    })) || [];

                const questionType = question.template?.question_type;
                if (!options.length ||
                    (questionType === 'yesno' && options.length < 2) ||
                    (questionType === 'binary' && options.length < 2) ||
                    (questionType === 'frequency' && options.length < 4) ||
                    (questionType === 'likert5' && options.length < 5) ||
                    (questionType === 'rating' && options.length < 5)) {

                    const defaultOptions = questionType ? generateDefaultOptions(questionType) : [];
                    if (defaultOptions.length > 0) {
                        options = defaultOptions;
                    }
                }

                const modelData = question.model || question.template?.model;

                return {
                    id: question.id,
                    question: question.question,
                    templateId: question.templateId,
                    behaviorInput: question.behaviorInput,
                    behaviorNormalized: question.behaviorNormalized,
                    trait: extractTrait(question),
                    model: modelData ? {
                        id: modelData.id,
                        ocean: modelData.ocean,
                        behavior: modelData.behavior,
                        age: modelData.age,
                        location: modelData.location,
                        gender: modelData.gender,
                        keywords: modelData.keywords
                    } : null,
                    template: question.template ? {
                        id: question.template.id,
                        intent: question.template.intent,
                        question_type: question.template.question_type,
                        trait: question.template.trait
                    } : null,
                    options: options,
                    createdAt: question.createdAt,
                    updatedAt: question.updatedAt
                };
            });

            return res.status(200).json({
                success: true,
                message: "Scenario simulation data retrieved successfully",
                data: transformedQuestions,
                count: transformedQuestions.length,
                scenarioInfo: {
                    scenarioId: scenario.id,
                    minAge: scenario.minAge,
                    maxAge: scenario.maxAge,
                    location: scenario.location,
                    gender: scenario.gender,
                    status: scenario.status
                }
            });
        } catch (error: any) {
            logger.error("Error simulating scenario", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message
            });
        }
    };
}

export default new SurveyScenarioController();
