import { Request, Response } from 'express';
import { z } from 'zod';
import AppDataSource from '../infrastructure/database';
import { Questions } from '../entity/questions';
import { QuestionOptions } from '../entity/question_options';
import { Template } from '../entity/templates';
import { ThreadHall } from '../entity/thread_halls';
import { Models } from '../entity/models';
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

// New schema for createQuestions API
const AnswerSchema = z.object({
    type: z.string(),
    scale: z.array(z.number()).optional(),
    labels: z.array(z.string()).optional(),
    options: z.array(z.string()).optional(),
});

const QuestionFromPayloadSchema = z.object({
    id: z.string(),
    name: z.string(),
    intent: z.string(),
    question_type: z.string(),
    filled_prompt: z.string(),
    answer: AnswerSchema,
    modelId: z.string().uuid().optional(),
    trait: z.string().max(1).optional(), // O, C, E, A, N
});

const CreateQuestionsRequestSchema = z.object({
    questions: z.array(QuestionFromPayloadSchema).min(1, "At least one question is required")
});

const QuestionsRepository = AppDataSource.getRepository(Questions);
const QuestionOptionsRepository = AppDataSource.getRepository(QuestionOptions);
const TemplateRepository = AppDataSource.getRepository(Template);
const ThreadHallRepository = AppDataSource.getRepository(ThreadHall);
const ModelsRepository = AppDataSource.getRepository(Models);

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

