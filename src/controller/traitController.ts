import {Request, Response} from 'express';
import {z} from 'zod';
import AppDataSource from '../infrastructure/database';
import {Traits} from '../entity/traits';
import {logger} from '../infrastructure/logger';

const TraitSchema = z.object({
    name: z.string(),
    description: z.string(),
    label: z.string(),
});

const TraitIdSchema = z.object({
    id: z.string().uuid(),
});

const TraitRepository = AppDataSource.getRepository(Traits);

function validateTraitParams(req: Request, res: Response) {
    const parsed = TraitSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, { details: parsed.error });
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

class TraitController {
    public async createTrait(req: Request, res: Response) {
        const data = validateTraitParams(req, res);
        if (!data) return;

        const trait = new Traits();
        trait.name = data.name;
        trait.description = data.description;
        trait.label = data.label;

        try {
            await TraitRepository.save(trait);
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        return res.status(201).json(trait);
    }

    public async updateTraitById(req: Request, res: Response) {
        const data = validateTraitParams(req, res);
        if (!data) return;

        const parsed = TraitIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const traiteId = parsed.data.id;
        let existedTrait;

        try {
            existedTrait = await TraitRepository.findOne({
                where: { id: traiteId}
            });
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }
        if (!existedTrait) {
            return res.status(404).json({ error: 'Trait not found' });
        }

        existedTrait.name = data.name;
        existedTrait.description = data.description;
        existedTrait.label = data.label;

        try {
            await TraitRepository.save(existedTrait);
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        return res.status(200).json(existedTrait);
    }

    public async getTraitById(req: Request, res: Response) {
        const parsed = TraitIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const traitId = parsed.data.id;
        let trait;

        try {
            trait = await TraitRepository.findOne({
                where: { id: traitId }
            });
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        if (!trait) {
            return res.status(404).json({ error: 'Trait not found' });
        }

        return res.status(200).json(trait);
    }

    public async deleteTraitById(req: Request, res: Response) {
        const parsed = TraitIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const traitId = parsed.data.id;
        let trait;

        try {
            trait = await TraitRepository.findOne({
                where: { id: traitId }
            });
        } catch (e) {
            return res.status(500).json({ error: 'Database error occurred while finding the trait.' });
        }

        if (!trait) {
            return res.status(404).json({ error: 'Trait not found' });
        }

        try {
            await TraitRepository.delete(traitId);
        } catch (e) {
            return res.status(500).json({ error: 'Database error occurred while deleting the trait.' });
        }

        return res.status(200).json(trait);
    }
}

export default new TraitController();