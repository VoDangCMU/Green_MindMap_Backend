import { Request, RequestHandler, Response } from "express";

export class CheckHeathController {
    public checkHealth: RequestHandler = (req: Request, res: Response) => {
        res.json({ message: "ok" });
    };
}

export default new CheckHeathController();
