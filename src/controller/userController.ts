import {Request, Response, RequestHandler} from "express";
import repository from "@root/repository";
import {getLogger} from "@root/infrastructure/logger";

export class UserController {
    public LoginWithEmail: RequestHandler = async (req: Request, res: Response) => {
        const logger = getLogger();
        const startTime = Date.now();
        const {email, password} = req.body;

        logger.info("User login attempt", {
            email: email?.substring(0, 3) + "***", // Mask email for privacy
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        if (!email || !password) {
            logger.warn("Login failed - missing credentials", {
                email: email ? "provided" : "missing",
                password: password ? "provided" : "missing"
            });
            res.status(400).json({message: "Email and password are required"});
            return;
        }

        try {
            const user = await repository.user.findByEmailAndPassword(email, password);
            const duration = Date.now() - startTime;

            if (!user) {
                logger.warn("Login failed - invalid credentials", {
                    email: email?.substring(0, 3) + "***",
                    duration
                });
                res.status(400).json({message: "Invalid email or password"});
                return;
            }

            logger.info("User login successful", {
                userId: user.id,
                email: email?.substring(0, 3) + "***",
                duration
            });

            res.status(200).json({message: "Login successful", user});
            return;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error("Login error", error as Error, {
                email: email?.substring(0, 3) + "***",
                duration
            });
            res.status(500).json({message: "Internal server error"});
            return;
        }
    }
}

export default new UserController();