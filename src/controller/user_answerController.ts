import {Request, Response} from 'express';
import {z} from 'zod';
import {AppDataSource} from '../infrastructure/database';
import {UserAnswers} from '../entity/user_answers';
import { logger } from '@root/infrastructure/logger';
import {Questions} from "@root/entity/questions";
import {User} from "@root/entity/user";
import TEXT from "@root/config/schemas/Text";

const userAnswerSchema = z.object({
    userId: TEXT.uuid(),
    questionId: TEXT.uuid(),
    answer: TEXT,
});

const userAnswerIdSchema = z.object({
    userId: TEXT.uuid(),
    questionId: TEXT.uuid(),
});


const UserAnswerRepository = AppDataSource.getRepository(UserAnswers);
const UserRepository = AppDataSource.getRepository(User);
const QuestionRepository = AppDataSource.getRepository(Questions);

function validateUserAnswerParams(req: Request, res: Response) {
    const parsed = userAnswerSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, {details: parsed.error});
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

function validateUserAnswerId(req: Request, res: Response) {
    const parsed = userAnswerIdSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, {details: parsed.error});
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

class UserAnswerController {
    public async createUserAnswer(req: Request, res: Response) {
        const data = validateUserAnswerParams(req, res);
        if (!data) return;

        let existedUser;
        let existedQuestion;

        try {
            existedUser = await UserRepository.findOne({
                where: {id: data.userId}
            });
        } catch (e) {
            res.status(500).json({message: "Internal server error"});
            return;
        }

        if (!existedUser) {
            return res.status(404).json({message: "User not found"});
        }

        try {
            existedQuestion = await QuestionRepository.findOne({
                where: {id: data.questionId}
            });
        } catch (e) {
            res.status(500).json({message: "Internal server error"});
            return;
        }

        if (!existedQuestion) {
            return res.status(404).json({message: "Question not found"});
        }

        const userAnswer = new UserAnswers();
        userAnswer.userId = data.userId;
        userAnswer.questionId = data.questionId;
        userAnswer.user = existedUser;
        userAnswer.question = existedQuestion;
        userAnswer.answer = data.answer;

        try {
            await UserAnswerRepository.save(userAnswer);
        } catch (e) {
            res.status(500).json({message: "Internal server error"});
            return;
        }

        return res.status(201).json(userAnswer);
    }

    public async updateUserAnswerById(req: Request, res: Response) {
        const data = validateUserAnswerParams(req, res);
        if (!data) return;

        let existedUserAnswer;

        try {
            existedUserAnswer = await UserAnswerRepository.findOne({
                where: {
                    userId: data.userId,
                    questionId: data.questionId
                }
            });
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        if (!existedUserAnswer) {
            return res.status(404).json({ error: 'User answer not found' });
        }

        existedUserAnswer.answer = data.answer;

        try {
            await UserAnswerRepository.save(existedUserAnswer);
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        return res.status(200).json(existedUserAnswer);
    }

    public async getUserAnswerById(req: Request, res: Response) {
        const data = validateUserAnswerId(req, res);
        if (!data) return;

        try {
            const existedUserAnswer = await UserAnswerRepository.findOne({
                where: { userId: data.userId, questionId: data.questionId },
            });

            if (!existedUserAnswer) {
                return res.status(404).json({ error: "User answer not found" });
            }

            return res.status(200).json(existedUserAnswer);
        } catch (e) {
            logger.error("Error fetching user answer", e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    public async deleteUserAnswerById(req: Request, res: Response) {
        const parsed = userAnswerIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            res.status(400).json(parsed.error);
            return;
        }

        let existedUserAnswer;
        const userId = parsed.data.userId;
        const questionId = parsed.data.questionId;

        try {
            existedUserAnswer = await UserAnswerRepository.findOne({
                where: {
                    userId: userId,
                    questionId: questionId
                }
            });
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        if (!existedUserAnswer) {
            return res.status(404).json({ error: 'User answer not found' });
        }

        try {
            await UserAnswerRepository.delete({
                userId: userId,
                questionId: questionId,
            });
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        return res.status(200).json(existedUserAnswer);
    }
}

export default new UserAnswerController();8