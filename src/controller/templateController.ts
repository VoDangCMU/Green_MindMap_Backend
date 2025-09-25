import { Request, Response } from 'express';
import { z } from 'zod';
import AppDataSource from '../infrastructure/database';
import { Template } from '../entity/templates';
import { Questions } from '../entity/questions';
import { QuestionOptions } from '../entity/question_options';
import { logger } from '../infrastructure/logger';

const TemplateSchema = z.object({
    text: z.string().min(1, "Template text is required"),
    placeholder: z.array(z.string()).optional().default([]),
    questionType: z.string().min(1, "Question type is required"),
});

const TemplateUpdateSchema = z.object({
    text: z.string().min(1, "Template text is required").optional(),
    placeholder: z.array(z.string()).optional(),
    questionType: z.string().min(1, "Question type is required").optional(),
});

const TemplateIdSchema = z.object({
    id: z.string().uuid(),
});

// Batch template creation schema
const BatchTemplateSchema = z.object({
    templates: z.array(TemplateSchema).min(1, "At least one template is required")
});

// Schema for the complex request format
const ComplexTemplateRequestSchema = z.object({
    total_templates: z.number(),
    items: z.array(z.object({
        ocean: z.string(), // Big Five trait (O, C, E, A, N)
        template_id: z.string(),
        question: z.string(),
        options: z.array(z.object({
            text: z.string(),
            value: z.string()
        })),
        behavior_input: z.string(),
        behavior_normalized: z.string(),
        normalize_score: z.number(),
        qtype: z.string() // frequency, yesno, etc.
    }))
});

const TemplateRepository = AppDataSource.getRepository(Template);
const QuestionsRepository = AppDataSource.getRepository(Questions);
const QuestionOptionsRepository = AppDataSource.getRepository(QuestionOptions);

function validateTemplateParams(req: Request, res: Response) {
    const parsed = TemplateSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, {
            details: parsed.error,
        });
        res.status(400).json({
            message: "Validation error",
            errors: parsed.error.format()
        });
        return null;
    }
    return parsed.data;
}

function validateBatchTemplateParams(req: Request, res: Response) {
    const parsed = BatchTemplateSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Batch template validation error', undefined, {
            details: parsed.error,
        });
        res.status(400).json({
            message: "Validation error",
            errors: parsed.error.format()
        });
        return null;
    }
    return parsed.data;
}

function validateTemplateUpdateParams(req: Request, res: Response) {
    const parsed = TemplateUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Template update validation error', undefined, {
            details: parsed.error,
        });
        res.status(400).json({
            message: "Validation error",
            errors: parsed.error.format()
        });
        return null;
    }
    return parsed.data;
}

function validateComplexTemplateRequest(req: Request, res: Response) {
    const parsed = ComplexTemplateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Complex template validation error', undefined, {
            details: parsed.error,
        });
        res.status(400).json({
            message: "Validation error",
            errors: parsed.error.format()
        });
        return null;
    }
    return parsed.data;
}

