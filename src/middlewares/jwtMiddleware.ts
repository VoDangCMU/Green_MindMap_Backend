import { Request, Response, NextFunction } from "express";
import { JWTHelper } from "@root/utils/jwtHelper";
import repository from "@root/repository";


declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role?: string;
            };
        }
    }
}

export const jwtAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Missing or invalid Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    const payload = JWTHelper.verifyToken(token);

    if (!payload) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }

    try {
        const tokenId = generateTokenId(token);
        const isBlacklisted = await repository.bitmap.isBlacklisted(tokenId);

        if (isBlacklisted) {
            return res.status(401).json({ message: "Token has been revoked" });
        }
    } catch (error) {
        console.error("Error checking token blacklist:", error);
        return res.status(500).json({ message: "Internal server error" });
    }

    req.user = {
        userId: payload.userId,
        role: payload.role
    };

    next();
};

function generateTokenId(token: string): number {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
        const char = token.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash) % 100000;
}
