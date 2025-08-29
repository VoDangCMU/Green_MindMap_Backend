import { Request, RequestHandler, Response } from "express";
import { getLogger } from "@root/infrastructure/logger";

export class CheckHeathController {
    public checkHealth: RequestHandler = (req: Request, res: Response) => {
        const logger = getLogger();
        logger.debug("Health check requested", {
            timestamp: new Date().toISOString(),
            ip: req.ip
        });

        res.json({
            message: "ok",
            timestamp: new Date().toISOString(),
            service: "green-mindmap-backend"
        });
    };
}

export default new CheckHeathController();
