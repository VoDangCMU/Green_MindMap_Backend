import { Request, Response } from 'express';
import {Locations} from "@root/entity/locations";
import {User} from "@root/entity/user";
import AppDataSource from "@root/infrastructure/database";

const LocationRepository = AppDataSource.getRepository(Locations);
const UserRepository = AppDataSource.getRepository(User);

export class LocationController {
    private validateLocationData(locationData: any): boolean {
        if (!locationData) return false;
        const { user, address, latitude, longitude } = locationData;
        if (!user) return false;
        if (typeof address !== "string" || address.trim() === "") return false;
        if (typeof latitude !== "number" || Number.isNaN(latitude)) return false;
        if (typeof longitude !== "number" || Number.isNaN(longitude)) return false;
        return true;
    }

    public async create(req: Request, res: Response) {
        const locationData = req.body;

        if (!this.validateLocationData(locationData)) {
            return res.status(400).json({ message: "Invalid location data" });
        }

        try {
            const existedUser = await UserRepository.findOne({
                where: { id: locationData.user }
            });
            if (!existedUser) {
                return res.status(404).json({ message: `User with ID ${locationData.user} not found.` });
            }

            const createdLocation = new Locations();
            createdLocation.user = existedUser;
            createdLocation.address = locationData.address!;
            createdLocation.latitude = locationData.latitude!;
            createdLocation.longitude = locationData.longitude!;

            try {
                await LocationRepository.save(createdLocation);
            } catch (e) {
                return res.status(500).json({ message: "Internal server error" });
            }

            return res.status(201).json(createdLocation);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    }
}

export default new LocationController();
