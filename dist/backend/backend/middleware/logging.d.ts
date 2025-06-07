import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
declare const logger: winston.Logger;
export declare const loggingMiddleware: (req: Request, res: Response, next: NextFunction) => void;
export { logger };
//# sourceMappingURL=logging.d.ts.map