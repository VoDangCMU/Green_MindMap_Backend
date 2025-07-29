import { Request, Response } from "express";

export class CheckHeathController {
    public checkHealth(req: Request, res: Response) {
        res.json({ message: "ok" });
    }
}

export default new CheckHeathController();
