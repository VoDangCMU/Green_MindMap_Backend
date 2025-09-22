import {RequestHandler, Request, Response} from "express";
import {z} from "zod";
import NUMBER from "@root/config/schemas/Number";
import {AppDataSource} from "@root/infrastructure/database";
import {Calories} from "@root/entity/calories";


const CaloriesParamsSchema = z.object({
    energy_kcal: NUMBER,
    protein_g: NUMBER,
    fat_g: NUMBER,
    carbs_g: NUMBER
})
const CaloriesRepo = AppDataSource.getRepository(Calories);
export class CaloriesController {

    public CreateCalories: RequestHandler = async (req: Request, res: Response) => {
        const parsed = CaloriesParamsSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({message: "Invalid input"});
        }

        const newCalories = CaloriesRepo.create({...parsed.data});

        await CaloriesRepo.save(newCalories)
            .then(calories => {
                return res.status(200).json({message: "Calories created successfully", data: calories});
            })
            .catch(error => {
                return res.status(500).json({message: "Internal Server Error"});
            })
    };
    public GetCalories: RequestHandler = async (req: Request, res: Response) => {
        try {
            const calories = await CaloriesRepo.find();
            return res.status(200).json({calories: calories});
        } catch (error) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    };

    public GetCaloriesById: RequestHandler = async (req: Request, res: Response) => {

        const caloriesId = req.params.id;
        if (!caloriesId) {
            return res.status(400).json({message: "Invalid calories ID"});
        }
        try {
            const calories = CaloriesRepo.findOne({
                where: {
                    id: caloriesId
                }
            })
            res.status(200).json({message: "Calories found", data: calories});
        } catch (e) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }

    public UpdateCalories: RequestHandler = async (req: Request, res: Response) => {
        const newData = z.object({
            energy_kcal: NUMBER.optional(),
            protein_g: NUMBER.optional(),
            fat_g: NUMBER.optional(),
            carbs_g: NUMBER.optional()
        })

        const caloriesId = req.params.id;
        if (!caloriesId) {
            return res.status(400).json({message: "Invalid calories ID"});
        }

        const parsed = newData.safeParse(req.body);

        try {
            const calories = await CaloriesRepo.findOne({
                where: {
                    id: caloriesId
                }
            })
            if (!calories) {
                return res.status(404).json({message: "Calories not found"});
            }
            Object.assign(calories, parsed.data);

            const updated = await CaloriesRepo.save(calories);
            return res.status(200).json({message: "Calories updated successfully", data: updated});
        } catch (e) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }

    public DeleteCalories: RequestHandler = async (req: Request, res: Response) => {
        const caloriesId = req.params.id;
        if (!caloriesId) {
            return res.status(400).json({message: "Invalid calories ID"});
        }
        try {
            const calories = await CaloriesRepo.findOne({
                where: {
                    id: caloriesId
                }
            })
            if (!calories) {
                return res.status(404).json({message: "Calories not found"});
            }
            await CaloriesRepo.delete(caloriesId);
        } catch (e) {
            return res.status(500).json({message: "Internal Server Error"});
        }
    }
}

export default new CaloriesController();