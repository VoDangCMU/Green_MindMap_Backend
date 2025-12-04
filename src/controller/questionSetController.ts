import { Request, Response } from 'express';
import { z } from 'zod';
import AppDataSource from '../infrastructure/database';
import { QuestionSets } from '../entity/question_sets';
import { QuestionSetItems } from '../entity/question_set_items';
import { Questions } from '../entity/questions';
import { User } from '../entity/user';
import { logger } from '../infrastructure/logger';

const CreateQuestionSetSchema = z.object({
    name: z.string().min(1, "Question set name is required"),
    description: z.string().optional(),
    questionIds: z.array(z.string().uuid("Invalid question ID")).min(1, "At least one question is required")
});

const UpdateQuestionSetSchema = z.object({
    name: z.string().min(1, "Question set name is required").optional(),
    description: z.string().optional(),
    questionIds: z.array(z.string().uuid("Invalid question ID")).optional()
});

const QuestionSetIdSchema = z.object({
    id: z.string().uuid("Invalid question set ID"),
});

const QuestionSetsRepository = AppDataSource.getRepository(QuestionSets);
const QuestionSetItemsRepository = AppDataSource.getRepository(QuestionSetItems);
const QuestionsRepository = AppDataSource.getRepository(Questions);
const UserRepository = AppDataSource.getRepository(User);

