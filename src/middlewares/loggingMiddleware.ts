import { Request, Response, NextFunction } from 'express';
import { getLogger } from '@root/infrastructure/logger';

export function loggingMiddleware(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const logger = getLogger();

    // Log incoming request
    logger.info('Incoming HTTP Request', {
        method: req.method,
        path: req.path,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        query: req.query,
    });

    const originalEnd = res.end.bind(res);
    res.end = function(chunk?: any, encoding?: any, cb?: () => void): Response {
        const duration = Date.now() - startTime;

        // Log HTTP response
        logger.logHTTPRequest(
            req.method,
            req.path,
            req.user?.userId?.toString(),
            res.statusCode,
            duration
        );

        // Call original end function with proper return type
        return originalEnd(chunk, encoding, cb);
    };

    next();
}