class TemplateController {
    // Create single template
    public async createTemplate(req: Request, res: Response) {
        const data = validateTemplateParams(req, res);
        if (!data) return;

        try {
            const createdTemplate = new Template();
            createdTemplate.text = data.text;
            createdTemplate.placeholder = data.placeholder;
            createdTemplate.questionType = data.questionType;

            const savedTemplate = await TemplateRepository.save(createdTemplate);

            return res.status(201).json({
                message: "Template created successfully",
                data: savedTemplate
            });
        } catch (e) {
            logger.error('Error creating template', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    // Create multiple templates at once - for frontend batch upload
    public async createBatchTemplates(req: Request, res: Response) {
        const data = validateBatchTemplateParams(req, res);
        if (!data) return;

        try {
            const createdTemplates: Template[] = [];

            for (const templateData of data.templates) {
                const template = new Template();
                template.text = templateData.text;
                template.placeholder = templateData.placeholder;
                template.questionType = templateData.questionType;
                createdTemplates.push(template);
            }

            const savedTemplates = await TemplateRepository.save(createdTemplates);

            return res.status(201).json({
                message: `${savedTemplates.length} templates created successfully`,
                data: savedTemplates,
                count: savedTemplates.length
            });
        } catch (e) {
            logger.error('Error creating batch templates', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    // Get all templates
    public async getAllTemplates(req: Request, res: Response) {
        try {
            const templates = await TemplateRepository.find({
                relations: ['questions'],
                order: { createdAt: 'DESC' }
            });

            return res.status(200).json({
                message: "Templates retrieved successfully",
                data: templates,
                count: templates.length
            });
        } catch (e) {
            logger.error('Error fetching templates', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    // Get template by ID
    public async getTemplateById(req: Request, res: Response) {
        const parsed = TemplateIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json({
                message: "Invalid template ID format",
                errors: parsed.error.format()
            });
        }

        const templateId = parsed.data.id;

        try {
            const template = await TemplateRepository.findOne({
                where: { id: templateId },
                relations: ['questions']
            });

            if (!template) {
                return res.status(404).json({ message: 'Template not found' });
            }

            return res.status(200).json({
                message: "Template found",
                data: template
            });
        } catch (e) {
            logger.error('Error fetching template', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    // Update template by ID
    public async updateTemplateById(req: Request, res: Response) {
        const parsed = TemplateIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json({
                message: "Invalid template ID format",
                errors: parsed.error.format()
            });
        }

        const data = validateTemplateUpdateParams(req, res);
        if (!data) return;

        const templateId = parsed.data.id;

        try {
            const existedTemplate = await TemplateRepository.findOne({
                where: { id: templateId }
            });

            if (!existedTemplate) {
                return res.status(404).json({ message: 'Template not found' });
            }

            // Update only provided fields
            if (data.text !== undefined) existedTemplate.text = data.text;
            if (data.placeholder !== undefined) existedTemplate.placeholder = data.placeholder;
            if (data.questionType !== undefined) existedTemplate.questionType = data.questionType;

            const updatedTemplate = await TemplateRepository.save(existedTemplate);

            return res.status(200).json({
                message: "Template updated successfully",
                data: updatedTemplate
            });
        } catch (e) {
            logger.error('Error updating template', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    // Delete template by ID
    public async deleteTemplateById(req: Request, res: Response) {
        const parsed = TemplateIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json({
                message: "Invalid template ID format",
                errors: parsed.error.format()
            });
        }

        const templateId = parsed.data.id;

        try {
            const template = await TemplateRepository.findOne({
                where: { id: templateId }
            });

            if (!template) {
                return res.status(404).json({ message: 'Template not found' });
            }

            await TemplateRepository.delete(templateId);

            return res.status(200).json({
                message: 'Template deleted successfully',
                data: template
            });
        } catch (e) {
            logger.error('Error deleting template', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    // Get templates by question type
    public async getTemplatesByType(req: Request, res: Response) {
        const { questionType } = req.params;

        if (!questionType) {
            return res.status(400).json({ message: "Question type is required" });
        }

        try {
            const templates = await TemplateRepository.find({
                where: { questionType },
                relations: ['questions'],
                order: { createdAt: 'DESC' }
            });

            return res.status(200).json({
                message: `Templates for type '${questionType}' retrieved successfully`,
                data: templates,
                count: templates.length
            });
        } catch (e) {
            logger.error('Error fetching templates by type', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }

    // Process complex template request with questions - NEW METHOD
    public async processComplexTemplateRequest(req: Request, res: Response) {
        const data = validateComplexTemplateRequest(req, res);
        if (!data) return;

        try {
            const createdTemplates: Template[] = [];
            const createdQuestions: Questions[] = [];
            const createdOptions: QuestionOptions[] = [];
            const errors: string[] = [];

            // Process each item in the request
            for (let i = 0; i < data.items.length; i++) {
                const item = data.items[i];

                try {
                    // Create template for this item
                    const template = new Template();
                    template.text = item.question;
                    template.trait = item.ocean; // Use ocean field as trait
                    template.placeholder = [item.behavior_normalized]; // Use normalized behavior as placeholder
                    template.questionType = item.qtype;

                    const savedTemplate = await TemplateRepository.save(template);
                    createdTemplates.push(savedTemplate);

                    // Create question linked to the template with additional data
                    const question = new Questions();
                    question.question = item.question;
                    question.template = savedTemplate;
                    question.templateId = item.template_id; // Store external template ID
                    question.behaviorInput = item.behavior_input;
                    question.behaviorNormalized = item.behavior_normalized;
                    question.normalizeScore = item.normalize_score;

                    const savedQuestion = await QuestionsRepository.save(question);
                    createdQuestions.push(savedQuestion);

                    // Create question options
                    for (let j = 0; j < item.options.length; j++) {
                        const optionData = item.options[j];

                        const option = new QuestionOptions();
                        option.question = savedQuestion;
                        option.text = optionData.text;
                        option.value = optionData.value;
                        option.order = j; // Set order based on array index

                        const savedOption = await QuestionOptionsRepository.save(option);
                        createdOptions.push(savedOption);
                    }

                } catch (e) {
                    errors.push(`Item ${i + 1} (${item.template_id}): ${(e as Error).message}`);
                    logger.error(`Error processing item ${i + 1}`, e as Error);
                }
            }

            const response: any = {
                message: `Successfully processed ${createdTemplates.length} templates, ${createdQuestions.length} questions, and ${createdOptions.length} options`,
                templates_created: createdTemplates.length,
                questions_created: createdQuestions.length,
                options_created: createdOptions.length,
                total_expected: data.total_templates,
                data: {
                    templates: createdTemplates,
                    questions: createdQuestions,
                    options: createdOptions
                }
            };

            if (errors.length > 0) {
                response.errors = errors;
                response.message = `Processed with ${errors.length} errors: ${response.message}`;
            }

            return res.status(201).json(response);

        } catch (e) {
            logger.error('Error processing complex template request', e as Error);
            res.status(500).json({ message: "Internal server error" });
            return;
        }
    }
}

export default new TemplateController();

