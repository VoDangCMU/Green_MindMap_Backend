import {Request, Response} from 'express';
import {z} from 'zod';
import AppDataSource from '../infrastructure/database';
import {Locations} from '../entity/locations';
import {User} from '../entity/user';
import { logger } from '../infrastructure/logger';
import TEXT from "../config/schemas/Text";
import NUMBER from "../config/schemas/Number";

const LocationSchema = z.object({
    userId: TEXT.uuid(),
    address: TEXT,
    longitude: NUMBER,
    latitude: NUMBER,
});

const LocationIdSchema = z.object({
    id: TEXT.uuid(),
});

const LocationRepository = AppDataSource.getRepository(Locations);
const UserRepository = AppDataSource.getRepository(User);

function validateLocationParams(req: Request, res: Response) {
    const parsed = LocationSchema.safeParse(req.body);
    if (!parsed.success) {
        logger.error('Zod validation error', undefined, {details: parsed.error});
        res.status(400).json(parsed.error);
        return null;
    }
    return parsed.data;
}

class LocationController {
    public async createLocation(req: Request, res: Response) {
        const data = validateLocationParams(req, res);
        if (!data) return;

        let existedUser;

        try {
            existedUser = await UserRepository.findOne({
                where: {id: data.userId}
            });
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }
        if (!existedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        const location = new Locations();
        location.latitude = data.latitude;
        location.longitude = data.longitude;
        location.address = data.address;

        try {
            await LocationRepository.save(location);
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        return res.status(201).json(location);
    }

    public async updateLocationById(req: Request, res: Response) {
        const data = validateLocationParams(req, res);
        if (!data) return;

        const parsed = LocationIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const locationId = parsed.data.id;
        let location;

        try {
            location = await LocationRepository.findOne({
                where: {id: locationId}
            });
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }

        location.latitude = data.latitude;
        location.longitude = data.longitude;
        location.address = data.address;

        try {
            await LocationRepository.save(location);
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        return res.status(200).json(location);
    }

    public async getLocationById(req: Request, res: Response) {
        const parsed = LocationIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const locationId = parsed.data.id;
        let location;

        try {
            location = await LocationRepository.findOne({
                where: {id: locationId}
            });
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }

        return res.status(200).json(location);
    }

    public async deleteLocationById(req: Request, res: Response) {
        const parsed = LocationIdSchema.safeParse(req.params);
        if (!parsed.success) {
            logger.error('Zod validation error', undefined, { details: parsed.error });
            return res.status(400).json(parsed.error);
        }

        const locationId = parsed.data.id;
        let location;

        try {
            location = await LocationRepository.findOne({
                where: {id: locationId}
            });
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        if (!location) {
            return res.status(404).json({ error: 'Location not found' });
        }

        try {
            await LocationRepository.delete(locationId);
        } catch (e) {
            res.status(500).json({ message: "Internal server error" });
            return;
        }

        return res.status(200).json(location);
    }

    public async GetLocations (req: Request, res: Response) {
        try {
             const locaions = await LocationRepository.find({
                order: {
                    address: "ASC"
                }
            })
            return res.status(200).json(locaions);
        } catch (e) {
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}

export default new LocationController();