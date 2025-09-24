import { Request, Response } from 'express';
import { z } from 'zod';
import AppDataSource from '../infrastructure/database';
import { Template } from '../entity/templates';
import { Questions } from '../entity/questions';
import { logger } from '@root/infrastructure/logger';

const TemplateSchema = z.object({
    text: z.string(),
    placeholders: z.array(z.string()).optional().default([]),
    answer_type: z.string(),
});

const TemplateIdSchema = z.object({
    id: z.string().uuid(),
});

const TemplateRepository = AppDataSource.getRepository(Template);
const QuestionRepository = AppDataSource.getRepository(Questions);

function validateTemplateParams(req: Request, res: Response) {
    const parsed = TemplateSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, {
            details: parsed.error,
        });
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

class TemplateController {
    public async createTemplate(req: Request, res: Response) {
        const data = validateTemplateParams(req, res);
        if (!data) return;

        const {text, placeholders, answer_type} = data;

        const createdTemplate = new Template();
        createdTemplate.text = text;
        createdTemplate.placeholder = placeholders;
        createdTemplate.answer_type = answer_type;

        try {
            await TemplateRepository.save(createdTemplate);
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        return res.status(201).json(createdTemplate);
    }

    public async updateTemplateById(req: Request, res: Response) {
        const parsed = TemplateIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            res.status(400).json(parsed.error);
            return;
        }

        const data = validateTemplateParams(req, res);
        if (!data) return;

        const templateId = parsed.data.id;

        let existedTemplate;

        try {
            existedTemplate = await TemplateRepository.findOne({
                where: { id: templateId }
            });
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }
        if (!existedTemplate) {
            return res.status(404).json({ message: 'Template not found' });
        }

        existedTemplate.text = data.text;
        existedTemplate.placeholder = data.placeholders;
        existedTemplate.answer_type = data.answer_type;

        try {
            await TemplateRepository.save(existedTemplate);
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        res.status(200).json(existedTemplate);
    }

    public async getTemplateById(req: Request, res: Response) {
        const parsed = TemplateIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            res.status(400).json(parsed.error);
            return;
        }

        const templateId = parsed.data.id;
        let template;

        try {
            template = await TemplateRepository.findOne({
                where: { id: templateId}
            });
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }

        return res.status(200).json(template);
    }

    public async deleteTemplateById(req: Request, res: Response) {
        const parsed = TemplateIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const templateId = parsed.data.id;
        let template;

        try {
            template = await TemplateRepository.findOne({
                where: { id: templateId }
            });
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        try {
            await TemplateRepository.delete(templateId);
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        return res.status(200).json(template);
    }
}

export default new TemplateController();