function validateCreateQuestionsParams(req: Request, res: Response) {
    const parsed = CreateQuestionsRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Create questions validation error', undefined, { details: parsed.error });
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

    // Create multiple questions from direct payload
    public async createQuestions(req: Request, res: Response) {
        const data = validateCreateQuestionsParams(req, res);
        if (!data) return;

        try {
            const savedQuestions = [];
            const errors: string[] = [];

            // Process each question from the payload
            for (let i = 0; i < data.questions.length; i++) {
                const questionData = data.questions[i];

                try {
                    // Check if the exact same question text already exists (to prevent true duplicates)
                    const existedQuestion = await QuestionsRepository.findOne({
                        where: {
                            question: questionData.filled_prompt,
                            templateId: questionData.id
                        },
                        relations: ["questionOptions", "model"]
                    });

                    if (!existedQuestion) {
                        // Validate and get model if modelId is provided
                        let model = null;
                        if (questionData.modelId) {
                            model = await ModelsRepository.findOne({
                                where: { id: questionData.modelId }
                            });
                            if (!model) {
                                errors.push(`Question ${i + 1}: Model with ID ${questionData.modelId} not found, proceeding without model`);
                            }
                        }

                        // Extract trait from intent if not provided (e.g., "O_F_001" -> "O")
                        let trait = questionData.trait;
                        if (!trait && questionData.intent) {
                            const match = questionData.intent.match(/^([OCEAN])/i);
                            if (match) {
                                trait = match[1].toUpperCase();
                            }
                        }

                        // Create new question with modelId and trait
                        const newQuestion = QuestionsRepository.create({
                            question: questionData.filled_prompt,
                            templateId: questionData.id,
                            behaviorInput: questionData.name,
                            behaviorNormalized: questionData.intent,
                            trait: trait,
                            model: model || undefined
                        });

                        const savedQuestion = await QuestionsRepository.save(newQuestion);

                        // Create question options based on answer type
                        const questionOptions = [];

                        if (questionData.answer.type === 'scale' && questionData.answer.labels) {
                            // For scale type with labels
                            for (let j = 0; j < questionData.answer.labels.length; j++) {
                                const option = QuestionOptionsRepository.create({
                                    question: savedQuestion,
                                    text: questionData.answer.labels[j],
                                    value: questionData.answer.scale ? questionData.answer.scale[j].toString() : (j + 1).toString(),
                                    order: j
                                });
                                questionOptions.push(option);
                            }
                        } else if (questionData.answer.type === 'binary' && questionData.answer.options) {
                            // For binary type with options
                            for (let j = 0; j < questionData.answer.options.length; j++) {
                                const option = QuestionOptionsRepository.create({
                                    question: savedQuestion,
                                    text: questionData.answer.options[j],
                                    value: j.toString(),
                                    order: j
                                });
                                questionOptions.push(option);
                            }
                        }

                        if (questionOptions.length > 0) {
                            await QuestionOptionsRepository.save(questionOptions);
                        }

                        // Reload question with options and model
                        const questionWithOptions = await QuestionsRepository.findOne({
                            where: { id: savedQuestion.id },
                            relations: ["questionOptions", "model"]
                        });

                        savedQuestions.push(questionWithOptions);
                        logger.info(`Question created with trait: ${trait}, modelId: ${model?.id || 'none'}`);
                    } else {
                        // Exact duplicate question exists, skip
                        savedQuestions.push(existedQuestion);
                        errors.push(`Question with text "${questionData.filled_prompt}" and template ${questionData.id} already exists, skipped creation`);
                    }
                } catch (e) {
                    errors.push(`Question ${i + 1} (${questionData.id}): ${(e as Error).message}`);
                    logger.error(`Error processing question ${questionData.id}`, e as Error);
                }
            }

            if (savedQuestions.length === 0) {
                return res.status(400).json({
                    message: "No questions were created",
                    errors: errors
                });
            }

            const response: any = {
                message: `${savedQuestions.length} questions processed successfully`,
                count: savedQuestions.length,
                data: savedQuestions
            };

            if (errors.length > 0) {
                response.warnings = errors;
                response.message = `${savedQuestions.length} questions processed with ${errors.length} warnings`;
            }

            return res.status(200).json(response);
        } catch (e) {
            logger.error("Error creating questions", e as Error);
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
            // Get limit from query params, default 10, max 50
            const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

            // Fetch random questions with templates and options from database
            const questions = await QuestionsRepository.createQueryBuilder('question')
                .leftJoinAndSelect('question.template', 'template')
                .leftJoinAndSelect('question.questionOptions', 'options')
                .orderBy('RANDOM()') // PostgreSQL random function
                .limit(limit)
                .getMany();

            if (questions.length === 0) {
                return res.status(200).json({
                    message: "No questions found",
                    data: [],
                    count: 0
                });
            }

            // Group questions by ocean trait and question type
            const groupedQuestions: any = {};

            for (const question of questions) {
                // Extract ocean from template intent or use default
                const ocean = question.template?.intent?.charAt(0)?.toUpperCase() || 'O';
                const qtype = question.template?.question_type || 'frequency';

                // Initialize ocean group if not exists
                if (!groupedQuestions[ocean]) {
                    groupedQuestions[ocean] = {};
                }

                // Initialize question type group if not exists
                if (!groupedQuestions[ocean][qtype]) {
                    groupedQuestions[ocean][qtype] = [];
                }

                // Extract slot from template prompt (find text between {})
                const slotMatch = question.template?.prompt?.match(/{(\w+)}/);
                const slot = slotMatch ? slotMatch[1] : 'behavior';

                // Get question options values, sorted by order
                const optionValues = question.questionOptions
                    ?.sort((a, b) => a.order - b.order)
                    ?.map(option => option.text) || [];

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

            return res.status(200).json({
                message: "Random questions retrieved successfully",
                data: groupedQuestions,
                count: questions.length
            });
        } catch (e) {
            logger.error('Error fetching random questions from database', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Get simple random questions - simpler format for general use
    public async getRandomQuestions(req: Request, res: Response) {
        try {
            // Get limit from query params, default 10, max 50
            const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

            // Fetch random questions with templates and options from database
            const questions = await QuestionsRepository.createQueryBuilder('question')
                .leftJoinAndSelect('question.template', 'template')
                .leftJoinAndSelect('question.questionOptions', 'options')
                .orderBy('RANDOM()') // PostgreSQL random function
                .limit(limit)
                .getMany();

            if (questions.length === 0) {
                return res.status(200).json({
                    message: "No questions found",
                    data: [],
                    count: 0
                });
            }

            // Transform questions to a simpler format
            const transformedQuestions = questions.map(question => {
                // Get question options sorted by order
                const options = question.questionOptions
                    ?.sort((a, b) => a.order - b.order)
                    ?.map(option => ({
                        text: option.text,
                        value: option.value,
                        order: option.order
                    })) || [];

                return {
                    id: question.id,
                    question: question.question,
                    templateId: question.templateId,
                    behaviorInput: question.behaviorInput,
                    behaviorNormalized: question.behaviorNormalized,
                    template: {
                        id: question.template?.id,
                        name: question.template?.name,
                        description: question.template?.description,
                        intent: question.template?.intent,
                        question_type: question.template?.question_type
                    },
                    options: options,
                    createdAt: question.createdAt,
                    updatedAt: question.updatedAt
                };
            });

            return res.status(200).json({
                message: "Random questions retrieved successfully",
                data: transformedQuestions,
                count: transformedQuestions.length
            });
        } catch (e) {
            logger.error('Error fetching random questions', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }

    // Get survey questions based on user's location and age
    public async getSurveyQuestions(req: Request, res: Response) {
        try {
            if (!req.user || !req.user.userId) {
                return res.status(401).json({ message: "Unauthorized" });
            }

            const userId = req.user.userId;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

            // Import User entity and get user information
            const { User } = await import('../entity/user');
            const userRepository = AppDataSource.getRepository(User);
            const user = await userRepository.findOne({
                where: { id: userId },
                select: ['id', 'location', 'dateOfBirth', 'fullName']
            });

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Calculate user's age
            const currentDate = new Date();
            const birthDate = new Date(user.dateOfBirth);
            let age = currentDate.getFullYear() - birthDate.getFullYear();
            const monthDiff = currentDate.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
                age--;
            }

            const userLocation = user.location || '';
            const userAge = age;

            if (!userLocation.trim() && (!userAge || userAge <= 0)) {
                return res.status(200).json({
                    message: "No filtering criteria available - user has no location or valid age",
                    data: [],
                    count: 0,
                    userInfo: {
                        userId: userId,
                        location: userLocation,
                        age: userAge,
                        filteredCount: 0,
                        randomCount: 0
                    }
                });
            }

            // Query questions with location or age matching - ONLY filtered results
            const queryBuilder = QuestionsRepository.createQueryBuilder('question')
                .leftJoinAndSelect('question.template', 'template')
                .leftJoinAndSelect('template.model', 'model')
                .leftJoinAndSelect('question.model', 'questionModel')
                .leftJoinAndSelect('question.questionOptions', 'options')
                .orderBy('options.order', 'ASC'); // Ensure options are ordered correctly

            const conditions = [];

            // Add location filter - questions containing user's location
            if (userLocation.trim()) {
                conditions.push(
                    `(LOWER(question.question) LIKE LOWER(:location) OR LOWER(template.prompt) LIKE LOWER(:locationPrompt) OR LOWER(template.filled_prompt) LIKE LOWER(:locationFilled))`
                );
            }

            // Add age filter - questions containing user's age
            if (userAge && userAge > 0) {
                const ageConditions = [
                    `question.question LIKE '%${userAge}%'`,
                    `template.prompt LIKE '%${userAge}%'`,
                    `template.filled_prompt LIKE '%${userAge}%'`
                ];

                // Also check for age ranges (e.g., 30-40, 20s, etc.)
                const ageRange = Math.floor(userAge / 10) * 10; // e.g., 30 for ages 30-39
                ageConditions.push(
                    `question.question LIKE '%${ageRange}%'`,
                    `template.prompt LIKE '%${ageRange}%'`,
                    `template.filled_prompt LIKE '%${ageRange}%'`
                );

                // Check for age group terms in Vietnamese
                if (userAge >= 18 && userAge <= 25) {
                    ageConditions.push(
                        `LOWER(question.question) LIKE '%tuổi trẻ%'`,
                        `LOWER(question.question) LIKE '%thanh niên%'`,
                        `LOWER(template.prompt) LIKE '%tuổi trẻ%'`,
                        `LOWER(template.prompt) LIKE '%thanh niên%'`,
                        `LOWER(template.filled_prompt) LIKE '%tuổi trẻ%'`,
                        `LOWER(template.filled_prompt) LIKE '%thanh niên%'`
                    );
                } else if (userAge >= 26 && userAge <= 40) {
                    ageConditions.push(
                        `LOWER(question.question) LIKE '%trung niên%'`,
                        `LOWER(question.question) LIKE '%người lớn%'`,
                        `LOWER(template.prompt) LIKE '%trung niên%'`,
                        `LOWER(template.prompt) LIKE '%người lớn%'`,
                        `LOWER(template.filled_prompt) LIKE '%trung niên%'`,
                        `LOWER(template.filled_prompt) LIKE '%người lớn%'`
                    );
                } else if (userAge > 40) {
                    ageConditions.push(
                        `LOWER(question.question) LIKE '%trung niên%'`,
                        `LOWER(question.question) LIKE '%người già%'`,
                        `LOWER(template.prompt) LIKE '%trung niên%'`,
                        `LOWER(template.prompt) LIKE '%người già%'`,
                        `LOWER(template.filled_prompt) LIKE '%trung niên%'`,
                        `LOWER(template.filled_prompt) LIKE '%người già%'`
                    );
                }

                conditions.push(`(${ageConditions.join(' OR ')})`);
            }

            // If no conditions, return empty result
            if (conditions.length === 0) {
                return res.status(200).json({
                    message: "No filtering criteria available",
                    data: [],
                    count: 0,
                    userInfo: {
                        userId: userId,
                        location: userLocation,
                        age: userAge,
                        filteredCount: 0,
                        randomCount: 0
                    }
                });
            }

            // Apply filters with OR condition (questions matching location OR age)
            queryBuilder.where(`(${conditions.join(' OR ')})`, {
                location: `%${userLocation.toLowerCase()}%`,
                locationPrompt: `%${userLocation.toLowerCase()}%`,
                locationFilled: `%${userLocation.toLowerCase()}%`
            });

            // Get ONLY filtered questions - NO random fallback
            const filteredQuestions = await queryBuilder
                .orderBy('RANDOM()')
                .addOrderBy('options.order', 'ASC')
                .limit(limit)
                .getMany();

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
                // Priority 1: question.trait
                if (question.trait) {
                    return question.trait.toUpperCase();
                }

                // Priority 2: template.trait
                if (question.template?.trait) {
                    return question.template.trait.toUpperCase();
                }

                // Priority 3: Extract from template.intent (e.g., "O_F_001" -> "O")
                if (question.template?.intent) {
                    const match = question.template.intent.match(/^([OCEAN])/i);
                    if (match) {
                        return match[1].toUpperCase();
                    }
                }

                // Priority 4: Extract from model.ocean
                const model = question.model || question.template?.model;
                if (model?.ocean) {
                    const match = model.ocean.match(/^([OCEAN])/i);
                    if (match) {
                        return match[1].toUpperCase();
                    }
                }

                return null;
            };

            // Transform questions to response format with fallback options
            const transformedQuestions = filteredQuestions.map(question => {
                let options = question.questionOptions
                    ?.sort((a, b) => a.order - b.order)
                    ?.map(option => ({
                        text: option.text,
                        value: option.value,
                        order: option.order
                    })) || [];

                // If no options found or incomplete options, generate default ones
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
                        logger.warn(`Generated default options for question ${question.id} with type ${questionType}`);
                    }
                }

                // Get model data (prefer question's model, fallback to template's model)
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
                    template: {
                        id: question.template?.id,
                        name: question.template?.name,
                        description: question.template?.description,
                        intent: question.template?.intent,
                        question_type: question.template?.question_type
                    },
                    options: options,
                    createdAt: question.createdAt,
                    updatedAt: question.updatedAt
                };
            });

            // Filter out questions that still have no options after fallback
            const validQuestions = transformedQuestions.filter(q => q.options.length > 0);

            return res.status(200).json({
                message: validQuestions.length > 0
                    ? "Survey questions retrieved successfully"
                    : "No questions found matching user's location or age",
                data: validQuestions,
                count: validQuestions.length,
                userInfo: {
                    userId: userId,
                    location: userLocation,
                    age: userAge,
                    filteredCount: filteredQuestions.length,
                    validCount: validQuestions.length,
                    randomCount: 0  // No random questions added
                }
            });
        } catch (e) {
            logger.error('Error fetching survey questions', e as Error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}

export default new QuestionsController();
