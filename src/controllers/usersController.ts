import { Request, Response } from 'express';
import crypto from 'crypto';
import db from '../services/db';
import { created } from '../http/responce';
import { AppError, BadRequestError, ConflictError } from '../http/errors';
import { HttpStatusCodes } from '../http/statusCodes';

// Hash password using scrypt
async function hashPassword(password: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(salt + ':' + derivedKey.toString('hex'));
        });
    });
}

// Validate email format
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export const createUserController = async (req: Request, res: Response) => {
    try {
        const { email, password, username }: { email?: string; password?: string; username?: string } = req.body;

        // Input validation
        if (!email || !password || !username) {
            throw new BadRequestError('Email, password, and username are required');
        }

        if (!isValidEmail(email)) {
            throw new BadRequestError('Invalid email format');
        }

        if (password.length < 8) {
            throw new BadRequestError('Password must be at least 8 characters long');
        }

        if (username.length < 3) {
            throw new BadRequestError('Username must be at least 3 characters long');
        }

        // Hash the password
        const passwordHash = await hashPassword(password);

        // Check if user already exists
        const existingUser = await db.query(
            'SELECT id FROM users WHERE email = $1 OR username = $2',
            [email, username]
        );

        if (existingUser.rows.length > 0) {
            throw new ConflictError('User with this email or username already exists');
        }

        // Insert new user
        const result = await db.query(
            'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username, created_at',
            [email, username, passwordHash]
        );

        // Don't return password hash
        created(res, result.rows[0]);
    } catch (error) {
        // Re-throw AppError instances to be handled by error handler
        if (error instanceof AppError) {
            throw error;
        }

        // Handle database errors (e.g., unique constraint violations)
        if (error && typeof error === 'object' && 'code' in error) {
            const dbError = error as { code: string; detail?: string };
            if (dbError.code === '23505') { // PostgreSQL unique violation
                throw new ConflictError('User with this email or username already exists');
            }
        }

        // Unknown error
        throw new AppError('Failed to create user', HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
};