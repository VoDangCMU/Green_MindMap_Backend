import { Request, Response } from 'express';
import { z } from 'zod';
import AppDataSource from '../infrastructure/database';
import { UserAnswers } from '../entity/user_answers';
import { User } from '../entity/user';
import { Questions } from '../entity/questions';
import { logger } from '../infrastructure/logger';

const UserAnswersSchema = z.object({
    userId: z.string().uuid(),
    questionId: z.string().uuid(),
    answer: z.string(),
    timestamp: z.string().datetime()
});

const UserAnswersUpdateSchema = z.object({
    answer: z.string().optional(),
    timestamp: z.string().datetime().optional()
});

const UserAnswersIdSchema = z.object({
    userId: z.string().uuid(),
    questionId: z.string().uuid()
});

const UserIdSchema = z.object({
    userId: z.string().uuid(),
});

const UserAnswersRepository = AppDataSource.getRepository(UserAnswers);
const UserRepository = AppDataSource.getRepository(User);
const QuestionsRepository = AppDataSource.getRepository(Questions);

function validateUserAnswersParams(req: Request, res: Response) {
    const parsed = UserAnswersSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, { details: parsed.error });
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

function validateUserAnswersUpdateParams(req: Request, res: Response) {
    const parsed = UserAnswersUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, { details: parsed.error });
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

const submitSchema = z.object({
    userId: z.string().uuid(),
    answers: z.array(
        z.object({
            questionId: z.string().uuid(),
            answer: z.string().min(1),
        })
    ),
});

function validateUserAnswersSubmitParams(req: Request, res: Response) {
    const parsed = submitSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error in submitUserAnswer', undefined, { details: parsed.error });
        res.status(400).json({
            message: 'Invalid input',
            errors: parsed.error.errors,
        });
        return null;
    }
    return parsed.data;
}

