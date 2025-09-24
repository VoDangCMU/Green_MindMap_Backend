import { Request, RequestHandler, Response } from "express";
import { getLogger } from "@root/infrastructure/logger";

export class HelloController {
    public sayHello: RequestHandler = (req: Request, res: Response) => {
        const logger = getLogger();
        logger.debug("Hello API requested", {
            timestamp: new Date().toISOString(),
            ip: req.ip
        });

        res.json({
            message: "Hello, Green MindMap!",
            timestamp: new Date().toISOString(),
            service: "green-mindmap-backend"
        });
    };
}

export default new HelloController();