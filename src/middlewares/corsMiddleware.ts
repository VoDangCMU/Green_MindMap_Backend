import cors from 'cors';
import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { logger } from '../infrastructure/logger';

// CORS configuration
const corsOptions: cors.CorsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, Postman, etc.)
        if (!origin) {
            return callback(null, true);
        }

        // In development, allow all origins
        if (config.app.env === 'development') {
            return callback(null, true);
        }

        // In production, define allowed origins
        const allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://*.khoav4.com',
        ];

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'), false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'Cache-Control',
        'X-Access-Token'
    ],
    credentials: true, // Allow cookies to be sent with requests
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    maxAge: 86400 // Cache preflight response for 24 hours
};

// CORS middleware with logging
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Log CORS requests for debugging
    if (req.method === 'OPTIONS') {
        logger.debug(`CORS preflight request from origin: ${req.get('Origin')}`, {
            method: req.method,
            url: req.url,
            origin: req.get('Origin'),
            userAgent: req.get('User-Agent')
        });
    }

    return cors(corsOptions)(req, res, next);
};

// Simple CORS middleware for development (less restrictive)
export const devCorsMiddleware = cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['*'],
    credentials: true,
    optionsSuccessStatus: 200
});

export default corsMiddleware;
