import { Request, Response } from 'express';
import { z } from 'zod';
import AppDataSource from '../infrastructure/database';
import { Questions } from '../entity/questions';
import { Template } from '../entity/templates';
import { ThreadHall } from '../entity/thread_halls';
import { logger } from '../infrastructure/logger';

const QuestionSchema = z.object({
    question: z.string().min(1, "Question text is required"),
    templateId: z.string().uuid("Invalid template ID"),
    threadHallId: z.string().uuid("Invalid thread hall ID").optional()
});

const QuestionUpdateSchema = z.object({
    question: z.string().min(1, "Question text is required").optional(),
    templateId: z.string().uuid("Invalid template ID").optional(),
    threadHallId: z.string().uuid("Invalid thread hall ID").optional()
});

const QuestionIdSchema = z.object({
    id: z.string().uuid("Invalid question ID"),
});

// Batch question creation schema
const BatchQuestionSchema = z.object({
    questions: z.array(QuestionSchema).min(1, "At least one question is required")
});

const QuestionsRepository = AppDataSource.getRepository(Questions);
const TemplateRepository = AppDataSource.getRepository(Template);
const ThreadHallRepository = AppDataSource.getRepository(ThreadHall);

function validateQuestionParams(req: Request, res: Response) {
    const parsed = QuestionSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Question validation error', undefined, { details: parsed.error });
        res.status(400).json({
            message: "Validation error",
            errors: parsed.error.format()
        });
        return null;
    }
    return parsed.data;
}

function validateBatchQuestionParams(req: Request, res: Response) {
    const parsed = BatchQuestionSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Batch question validation error', undefined, { details: parsed.error });
        res.status(400).json({
            message: "Validation error",
            errors: parsed.error.format()
        });
        return null;
    }
    return parsed.data;
}

function validateQuestionUpdateParams(req: Request, res: Response) {
    const parsed = QuestionUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Question update validation error', undefined, { details: parsed.error });
        res.status(400).json({
            message: "Validation error",
            errors: parsed.error.format()
        });
        return null;
    }
    return parsed.data;
}

