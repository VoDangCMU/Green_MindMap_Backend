import { Request, Response } from 'express';
import { z } from 'zod';
import AppDataSource from '../infrastructure/database';
import { UserAnswers } from '../entity/user_answers';
import { User } from '../entity/user';
import { Questions } from '../entity/questions';
import { logger } from '../infrastructure/logger';
import { BigFive, BigFiveType } from '../entity/big_five';
import { Feedback } from '../entity/feedback';
import { Segment } from '../entity/segments';
import { ScenarioAssignment } from '../entity/scenario_assignments';
import { Models } from '../entity/models';

const AI_BASE_URL = 'https://ai-greenmind.khoav4.com';

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
            const bigFiveRepo = queryRunner.manager.getRepository(BigFive);
            const feedbackRepo = queryRunner.manager.getRepository(Feedback);
            const segmentRepo = queryRunner.manager.getRepository(Segment);
            const assignmentRepo = queryRunner.manager.getRepository(ScenarioAssignment);

            const user = await userRepo.findOne({
                where: { id: userId }
            });
            if (!user) {
                await queryRunner.rollbackTransaction();
                return res.status(404).json({ message: `User ${userId} not found` });
            }

            // Calculate user age
            const today = new Date();
            const birthDate = user.dateOfBirth ? new Date(user.dateOfBirth) : null;
            const userAge = birthDate
                ? Math.floor((today.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                : 25;

            const savedAnswers: UserAnswers[] = [];
            const notFoundQuestions: string[] = [];
            const questionsWithDetails: any[] = [];
            let modelFromQuestion: Models | null = null;

            for (const ans of answers) {
                const question = await questionRepo.findOne({
                    where: { id: ans.questionId },
                    relations: ['template', 'model']
                });

                if (!question) {
                    notFoundQuestions.push(ans.questionId);
                    continue;
                }

                // Get model from first question that has it
                if (!modelFromQuestion && question.model) {
                    modelFromQuestion = question.model;
                }

                const existing = await userAnswerRepo.findOne({
                    where: { userId: userId, questionId: ans.questionId },
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

                // Prepare data for AI API
                const template = question.template;
                const questionType = template?.question_type || template?.intent || 'yesno';
                const trait = question.trait || template?.trait || 'O';

                questionsWithDetails.push({
                    trait: trait,
                    text: question.question,
                    ans: ans.answer,
                    key: 'pos', // Default, can be enhanced based on question metadata
                    kind: questionType
                });
            }

            await queryRunner.commitTransaction();

            // Step 1: Call calculate_ocean API
            let oceanScores: { O: number; C: number; E: number; A: number; N: number } | null = null;
            try {
                const calculateOceanResponse = await fetch(`${AI_BASE_URL}/calculate_ocean`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: userId,
                        answers: questionsWithDetails
                    })
                });

                if (calculateOceanResponse.ok) {
                    const oceanResult = await calculateOceanResponse.json();
                    oceanScores = oceanResult.scores;
                    logger.info('OCEAN scores calculated', { userId, scores: oceanScores });

                    // Check if oceanScores is valid before using
                    if (!oceanScores) {
                        logger.error('OCEAN scores is null or undefined', undefined, { userId });
                        return res.status(500).json({ error: 'Failed to calculate OCEAN scores' });
                    }

                    // Step 2: Update BigFive for user (convert from xx.xx to 0.xx)
                    let userBigFive = await bigFiveRepo.findOne({
                        where: { referenceId: userId, type: BigFiveType.USER }
                    });

                    if (userBigFive) {
                        userBigFive.openness = oceanScores.O / 100;
                        userBigFive.conscientiousness = oceanScores.C / 100;
                        userBigFive.extraversion = oceanScores.E / 100;
                        userBigFive.agreeableness = oceanScores.A / 100;
                        userBigFive.neuroticism = oceanScores.N / 100;
                        await bigFiveRepo.save(userBigFive);
                    } else {
                        userBigFive = bigFiveRepo.create({
                            openness: oceanScores.O / 100,
                            conscientiousness: oceanScores.C / 100,
                            extraversion: oceanScores.E / 100,
                            agreeableness: oceanScores.A / 100,
                            neuroticism: oceanScores.N / 100,
                            type: BigFiveType.USER,
                            referenceId: userId
                        });
                        await bigFiveRepo.save(userBigFive);
                    }

                    // Step 3: Call verify-survey API and save feedback for each segment
                    // Step 4: Find segment related to user and update group OCEAN
                    try {
                        // Find user's assignments to get related segments
                        const userAssignments = await assignmentRepo.find({
                            where: { user: { id: userId }, status: 'assigned' },
                            relations: ['scenario', 'scenario.questionSet', 'scenario.questionSet.model']
                        });

                        logger.info('User assignments found', {
                            userId,
                            assignmentCount: userAssignments.length,
                            userLocation: user.location,
                            userGender: user.gender,
                            userAge
                        });

                        if (userAssignments.length === 0) {
                            logger.warn('No assignments found for user', { userId });
                        }

                        for (const assignment of userAssignments) {
                            const scenarioModel = assignment.scenario?.questionSet?.model;
                            if (!scenarioModel) {
                                logger.warn('No model found for assignment', { assignmentId: assignment.id });
                                continue;
                            }

                            logger.info('Processing assignment', {
                                assignmentId: assignment.id,
                                scenarioId: assignment.scenario?.id,
                                modelId: scenarioModel.id,
                                modelName: scenarioModel.behavior
                            });

                            // Find ALL segments for this model first
                            const allSegmentsForModel = await segmentRepo.find({
                                where: {
                                    modelId: scenarioModel.id
                                }
                            });

                            logger.info('Found segments for model', {
                                modelId: scenarioModel.id,
                                totalSegments: allSegmentsForModel.length,
                                segments: allSegmentsForModel.map(s => ({
                                    id: s.id,
                                    name: s.name,
                                    location: s.location,
                                    gender: s.gender,
                                    age: s.age
                                }))
                            });

                            // Filter segments that match user's attributes (more flexible matching)
                            const matchingSegments = allSegmentsForModel.filter(segment => {
                                // Normalize strings for comparison
                                const normalizeString = (str: string | undefined | null) => {
                                    if (!str) return '';
                                    return str.toLowerCase()
                                        .normalize('NFD')
                                        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
                                        .replace(/\s+/g, '_') // Replace spaces with underscore
                                        .trim();
                                };

                                const userLocationNorm = normalizeString(user.location);
                                const segmentLocationNorm = normalizeString(segment.location);
                                const userGenderNorm = normalizeString(user.gender);
                                const segmentGenderNorm = normalizeString(segment.gender);

                                // Location match: segment location is not set OR matches user location
                                const locationMatch = !segment.location ||
                                                     segmentLocationNorm === userLocationNorm ||
                                                     userLocationNorm.includes(segmentLocationNorm) ||
                                                     segmentLocationNorm.includes(userLocationNorm);

                                // Gender match: segment gender is not set OR matches user gender
                                const genderMatch = !segment.gender ||
                                                   segmentGenderNorm === userGenderNorm;

                                // Age match: segment age is not set OR within 5 years range
                                const ageMatch = !segment.age ||
                                               Math.abs(segment.age - userAge) <= 5;

                                const matches = locationMatch && genderMatch && ageMatch;

                                logger.info('Segment matching check', {
                                    segmentId: segment.id,
                                    segmentName: segment.name,
                                    locationMatch,
                                    genderMatch,
                                    ageMatch,
                                    finalMatch: matches,
                                    details: {
                                        segment: { location: segment.location, gender: segment.gender, age: segment.age },
                                        user: { location: user.location, gender: user.gender, age: userAge },
                                        normalized: {
                                            segmentLocation: segmentLocationNorm,
                                            userLocation: userLocationNorm,
                                            segmentGender: segmentGenderNorm,
                                            userGender: userGenderNorm
                                        }
                                    }
                                });

                                return matches;
                            });

                            logger.info('Matching segments after filtering', {
                                matchingCount: matchingSegments.length,
                                matchingSegments: matchingSegments.map(s => ({
                                    id: s.id,
                                    name: s.name,
                                    location: s.location,
                                    gender: s.gender,
                                    age: s.age
                                }))
                            });

                            if (matchingSegments.length === 0) {
                                logger.warn('No matching segments found for user', {
                                    userId,
                                    modelId: scenarioModel.id,
                                    userLocation: user.location,
                                    userGender: user.gender,
                                    userAge,
                                    availableSegments: allSegmentsForModel.map(s => s.name)
                                });
                                continue;
                            }

                            // Process each matching segment
                            for (const segment of matchingSegments) {
                                logger.info('Processing segment', {
                                    segmentId: segment.id,
                                    segmentName: segment.name,
                                    userId
                                });

                                // Call verify-survey API for this segment
                                try {
                                    const verifySurveyPayload = {
                                        model: {
                                            id: scenarioModel.id,
                                            ocean: scenarioModel.ocean,
                                            behavior: scenarioModel.behavior,
                                            age: scenarioModel.age,
                                            location: scenarioModel.location,
                                            gender: scenarioModel.gender,
                                            keywords: scenarioModel.keywords
                                        },
                                        user_id: userId,
                                        survey_result: {
                                            O: userBigFive.openness,
                                            C: userBigFive.conscientiousness,
                                            E: userBigFive.extraversion,
                                            A: userBigFive.agreeableness,
                                            N: userBigFive.neuroticism
                                        }
                                    };

                                    logger.info('Calling verify-survey API', {
                                        segmentId: segment.id,
                                        payload: verifySurveyPayload
                                    });

                                    const verifySurveyResponse = await fetch(`${AI_BASE_URL}/verify-survey`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(verifySurveyPayload)
                                    });

                                    if (verifySurveyResponse.ok) {
                                        const verifyResult = await verifySurveyResponse.json();
                                        logger.info('Survey verified for segment', {
                                            userId,
                                            segmentId: segment.id,
                                            segmentName: segment.name,
                                            result: verifyResult
                                        });

                                        // Save feedback with segmentId
                                        const feedback = feedbackRepo.create({
                                            modelId: scenarioModel.id,
                                            segmentId: segment.id,
                                            user_id: userId,
                                            trait_checked: verifyResult.trait_checked,
                                            expected: verifyResult.expected,
                                            actual: verifyResult.actual,
                                            deviation: verifyResult.deviation,
                                            match: verifyResult.match,
                                            level: verifyResult.level,
                                            feedback: verifyResult.feedback
                                        });

                                        const savedFeedback = await feedbackRepo.save(feedback);

                                        logger.info('✅ Feedback saved successfully', {
                                            feedbackId: savedFeedback.id,
                                            segmentId: segment.id,
                                            segmentName: segment.name,
                                            userId,
                                            traitChecked: verifyResult.trait_checked,
                                            match: verifyResult.match
                                        });
                                    } else {
                                        const errorText = await verifySurveyResponse.text();
                                        logger.error('❌ verify-survey API returned error', undefined, {
                                            status: verifySurveyResponse.status,
                                            statusText: verifySurveyResponse.statusText,
                                            errorText,
                                            segmentId: segment.id,
                                            segmentName: segment.name
                                        });
                                    }
                                } catch (verifyErr) {
                                    logger.error('❌ Error calling verify-survey API for segment', verifyErr as Error, {
                                        segmentId: segment.id,
                                        segmentName: segment.name,
                                        userId
                                    });
                                }

                                // Get all users in this segment (with flexible matching)
                                const segmentUsers = await userRepo
                                    .createQueryBuilder('user')
                                    .where('1=1')
                                    .andWhere(segment.location ?
                                        'LOWER(user.location) LIKE LOWER(:location)' : '1=1',
                                        { location: `%${segment.location}%` })
                                    .andWhere(segment.gender ?
                                        'LOWER(user.gender) = LOWER(:gender)' : '1=1',
                                        { gender: segment.gender })
                                    .getMany();

                                logger.info('Found segment users for group calculation', {
                                    segmentId: segment.id,
                                    segmentName: segment.name,
                                    userCount: segmentUsers.length
                                });

                                // Get BigFive scores for all segment users
                                const usersWithScores: { user_id: string; scores: { O: number; C: number; E: number; A: number; N: number } }[] = [];

                                for (const segUser of segmentUsers) {
                                    const segUserBigFive = await bigFiveRepo.findOne({
                                        where: { referenceId: segUser.id, type: BigFiveType.USER }
                                    });

                                    if (segUserBigFive) {
                                        usersWithScores.push({
                                            user_id: segUser.id,
                                            scores: {
                                                O: segUserBigFive.openness * 100,
                                                C: segUserBigFive.conscientiousness * 100,
                                                E: segUserBigFive.extraversion * 100,
                                                A: segUserBigFive.agreeableness * 100,
                                                N: segUserBigFive.neuroticism * 100
                                            }
                                        });
                                    }
                                }

                                if (usersWithScores.length === 0) {
                                    logger.warn('No users with BigFive scores found for segment', {
                                        segmentId: segment.id,
                                        segmentName: segment.name
                                    });
                                    continue;
                                }

                                // Call calculate_group_ocean API
                                try {
                                    const groupOceanPayload = {
                                        target_segment: {
                                            location_detail: segment.location || user.location,
                                            age_detail: segment.age || userAge,
                                            gender_detail: segment.gender || user.gender
                                        },
                                        users: usersWithScores
                                    };

                                    logger.info('Calling calculate_group_ocean API', {
                                        segmentId: segment.id,
                                        userCount: usersWithScores.length
                                    });

                                    const groupOceanResponse = await fetch(`${AI_BASE_URL}/calculate_group_ocean`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(groupOceanPayload)
                                    });

                                    if (groupOceanResponse.ok) {
                                        const groupResult = await groupOceanResponse.json();
                                        const groupScores = groupResult.group_ocean_score;
                                        logger.info('Group OCEAN calculated', {
                                            segmentId: segment.id,
                                            segmentName: segment.name,
                                            scores: groupScores
                                        });

                                        // Update segment's BigFive
                                        let segmentBigFive = await bigFiveRepo.findOne({
                                            where: { referenceId: segment.id, type: BigFiveType.SEGMENT }
                                        });

                                        if (segmentBigFive) {
                                            segmentBigFive.openness = groupScores.O / 100;
                                            segmentBigFive.conscientiousness = groupScores.C / 100;
                                            segmentBigFive.extraversion = groupScores.E / 100;
                                            segmentBigFive.agreeableness = groupScores.A / 100;
                                            segmentBigFive.neuroticism = groupScores.N / 100;
                                            await bigFiveRepo.save(segmentBigFive);
                                        } else {
                                            segmentBigFive = bigFiveRepo.create({
                                                openness: groupScores.O / 100,
                                                conscientiousness: groupScores.C / 100,
                                                extraversion: groupScores.E / 100,
                                                agreeableness: groupScores.A / 100,
                                                neuroticism: groupScores.N / 100,
                                                type: BigFiveType.SEGMENT,
                                                referenceId: segment.id
                                            });
                                            await bigFiveRepo.save(segmentBigFive);
                                        }
                                        logger.info('Segment BigFive updated', {
                                            segmentId: segment.id,
                                            segmentName: segment.name
                                        });
                                    } else {
                                        const errorText = await groupOceanResponse.text();
                                        logger.error('calculate_group_ocean API returned error', undefined, {
                                            status: groupOceanResponse.status,
                                            errorText,
                                            segmentId: segment.id,
                                            segmentName: segment.name
                                        });
                                    }
                                } catch (groupOceanErr) {
                                    logger.error('Error calling calculate_group_ocean API', groupOceanErr as Error, {
                                        segmentId: segment.id,
                                        segmentName: segment.name
                                    });
                                }
                            }
                        }
                    } catch (groupErr) {
                        logger.error('Error in segment processing', groupErr as Error);
                    }
                }
            } catch (oceanErr) {
                logger.error('Error calling calculate_ocean API', oceanErr as Error);
            }

            const response = {
                message: 'Submit success',
                totalAnswered: savedAnswers.length,
                data: savedAnswers,
                oceanScores: oceanScores ? {
                    O: oceanScores.O / 100,
                    C: oceanScores.C / 100,
                    E: oceanScores.E / 100,
                    A: oceanScores.A / 100,
                    N: oceanScores.N / 100
                } : null
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
                relations: ['question', 'question.template', 'question.template.answer'],
                order: { timestamp: 'DESC' }
            });

            // Transform dữ liệu theo format mong muốn
            const formattedAnswers = userAnswers.map(userAnswer => {
                const question = userAnswer.question;
                const template = question?.template;
                const templateAnswer = template?.answer;

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
                    trait: template?.trait || 'Unknown',
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