export class QuestionSetController {
    // Create a new question set
    public async createQuestionSet(req: Request, res: Response) {
        const parsed = CreateQuestionSetSchema.safeParse(req.body);
        if (!parsed.success) {
            logger.error('Question set validation error', undefined, { details: parsed.error });
            return res.status(400).json({
                message: "Validation error",
                errors: parsed.error.format()
            });
        }

        const data = parsed.data;
        const userId = (req as any).userId; // From JWT middleware

        try {
            // Verify user exists
            const user = await UserRepository.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Verify all questions exist
            const questions = await QuestionsRepository.findByIds(data.questionIds);
            if (questions.length !== data.questionIds.length) {
                return res.status(404).json({
                    message: "Some questions not found",
                    found: questions.length,
                    requested: data.questionIds.length
                });
            }

            // Create question set
            const questionSet = QuestionSetsRepository.create({
                name: data.name,
                description: data.description,
                owner: user,
                ownerId: userId
            });

            const savedQuestionSet = await QuestionSetsRepository.save(questionSet);

            // Create question set items
            const items = data.questionIds.map((questionId, index) => {
                return QuestionSetItemsRepository.create({
                    questionSet: savedQuestionSet,
                    questionSetId: savedQuestionSet.id,
                    question: questions.find(q => q.id === questionId)!,
                    questionId: questionId,
                    order: index
                });
            });

            await QuestionSetItemsRepository.save(items);

            // Reload with relations
            const result = await QuestionSetsRepository.findOne({
                where: { id: savedQuestionSet.id },
                relations: ['owner', 'items', 'items.question']
            });

            return res.status(201).json({
                message: "Question set created successfully",
                data: result
            });
        } catch (e) {
            logger.error('Error creating question set', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Get all question sets
    public async getQuestionSets(req: Request, res: Response) {
        try {
            const questionSets = await QuestionSetsRepository.find({
                relations: ['owner', 'items', 'items.question'],
                order: { createdAt: 'DESC' }
            });

            return res.status(200).json({
                message: "Question sets retrieved successfully",
                data: questionSets,
                count: questionSets.length
            });
        } catch (e) {
            logger.error('Error fetching question sets', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Get question sets by owner
    public async getQuestionSetsByOwner(req: Request, res: Response) {
        const userId = req.params.ownerId || (req as any).userId; // Allow getting by ownerId param or current user

        try {
            const questionSets = await QuestionSetsRepository.find({
                where: { ownerId: userId },
                relations: ['owner', 'items', 'items.question'],
                order: { createdAt: 'DESC' }
            });

            return res.status(200).json({
                message: "Question sets retrieved successfully",
                data: questionSets,
                count: questionSets.length
            });
        } catch (e) {
            logger.error('Error fetching question sets by owner', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Get question set by ID
    public async getQuestionSetById(req: Request, res: Response) {
        const parsed = QuestionSetIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Question set ID validation error', undefined, { details: parsed.error });
            return res.status(400).json({
                message: "Invalid question set ID format",
                errors: parsed.error.format()
            });
        }

        const questionSetId = parsed.data.id;

        try {
            const questionSet = await QuestionSetsRepository.findOne({
                where: { id: questionSetId },
                relations: ['owner', 'items', 'items.question', 'items.question.questionOptions']
            });

            if (!questionSet) {
                return res.status(404).json({ message: "Question set not found" });
            }

            return res.status(200).json({
                message: "Question set found",
                data: questionSet
            });
        } catch (e) {
            logger.error('Error fetching question set', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Update question set
    public async updateQuestionSet(req: Request, res: Response) {
        const parsed = QuestionSetIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Question set ID validation error', undefined, { details: parsed.error });
            return res.status(400).json({
                message: "Invalid question set ID format",
                errors: parsed.error.format()
            });
        }

        const dataParsed = UpdateQuestionSetSchema.safeParse(req.body);
        if (!dataParsed.success) {
            logger.error('Question set update validation error', undefined, { details: dataParsed.error });
            return res.status(400).json({
                message: "Validation error",
                errors: dataParsed.error.format()
            });
        }

        const questionSetId = parsed.data.id;
        const data = dataParsed.data;
        const userId = (req as any).userId;

        try {
            const questionSet = await QuestionSetsRepository.findOne({
                where: { id: questionSetId },
                relations: ['owner', 'items']
            });

            if (!questionSet) {
                return res.status(404).json({ message: "Question set not found" });
            }

            // Check ownership
            if (questionSet.ownerId !== userId) {
                return res.status(403).json({ message: "You don't have permission to update this question set" });
            }

            // Update basic fields
            if (data.name !== undefined) {
                questionSet.name = data.name;
            }
            if (data.description !== undefined) {
                questionSet.description = data.description;
            }

            await QuestionSetsRepository.save(questionSet);

            // Update question items if provided
            if (data.questionIds !== undefined) {
                // Verify all questions exist
                const questions = await QuestionsRepository.findByIds(data.questionIds);
                if (questions.length !== data.questionIds.length) {
                    return res.status(404).json({
                        message: "Some questions not found",
                        found: questions.length,
                        requested: data.questionIds.length
                    });
                }

                // Delete existing items
                await QuestionSetItemsRepository.delete({ questionSetId: questionSetId });

                // Create new items
                const items = data.questionIds.map((questionId, index) => {
                    return QuestionSetItemsRepository.create({
                        questionSet: questionSet,
                        questionSetId: questionSetId,
                        question: questions.find(q => q.id === questionId)!,
                        questionId: questionId,
                        order: index
                    });
                });

                await QuestionSetItemsRepository.save(items);
            }

            // Reload with relations
            const result = await QuestionSetsRepository.findOne({
                where: { id: questionSetId },
                relations: ['owner', 'items', 'items.question']
            });

            return res.status(200).json({
                message: "Question set updated successfully",
                data: result
            });
        } catch (e) {
            logger.error('Error updating question set', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Delete question set
    public async deleteQuestionSet(req: Request, res: Response) {
        const parsed = QuestionSetIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Question set ID validation error', undefined, { details: parsed.error });
            return res.status(400).json({
                message: "Invalid question set ID format",
                errors: parsed.error.format()
            });
        }

        const questionSetId = parsed.data.id;
        const userId = (req as any).userId;

        try {
            const questionSet = await QuestionSetsRepository.findOne({
                where: { id: questionSetId }
            });

            if (!questionSet) {
                return res.status(404).json({ message: "Question set not found" });
            }

            // Check ownership
            if (questionSet.ownerId !== userId) {
                return res.status(403).json({ message: "You don't have permission to delete this question set" });
            }

            await QuestionSetsRepository.remove(questionSet);

            return res.status(200).json({
                message: "Question set deleted successfully"
            });
        } catch (e) {
            logger.error('Error deleting question set', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}

export default new QuestionSetController();

