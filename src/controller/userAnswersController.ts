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

        const questionId = req.params.questionId;

        if (!req.user || !req.user.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        try {
            const [user, answer, question] = await Promise.all([
                UserRepository.findOne({ where: { id: req.user?.userId } }),
                UserAnswersRepository.findOne({ where: { userId: req.user?.userId, questionId } }),
                QuestionsRepository.findOne({ where: { id: questionId }, relations: {template: true} })
            ]);

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            if (!question) {
                return res.status(404).json({ message: "Question not found" });
            }
            if (!answer) {
                return res.status(404).json({ message: "User answer not found" });
            }

            return res.status(200).json({
                user,
                question,
                template: question.template,
                answer
            });
        } catch (e) {
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
            // Lấy tất cả câu trả lời của user với đầy đủ relations
            const userAnswers = await UserAnswersRepository.find({
                where: { userId },
                relations: ['question', 'question.template', 'question.template.answer', 'question.threadHall', 'question.threadHall.traits'],
                order: { timestamp: 'DESC' }
            });

            // Transform dữ liệu theo format mong muốn
            const formattedAnswers = userAnswers.map(userAnswer => {
                const question = userAnswer.question;
                const template = question?.template;
                const templateAnswer = template?.answer;
                const threadHall = question?.threadHall;
                const trait = threadHall?.traits;

                // Tính score và key dựa trên answer và template type
                let score = 0;
                let key = 'pos';
                const answerText = userAnswer.answer;
                const answerType = templateAnswer?.type || template?.intent || 'unknown';

                // Logic tính score dựa vào loại câu hỏi
                if (answerType === 'yesno') {
                    if (answerText.toLowerCase() === 'có' || answerText.toLowerCase() === 'yes') {
                        score = 1;
                        key = 'pos';
                    } else {
                        score = 0;
                        key = 'neg';
                    }
                } else if (answerType === 'frequency') {
                    const frequencyMap: Record<string, number> = {
                        'không bao giờ': 0,
                        'hiếm khi': 1,
                        'thỉnh thoảng': 2,
                        'thường xuyên': 4,
                        'rất thường xuyên': 5
                    };
                    score = frequencyMap[answerText.toLowerCase()] || 0;
                    key = score >= 3 ? 'pos' : 'neg';
                } else if (answerType === 'likert5' || answerType === 'rating') {
                    score = parseInt(answerText) || 0;
                    key = score >= 3 ? 'pos' : 'neg';
                } else {
                    // Default: cố gắng parse số
                    const parsed = parseInt(answerText);
                    if (!isNaN(parsed)) {
                        score = parsed;
                        key = score >= 3 ? 'pos' : 'neg';
                    }
                }

                return {
                    trait: trait?.label || trait?.name || 'Unknown',
                    template_id: template?.id || 'Unknown',
                    intent: template?.intent || 'Unknown',
                    question: question?.question || '',
                    ans: answerText,
                    score: score,
                    key: key,
                    kind: answerType
                };
            });

            return res.status(200).json({
                user_id: userId,
                answers: formattedAnswers
            });
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
