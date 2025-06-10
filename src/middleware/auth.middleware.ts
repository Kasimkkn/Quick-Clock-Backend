// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/config';
import { User } from '../models/user.model';

// Extend Express Request type to include user
declare global {
    namespace Express {
        interface Request {
            user?: User;
            userId?: string;
            isAdmin?: boolean;
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Authorization token required' });
            return; // Just return without passing anything
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwt.verify(token, config.jwt.secret) as { id: string };

            // Find the user
            const user = await User.findByPk(decoded.id);

            if (!user) {
                res.status(401).json({ message: 'User not found' });
                return; // Just return without passing anything
            }

            // Attach user to request object
            req.user = user;
            req.userId = user.id;
            req.isAdmin = user.role === 'admin';

            next();
        } catch (error) {
            res.status(401).json({ message: 'Invalid token' });
            return; // Just return without passing anything
        }
    } catch (error) {
        res.status(500).json({ message: 'Authentication error', error });
        return; // Just return without passing anything
    }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
};