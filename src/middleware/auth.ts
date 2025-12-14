import { Request, Response, NextFunction } from "express";
import { BadRequestError, UnauthorizedError } from "../http/errors";
import { verifyToken } from "../utils/jwt";
import db from "../services/db";

interface JwtPayload {
    username: string;
    email: string;
    iat: number;
    exp: number;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            return next(new UnauthorizedError('Unauthorized'));
        }
        let payload: JwtPayload;

        try {
            payload = verifyToken(token) as JwtPayload;
        } catch {
            return next(new UnauthorizedError('Invalid or expired token'));
        }

        const result = await db.query<{ password_updated_at: string | null, id: number }>(
            'SELECT password_updated_at, id FROM users WHERE email = $1',
            [payload.email]
        );

        if (result.rowCount === 0) {
            return next(new UnauthorizedError('User not found'));
        }

        const user = result.rows[0];
        const tokenIssuedAt = (payload.iat ?? 0) * 1000; // seconds → ms
        const currentTime = new Date().getTime();
        const tokenExpiredAt = (payload.exp ?? 0) * 1000; // seconds → ms


        // Invalidate tokens issued before password change (if password was changed)
        if (user.password_updated_at) {
            const passwordChangedAt = 
            new Date(user.password_updated_at).getTime();
            if (tokenIssuedAt < passwordChangedAt) {
                return next(new UnauthorizedError('Token expired due to password change'));
            }
        }
        if (tokenExpiredAt < currentTime) {
            return next(new UnauthorizedError('Token expired'));
        }
        // Attach user to request
        (req as any).user = {
            username: payload.username,
            email: payload.email,
            id: user.id
        };

        next();
    } catch (error) {
        next(error);
    }
}