import jwt from 'jsonwebtoken';
import { config } from '@root/config/env';

export interface JWTPayload {
    userId: string;
    role?: string;
    email?: string;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}

export class JWTHelper {

    public static createAccessToken(payload: JWTPayload): string {
        const options: jwt.SignOptions = {
            algorithm: config.jwt.algorithm as jwt.Algorithm,
            expiresIn: '1d'
        };

        return jwt.sign(payload, config.jwt.secretKey, options);
    }

    public static createRefreshToken(payload: JWTPayload): string {
        const options: jwt.SignOptions = {
            algorithm: config.jwt.algorithm as jwt.Algorithm,
            expiresIn: '30d'
        };

        return jwt.sign(payload, config.jwt.secretKey, options);
    }

    public static createTokenPair(payload: JWTPayload): TokenPair {
        const accessToken = this.createAccessToken(payload);
        const refreshToken = this.createRefreshToken(payload);

        return {
            accessToken,
            refreshToken
        };
    }

    public static verifyToken(token: string): JWTPayload | null {
        try {
            return jwt.verify(token, config.jwt.secretKey, {
                algorithms: [config.jwt.algorithm as jwt.Algorithm]
            }) as JWTPayload;
        } catch (error) {
            return null;
        }
    }

    public static decodeToken(token: string): JWTPayload | null {
        try {
            return jwt.decode(token) as JWTPayload;
        } catch (error) {
            return null;
        }
    }

    public static isTokenExpired(token: string): boolean {
        try {
            const decoded = jwt.decode(token) as any;
            if (!decoded || !decoded.exp) return true;

            const currentTime = Math.floor(Date.now() / 1000);
            return decoded.exp < currentTime;
        } catch (error) {
            return true;
        }
    }

    public static getTokenExpiration(token: string): Date | null {
        try {
            const decoded = jwt.decode(token) as any;
            if (!decoded || !decoded.exp) return null;

            return new Date(decoded.exp * 1000);
        } catch (error) {
            return null;
        }
    }
}

export default new JWTHelper();
