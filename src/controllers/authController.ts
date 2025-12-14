import { created, success } from "../http/responce";
import { Request, Response } from "express";
import { AppError, BadRequestError, ConflictError } from "../http/errors";
import Validation from "../utils/validation";
import bcrypt from "bcrypt";
import db from "../services/db";
import { HttpStatusCodes } from "../http/statusCodes";
import { sendOtpEmail } from "../utils/email";
import { generateOtp } from "../utils/commonFunctions";
import { signToken } from "../utils/jwt";

export const loginController = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const emailValidation = Validation.validateEmail(email);
    if (!emailValidation.isValid) {
        throw new BadRequestError(emailValidation.message);
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows || result.rows.length === 0) {
        throw new BadRequestError('Invalid email or password');
    }
    const user = result.rows[0];
    if (!user.is_email_verified) {
        throw new BadRequestError('Please verify your email to login');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        throw new BadRequestError('Invalid password');
    }
    const token = signToken({ username: user.username, email: user.email });

    res.cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
      
    return success(res, { message: 'Login successful' });
};

export const signupController = async (req: Request, res: Response) => {
    const { email, password, username } = req.body;
    
    // Validate email
    const emailValidation = Validation.validateEmail(email);
    if (!emailValidation.isValid) {
        throw new BadRequestError(emailValidation.message);
    }
    
    // Validate password
    const passwordValidation = Validation.validatePassword(password);
    if (!passwordValidation.isValid) {
        throw new BadRequestError(passwordValidation.message);
    }
    
    // Validate username
    const usernameValidation = Validation.validateUsername(username);
    if (!usernameValidation.isValid) {
        throw new BadRequestError(usernameValidation.message);
    }
    const passwordHash = await bcrypt.hash(password, 10);
    try {
        const result = await db.query('INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING *', [email, passwordHash, username]);
        
        if (!result.rows || result.rows.length === 0) {
            throw new AppError('Failed to create user', HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
        
        const user = result.rows[0];
        const otp = generateOtp();
        const emailResult = await sendOtpEmail(user.email, otp, 'signup');
        if (!emailResult) {
            throw new AppError('Failed to send OTP email', HttpStatusCodes.INTERNAL_SERVER_ERROR);
        } else {
            const otpHash = await bcrypt.hash(otp, 10);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await db.query('DELETE FROM email_otps WHERE email = $1 AND purpose = $2', [user.email, 'signup']);
            await db.query('INSERT INTO email_otps (email, otp_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)', [user.email, otpHash, 'signup', expiresAt]);
        }
        return created(res, { message: 'User created successfully', user: {
            email: user.email,
            username: user.username,
        } });
    } 
    catch (error: any) {
        console.error('[AUTH] Error in signupController', error);
        
        // Check for PostgreSQL unique constraint violation (duplicate email or username)
        if (error.code === '23505') {
            const constraint = error.constraint || '';
            if (constraint.includes('email')) {
                throw new ConflictError('User with this email already exists');
            } else if (constraint.includes('username')) {
                throw new ConflictError('User with this username already exists');
            } else {
                throw new ConflictError('User already exists');
            }
        }
        
        // Re-throw if it's already an AppError
        if (error instanceof AppError) {
            throw error;
        }
        
        // Handle other database errors
        throw new AppError('Failed to create user', HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
};

export const verifySignupController = async (req: Request, res: Response) => {
    const { email, otp, purpose } = req.body;
    const emailValidation = Validation.validateEmail(email);
    if (!emailValidation.isValid) {
        throw new BadRequestError(emailValidation.message);
    }
    const otpValidation = Validation.validateOtp(otp);
    if (!otpValidation.isValid) {
        throw new BadRequestError(otpValidation.message);
    }
    if (purpose !== 'signup' && purpose !== 'reset_password') {
        throw new BadRequestError('Invalid purpose. Purpose must be either "signup" or "reset_password"');
    }
    const result = await db.query('SELECT otp_hash FROM email_otps WHERE email = $1 AND purpose = $2 AND expires_at > NOW()', [email, purpose]);

    if (!result.rows || result.rows.length === 0) {
        throw new BadRequestError('Invalid OTP');
    } else {
        const storedOtpHash = result.rows[0].otp_hash;
        const isOtpValid = await bcrypt.compare(otp, storedOtpHash);
        if (!isOtpValid) {
            throw new BadRequestError('Invalid OTP');
        }
        await db.query('UPDATE users SET is_email_verified = TRUE WHERE email = $1', [email]);
        await db.query('DELETE FROM email_otps WHERE email = $1 AND purpose = $2 AND expires_at > NOW()', [email, 'signup']);
        return success(res, { message: 'OTP verified successfully' });
    }
};

export const forgotPasswordController = async (req: Request, res: Response) => {
    const { email } = req.body;
    const emailValidation = Validation.validateEmail(email);
    if (!emailValidation.isValid) {
        throw new BadRequestError(emailValidation.message);
    }
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows || result.rows.length === 0) {
        throw new BadRequestError('Invalid email');
    }
    const user = result.rows[0];
    const otp = generateOtp();

    const emailResult = await sendOtpEmail(email, otp, 'reset_password');      
    if (!emailResult) {
        throw new AppError('Failed to send OTP email', HttpStatusCodes.INTERNAL_SERVER_ERROR);
    } else {
        const otpHash = await bcrypt.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await db.query('DELETE FROM email_otps WHERE email = $1 AND purpose = $2', [user.email, 'reset_password']);
        await db.query('INSERT INTO email_otps (email, otp_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)', [user.email, otpHash, 'reset_password', expiresAt]);
    }
    return success(res, { message: 'OTP sent successfully' });
};

export const resetPasswordController = async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body;
    const emailValidation = Validation.validateEmail(email);
    if (!emailValidation.isValid) {
        throw new BadRequestError(emailValidation.message);
    }
    const otpValidation = Validation.validateOtp(otp);
    if (!otpValidation.isValid) {
        throw new BadRequestError(otpValidation.message);
    }
    
    const passwordValidation = Validation.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
        throw new BadRequestError(passwordValidation.message);
    }

    const otpResult = await db.query('SELECT * FROM email_otps WHERE email = $1 AND purpose = $2 AND expires_at > NOW()', [email, 'reset_password']);
    if (!otpResult.rows || otpResult.rows.length === 0) {
        throw new BadRequestError('Invalid OTP');
    }
    const storedOtpHash = otpResult.rows[0].otp_hash;
    const isOtpValid = await bcrypt.compare(otp, storedOtpHash);
    if (!isOtpValid) {
        throw new BadRequestError('Invalid OTP');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await db.query('UPDATE users SET password_hash = $1, password_updated_at = NOW() WHERE email = $2', [passwordHash, email]);
    await db.query('DELETE FROM email_otps WHERE email = $1 AND purpose = $2 AND expires_at > NOW()', [email, 'reset_password']);
    return success(res, { message: 'Password reset successfully' });    
};