export class QuestionsController {
    // Create single question
    public async CreateQuestion(req: Request, res: Response) {
        const data = validateQuestionParams(req, res);
        if (!data) return;

        try {
            // Check if template exists
            const template = await TemplateRepository.findOne({
                where: { id: data.templateId }
            });

            if (!template) {
                return res.status(404).json({ message: "Template not found" });
            }

            // Check if thread hall exists (if provided)
            let threadHall = null;
            if (data.threadHallId) {
                threadHall = await ThreadHallRepository.findOne({
                    where: { id: data.threadHallId }
                });

                if (!threadHall) {
                    return res.status(404).json({ message: "Thread hall not found" });
                }
            }

            const newQuestion = new Questions();
            newQuestion.question = data.question;
            newQuestion.template = template;
            if (threadHall) {
                newQuestion.threadHall = threadHall;
            }

            const savedQuestion = await QuestionsRepository.save(newQuestion);

            return res.status(201).json({
                message: "Question created successfully",
                data: savedQuestion
            });
        } catch (e) {
            logger.error('Error creating question', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Create multiple questions at once - for frontend batch upload
    public async CreateBatchQuestions(req: Request, res: Response) {
        const data = validateBatchQuestionParams(req, res);
        if (!data) return;

        try {
            const createdQuestions: Questions[] = [];
            const errors: string[] = [];

            for (let i = 0; i < data.questions.length; i++) {
                const questionData = data.questions[i];

                try {
                    // Check if template exists
                    const template = await TemplateRepository.findOne({
                        where: { id: questionData.templateId }
                    });

                    if (!template) {
                        errors.push(`Question ${i + 1}: Template not found`);
                        continue;
                    }

                    // Check if thread hall exists (if provided)
                    let threadHall = null;
                    if (questionData.threadHallId) {
                        threadHall = await ThreadHallRepository.findOne({
                            where: { id: questionData.threadHallId }
                        });

                        if (!threadHall) {
                            errors.push(`Question ${i + 1}: Thread hall not found`);
                            continue;
                        }
                    }

                    const question = new Questions();
                    question.question = questionData.question;
                    question.template = template;
                    if (threadHall) {
                        question.threadHall = threadHall;
                    }

                    createdQuestions.push(question);
                } catch (e) {
                    errors.push(`Question ${i + 1}: ${(e as Error).message}`);
                }
            }

            if (createdQuestions.length === 0) {
                return res.status(400).json({
                    message: "No valid questions to create",
                    errors: errors
                });
            }

            const savedQuestions = await QuestionsRepository.save(createdQuestions);

            const response: any = {
                message: `${savedQuestions.length} questions created successfully`,
                data: savedQuestions,
                count: savedQuestions.length
            };

            if (errors.length > 0) {
                response.warnings = errors;
                response.message = `${savedQuestions.length} questions created successfully with ${errors.length} errors`;
            }

            return res.status(201).json(response);
        } catch (e) {
            logger.error('Error creating batch questions', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Get all questions
    public async GetQuestions(req: Request, res: Response) {
        try {
            const questions = await QuestionsRepository.find({
                relations: ['template', 'threadHall', 'userAnswers'],
                order: { createdAt: 'DESC' }
            });

            return res.status(200).json({
                message: "Questions retrieved successfully",
                data: questions,
                count: questions.length
            });
        } catch (e) {
            logger.error('Error fetching questions', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Get question by ID
    public async GetQuestionById(req: Request, res: Response) {
        const parsed = QuestionIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Question ID validation error', undefined, { details: parsed.error });
            return res.status(400).json({
                message: "Invalid question ID format",
                errors: parsed.error.format()
            });
        }

        const questionId = parsed.data.id;

        try {
            const question = await QuestionsRepository.findOne({
                where: { id: questionId },
                relations: ['template', 'threadHall', 'userAnswers']
            });

            if (!question) {
                return res.status(404).json({ message: "Question not found" });
            }

            return res.status(200).json({
                message: "Question found",
                data: question
            });
        } catch (e) {
            logger.error('Error fetching question', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Update question
    public async UpdateQuestion(req: Request, res: Response) {
        const parsed = QuestionIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Question ID validation error', undefined, { details: parsed.error });
            return res.status(400).json({
                message: "Invalid question ID format",
                errors: parsed.error.format()
            });
        }

        const data = validateQuestionUpdateParams(req, res);
        if (!data) return;

        const questionId = parsed.data.id;

        try {
            const question = await QuestionsRepository.findOne({
                where: { id: questionId }
            });

            if (!question) {
                return res.status(404).json({ message: "Question not found" });
            }

            // Update question text if provided
            if (data.question !== undefined) {
                question.question = data.question;
            }

            // Update template if provided
            if (data.templateId !== undefined) {
                const template = await TemplateRepository.findOne({
                    where: { id: data.templateId }
                });

                if (!template) {
                    return res.status(404).json({ message: "Template not found" });
                }

                question.template = template;
            }

            // Update thread hall if provided
            if (data.threadHallId !== undefined) {
                const threadHall = await ThreadHallRepository.findOne({
                    where: { id: data.threadHallId }
                });

                if (!threadHall) {
                    return res.status(404).json({ message: "Thread hall not found" });
                }

                question.threadHall = threadHall;
            }

            const updatedQuestion = await QuestionsRepository.save(question);

            return res.status(200).json({
                message: "Question updated successfully",
                data: updatedQuestion
            });
        } catch (e) {
            logger.error('Error updating question', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Delete question
    public async DeleteQuestion(req: Request, res: Response) {
        const parsed = QuestionIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Question ID validation error', undefined, { details: parsed.error });
            return res.status(400).json({
                message: "Invalid question ID format",
                errors: parsed.error.format()
            });
        }

        const questionId = parsed.data.id;

        try {
            const question = await QuestionsRepository.findOne({
                where: { id: questionId }
            });

            if (!question) {
                return res.status(404).json({ message: "Question not found" });
            }

            await QuestionsRepository.delete(questionId);

            return res.status(200).json({
                message: "Question deleted successfully",
                data: question
            });
        } catch (e) {
            logger.error('Error deleting question', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Get questions by template ID
    public async GetQuestionsByTemplate(req: Request, res: Response) {
        const { templateId } = req.params;

        if (!templateId) {
            return res.status(400).json({ message: "Template ID is required" });
        }

        try {
            const questions = await QuestionsRepository.find({
                where: { template: { id: templateId } },
                relations: ['template', 'threadHall'],
                order: { createdAt: 'DESC' }
            });

            return res.status(200).json({
                message: `Questions for template retrieved successfully`,
                data: questions,
                count: questions.length
            });
        } catch (e) {
            logger.error('Error fetching questions by template', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Get questions by thread hall ID
    public async GetQuestionsByThreadHall(req: Request, res: Response) {
        const { threadHallId } = req.params;

        if (!threadHallId) {
            return res.status(400).json({ message: "Thread hall ID is required" });
        }

        try {
            const questions = await QuestionsRepository.find({
                where: { threadHall: { id: threadHallId } },
                relations: ['template', 'threadHall'],
                order: { createdAt: 'DESC' }
            });

            return res.status(200).json({
                message: `Questions for thread hall retrieved successfully`,
                data: questions,
                count: questions.length
            });
        } catch (e) {
            logger.error('Error fetching questions by thread hall', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Get questions for client - returns predefined format
    public async getQuestionsForClient(req: Request, res: Response) {
        try {
            // Return the exact format you requested
            const questionsForClient = {
                "O": {
                    "frequency": [
                        {
                            "template_id": "O_F_001",
                            "sentence": "Bạn có thường {behavior} không?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["rất ít khi", "thỉnh thoảng", "thường xuyên", "gần như mọi lúc"],
                            "ocean": "O"
                        },
                        {
                            "template_id": "O_F_002",
                            "sentence": "Trong cuộc sống hàng ngày, bạn {behavior} với tần suất thế nào?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["hiếm khi", "đôi khi", "thường xuyên", "rất thường xuyên"],
                            "ocean": "O"
                        }
                    ],
                    "yesno": [
                        {
                            "template_id": "O_YN_001",
                            "sentence": "Bạn có thích {behavior} không?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["Có", "Không"],
                            "ocean": "O"
                        },
                        {
                            "template_id": "O_YN_002",
                            "sentence": "Bạn có hứng thú với việc {behavior} không?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["Có", "Không"],
                            "ocean": "O"
                        }
                    ]
                },
                "C": {
                    "frequency": [
                        {
                            "template_id": "C_F_001",
                            "sentence": "Bạn có thường {behavior} khi làm việc không?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["rất ít khi", "thỉnh thoảng", "thường xuyên", "gần như mọi lúc"],
                            "ocean": "C"
                        },
                        {
                            "template_id": "C_F_002",
                            "sentence": "Mỗi khi có nhiệm vụ quan trọng, bạn {behavior} như thế nào?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["hiếm khi", "đôi khi", "thường xuyên", "luôn luôn"],
                            "ocean": "C"
                        }
                    ],
                    "yesno": [
                        {
                            "template_id": "C_YN_001",
                            "sentence": "Bạn có thường chú ý đến chi tiết khi {behavior} không?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["Có", "Không"],
                            "ocean": "C"
                        },
                        {
                            "template_id": "C_YN_002",
                            "sentence": "Bạn có cho rằng mình đáng tin cậy khi {behavior} không?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["Có", "Không"],
                            "ocean": "C"
                        }
                    ]
                },
                "E": {
                    "frequency": [
                        {
                            "template_id": "E_F_001",
                            "sentence": "Bạn có thường {behavior} không?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["rất ít khi", "thỉnh thoảng", "thường xuyên", "gần như mọi lúc"],
                            "ocean": "E"
                        },
                        {
                            "template_id": "E_F_002",
                            "sentence": "Trong một tuần điển hình, bạn {behavior} bao nhiêu lần?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["0 lần", "1–2 lần", "3–5 lần", "hơn 5 lần"],
                            "ocean": "E"
                        }
                    ],
                    "yesno": [
                        {
                            "template_id": "E_YN_001",
                            "sentence": "Bạn có thích {behavior} không?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["Có", "Không"],
                            "ocean": "E"
                        }
                    ]
                },
                "A": {
                    "frequency": [
                        {
                            "template_id": "A_F_001",
                            "sentence": "Bạn có thường {behavior} không?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["rất ít khi", "thỉnh thoảng", "thường xuyên", "gần như mọi lúc"],
                            "ocean": "A"
                        }
                    ],
                    "yesno": [
                        {
                            "template_id": "A_YN_001",
                            "sentence": "Bạn có dễ dàng {behavior} không?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["Có", "Không"],
                            "ocean": "A"
                        }
                    ]
                },
                "N": {
                    "frequency": [
                        {
                            "template_id": "N_F_001",
                            "sentence": "Bạn có thường {behavior} không?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["rất ít khi", "thỉnh thoảng", "thường xuyên", "gần như mọi lúc"],
                            "ocean": "N"
                        }
                    ],
                    "yesno": [
                        {
                            "template_id": "N_YN_001",
                            "sentence": "Bạn có cảm thấy lo lắng khi {behavior} không?",
                            "slot": "behavior",
                            "value_behavior": [],
                            "value_slot": ["Có", "Không"],
                            "ocean": "N"
                        }
                    ]
                }
            };

            return res.status(200).json(questionsForClient);
        } catch (e) {
            logger.error('Error fetching questions for client', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Get random questions from database in specific format
    public async getRandomQuestionsForClient(req: Request, res: Response) {
        try {
            // Get limit from query params, default 10, max 10
            const limit = Math.min(parseInt(req.query.limit as string) || 10, 10);

            // Fetch random questions with templates and options from database
            const questions = await QuestionsRepository.createQueryBuilder('question')
                .leftJoinAndSelect('question.template', 'template')
                .leftJoinAndSelect('question.questionOptions', 'options')
                .orderBy('RANDOM()') // PostgreSQL random function
                .limit(limit)
                .getMany();

            if (questions.length === 0) {
                return res.status(200).json({});
            }

            // Group questions by ocean trait and question type
            const groupedQuestions: any = {};

            for (const question of questions) {
                const ocean = question.template?.trait || 'O';
                const qtype = question.template?.questionType || 'frequency';

                // Initialize ocean group if not exists
                if (!groupedQuestions[ocean]) {
                    groupedQuestions[ocean] = {};
                }

                // Initialize question type group if not exists
                if (!groupedQuestions[ocean][qtype]) {
                    groupedQuestions[ocean][qtype] = [];
                }

                // Extract slot from template text (find text between {})
                const slotMatch = question.template?.text?.match(/{(\w+)}/);
                const slot = slotMatch ? slotMatch[1] : 'behavior';

                // Get question options values, sorted by order
                const optionValues = question.questionOptions
                    ?.sort((a, b) => a.order - b.order)
                    ?.map(option => option.value) || [];

                // Create question object in the format you specified
                const questionObj = {
                    template_id: question.templateId || `${ocean}_${qtype.toUpperCase().substring(0, 2)}_${String(groupedQuestions[ocean][qtype].length + 1).padStart(3, '0')}`,
                    sentence: question.question,
                    slot: slot,
                    value_behavior: [], // Empty array as specified in your format
                    value_slot: optionValues,
                    ocean: ocean
                };

                groupedQuestions[ocean][qtype].push(questionObj);
            }

            return res.status(200).json(groupedQuestions);
        } catch (e) {
            logger.error('Error fetching random questions from database', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}

export default new QuestionsController();