class UserAnswersController {
    public async submitUserAnswers(req: Request, res: Response) {
        const data = validateUserAnswersSubmitParams(req, res);
        if (!data) return;

        const { userId, answers } = data;

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const userRepo = queryRunner.manager.getRepository(User);
            const questionRepo = queryRunner.manager.getRepository(Questions);
            const userAnswerRepo = queryRunner.manager.getRepository(UserAnswers);

            const user = await userRepo.findOne({
                where: {
                    id: userId
                }
            });
            if (!user) {
                await queryRunner.rollbackTransaction();
                return res.status(404).json({ message: `User ${userId} not found` });
            }

            const savedAnswers: UserAnswers[] = [];
            const notFoundQuestions: string[] = [];

            for (const ans of answers) {
                const question = await questionRepo.findOne({
                    where: {
                        id: ans.questionId
                    }
                });

                if (!question) {
                    notFoundQuestions.push(ans.questionId);
                    continue;
                }

                const existing = await userAnswerRepo.findOne({
                    where: {
                        userId: userId,
                        questionId: ans.questionId
                    },
                });

                let saved: UserAnswers;

                if (existing) {
                    existing.answer = ans.answer;
                    existing.timestamp = new Date();
                    saved = await userAnswerRepo.save(existing);
                } else {
                    const newAnswer = userAnswerRepo.create({
                        userId: userId,
                        questionId: ans.questionId,
                        answer: ans.answer,
                        timestamp: new Date(),
                    });
                    saved = await userAnswerRepo.save(newAnswer);
                }

                savedAnswers.push(saved);
            }

            await queryRunner.commitTransaction();

            const response = {
                message: 'Submit success',
                totalAnswered: savedAnswers.length,
                data: savedAnswers,
            };

            return res.status(200).json(response);
        } catch (err: any) {
            await queryRunner.rollbackTransaction();
            logger.error('Error in submitUserAnswer', undefined, { details: err });
            return res.status(500).json({ message: 'Internal server error', error: err.message });
        } finally {
            await queryRunner.release();
        }
    }

    public async createUserAnswer(req: Request, res: Response) {
        const data = validateUserAnswersParams(req, res);
        if (!data) return;

        try {
            // Check if User exists
            const user = await UserRepository.findOne({
                where: { id: data.userId }
            });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Check if Question exists
            const question = await QuestionsRepository.findOne({
                where: { id: data.questionId }
            });

            if (!question) {
                return res.status(404).json({ message: "Question not found" });
            }

            // Check if user answer already exists for this question
            const existingAnswer = await UserAnswersRepository.findOne({
                where: { userId: data.userId, questionId: data.questionId }
            });

            if (existingAnswer) {
                return res.status(400).json({ message: "User has already answered this question" });
            }

            const userAnswer = new UserAnswers();
            userAnswer.userId = data.userId;
            userAnswer.questionId = data.questionId;
            userAnswer.user = user;
            userAnswer.question = question;
            userAnswer.answer = data.answer;
            userAnswer.timestamp = new Date(data.timestamp);

            const savedUserAnswer = await UserAnswersRepository.save(userAnswer);
            return res.status(201).json(savedUserAnswer);
        } catch (e) {
            logger.error('Error creating user answer', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async getUserAnswerById(req: Request, res: Response) {
        const parsed = UserAnswersIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const { userId, questionId } = parsed.data;

        try {
            const userAnswer = await UserAnswersRepository.findOne({
                where: { userId, questionId },
                relations: ['user', 'question']
            });

            if (!userAnswer) {
                return res.status(404).json({ error: 'User answer not found' });
            }

            return res.status(200).json(userAnswer);
        } catch (e) {
            logger.error('Error fetching user answer', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async getUserAnswersByUserId(req: Request, res: Response) {
        const parsed = UserIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const userId = parsed.data.userId;

        try {
            const userAnswers = await UserAnswersRepository.find({
                where: { userId },
                relations: ['user', 'question'],
                order: { timestamp: 'DESC' }
            });

            return res.status(200).json(userAnswers);
        } catch (e) {
            logger.error('Error fetching user answers by user ID', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async updateUserAnswer(req: Request, res: Response) {
        const data = validateUserAnswersUpdateParams(req, res);
        if (!data) return;

        const parsed = UserAnswersIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const { userId, questionId } = parsed.data;

        try {
            const existedUserAnswer = await UserAnswersRepository.findOne({
                where: { userId, questionId }
            });

            if (!existedUserAnswer) {
                return res.status(404).json({ error: 'User answer not found' });
            }

            if (data.answer !== undefined) existedUserAnswer.answer = data.answer;
            if (data.timestamp !== undefined) existedUserAnswer.timestamp = new Date(data.timestamp);

            const updatedUserAnswer = await UserAnswersRepository.save(existedUserAnswer);
            return res.status(200).json(updatedUserAnswer);
        } catch (e) {
            logger.error('Error updating user answer', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async deleteUserAnswer(req: Request, res: Response) {
        const parsed = UserAnswersIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const { userId, questionId } = parsed.data;

        try {
            const userAnswer = await UserAnswersRepository.findOne({
                where: { userId, questionId }
            });

            if (!userAnswer) {
                return res.status(404).json({ error: 'User answer not found' });
            }

            await UserAnswersRepository.delete({ userId, questionId });
            return res.status(200).json({ message: 'User answer deleted successfully', deletedData: userAnswer });
        } catch (e) {
            logger.error('Error deleting user answer', e as Error);
            return res.status(500).json({ error: 'Database error occurred while deleting the user answer.' });
        }
    }

    public async getAllUserAnswers(req: Request, res: Response) {
        try {
            const userAnswers = await UserAnswersRepository.find({
                relations: ['user', 'question'],
                order: { timestamp: 'DESC' }
            });

            return res.status(200).json(userAnswers);
        } catch (e) {
            logger.error('Error fetching all user answers', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    public async getUserAnswersByQuestionId(req: Request, res: Response) {
        const questionId = req.params.questionId;

        if (!questionId) {
            return res.status(400).json({ message: "Question ID is required" });
        }

        try {
            const userAnswers = await UserAnswersRepository.find({
                where: { questionId },
                relations: ['user', 'question'],
                order: { timestamp: 'DESC' }
            });

            return res.status(200).json(userAnswers);
        } catch (e) {
            logger.error('Error fetching user answers by question ID', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }
}

export default new UserAnswersController();
