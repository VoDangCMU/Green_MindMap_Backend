import { Request, Response, RequestHandler } from "express";
import {JWTHelper} from "@root/utils/jwtHelper";

export class TokenController {
    public GetNewToken: RequestHandler = async (req: Request, res: Response): Promise<void> => {
        const refreshToken = req.headers['x-refresh-token'];

        if (!refreshToken || typeof refreshToken !== 'string') {
             res.status(400).json({ message: "Refresh token is required" });
             return;
        }

        try {
            const payload = JWTHelper.verifyToken(refreshToken);

            if (!payload) {
                res.status(401).json({ message: "Invalid or expired refresh token" });
                return;
            }

            const newAccessToken = JWTHelper.createAccessToken({
                userId: payload.userId,
                role: payload.role,
            });

            res.status(200).json({ accessToken: newAccessToken });
        } catch (err) {
            res.status(500).json({ message: "Internal Server Error" });
        }
    };
}

export default new TokenController();
