"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordController = exports.forgotPasswordController = exports.verifySignupController = exports.signupController = exports.loginController = void 0;
const responce_1 = require("../http/responce");
const errors_1 = require("../http/errors");
const validation_1 = __importDefault(require("../utils/validation"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../services/db"));
const statusCodes_1 = require("../http/statusCodes");
const email_1 = require("../utils/email");
const commonFunctions_1 = require("../utils/commonFunctions");
const jwt_1 = require("../utils/jwt");
const loginController = async (req, res) => {
    const { email, password } = req.body;
    const emailValidation = validation_1.default.validateEmail(email);
    if (!emailValidation.isValid) {
        throw new errors_1.BadRequestError(emailValidation.message);
    }
    const result = await db_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows || result.rows.length === 0) {
        throw new errors_1.BadRequestError('Invalid email or password');
    }
    const user = result.rows[0];
    if (!user.is_email_verified) {
        throw new errors_1.BadRequestError('Please verify your email to login');
    }
    const isPasswordValid = await bcrypt_1.default.compare(password, user.password_hash);
    if (!isPasswordValid) {
        throw new errors_1.BadRequestError('Invalid password');
    }
    const token = (0, jwt_1.signToken)({ username: user.username, email: user.email });
    res.cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    });
    return (0, responce_1.success)(res, { message: 'Login successful' });
};
exports.loginController = loginController;
const signupController = async (req, res) => {
    const { email, password, username } = req.body;
    // Validate email
    const emailValidation = validation_1.default.validateEmail(email);
    if (!emailValidation.isValid) {
        throw new errors_1.BadRequestError(emailValidation.message);
    }
    // Validate password
    const passwordValidation = validation_1.default.validatePassword(password);
    if (!passwordValidation.isValid) {
        throw new errors_1.BadRequestError(passwordValidation.message);
    }
    // Validate username
    const usernameValidation = validation_1.default.validateUsername(username);
    if (!usernameValidation.isValid) {
        throw new errors_1.BadRequestError(usernameValidation.message);
    }
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    try {
        const result = await db_1.default.query('INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING *', [email, passwordHash, username]);
        if (!result.rows || result.rows.length === 0) {
            throw new errors_1.AppError('Failed to create user', statusCodes_1.HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
        const user = result.rows[0];
        const otp = (0, commonFunctions_1.generateOtp)();
        const emailResult = await (0, email_1.sendOtpEmail)(user.email, otp, 'signup');
        if (!emailResult) {
            throw new errors_1.AppError('Failed to send OTP email', statusCodes_1.HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
        else {
            const otpHash = await bcrypt_1.default.hash(otp, 10);
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await db_1.default.query('DELETE FROM email_otps WHERE email = $1 AND purpose = $2', [user.email, 'signup']);
            await db_1.default.query('INSERT INTO email_otps (email, otp_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)', [user.email, otpHash, 'signup', expiresAt]);
        }
        return (0, responce_1.created)(res, { message: 'User created successfully', user: {
                email: user.email,
                username: user.username,
            } });
    }
    catch (error) {
        console.error('[AUTH] Error in signupController', error);
        // Check for PostgreSQL unique constraint violation (duplicate email or username)
        if (error.code === '23505') {
            const constraint = error.constraint || '';
            if (constraint.includes('email')) {
                throw new errors_1.ConflictError('User with this email already exists');
            }
            else if (constraint.includes('username')) {
                throw new errors_1.ConflictError('User with this username already exists');
            }
            else {
                throw new errors_1.ConflictError('User already exists');
            }
        }
        // Re-throw if it's already an AppError
        if (error instanceof errors_1.AppError) {
            throw error;
        }
        // Handle other database errors
        throw new errors_1.AppError('Failed to create user', statusCodes_1.HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
};
exports.signupController = signupController;
const verifySignupController = async (req, res) => {
    const { email, otp, purpose } = req.body;
    const emailValidation = validation_1.default.validateEmail(email);
    if (!emailValidation.isValid) {
        throw new errors_1.BadRequestError(emailValidation.message);
    }
    const otpValidation = validation_1.default.validateOtp(otp);
    if (!otpValidation.isValid) {
        throw new errors_1.BadRequestError(otpValidation.message);
    }
    if (purpose !== 'signup' && purpose !== 'reset_password') {
        throw new errors_1.BadRequestError('Invalid purpose. Purpose must be either "signup" or "reset_password"');
    }
    const result = await db_1.default.query('SELECT otp_hash FROM email_otps WHERE email = $1 AND purpose = $2 AND expires_at > NOW()', [email, purpose]);
    if (!result.rows || result.rows.length === 0) {
        throw new errors_1.BadRequestError('Invalid OTP');
    }
    else {
        const storedOtpHash = result.rows[0].otp_hash;
        const isOtpValid = await bcrypt_1.default.compare(otp, storedOtpHash);
        if (!isOtpValid) {
            throw new errors_1.BadRequestError('Invalid OTP');
        }
        await db_1.default.query('UPDATE users SET is_email_verified = TRUE WHERE email = $1', [email]);
        await db_1.default.query('DELETE FROM email_otps WHERE email = $1 AND purpose = $2 AND expires_at > NOW()', [email, 'signup']);
        return (0, responce_1.success)(res, { message: 'OTP verified successfully' });
    }
};
exports.verifySignupController = verifySignupController;
const forgotPasswordController = async (req, res) => {
    const { email } = req.body;
    const emailValidation = validation_1.default.validateEmail(email);
    if (!emailValidation.isValid) {
        throw new errors_1.BadRequestError(emailValidation.message);
    }
    const result = await db_1.default.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows || result.rows.length === 0) {
        throw new errors_1.BadRequestError('Invalid email');
    }
    const user = result.rows[0];
    const otp = (0, commonFunctions_1.generateOtp)();
    const emailResult = await (0, email_1.sendOtpEmail)(email, otp, 'reset_password');
    if (!emailResult) {
        throw new errors_1.AppError('Failed to send OTP email', statusCodes_1.HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
    else {
        const otpHash = await bcrypt_1.default.hash(otp, 10);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await db_1.default.query('DELETE FROM email_otps WHERE email = $1 AND purpose = $2', [user.email, 'reset_password']);
        await db_1.default.query('INSERT INTO email_otps (email, otp_hash, purpose, expires_at) VALUES ($1, $2, $3, $4)', [user.email, otpHash, 'reset_password', expiresAt]);
    }
    return (0, responce_1.success)(res, { message: 'OTP sent successfully' });
};
exports.forgotPasswordController = forgotPasswordController;
const resetPasswordController = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    const emailValidation = validation_1.default.validateEmail(email);
    if (!emailValidation.isValid) {
        throw new errors_1.BadRequestError(emailValidation.message);
    }
    const otpValidation = validation_1.default.validateOtp(otp);
    if (!otpValidation.isValid) {
        throw new errors_1.BadRequestError(otpValidation.message);
    }
    const passwordValidation = validation_1.default.validatePassword(newPassword);
    if (!passwordValidation.isValid) {
        throw new errors_1.BadRequestError(passwordValidation.message);
    }
    const otpResult = await db_1.default.query('SELECT * FROM email_otps WHERE email = $1 AND purpose = $2 AND expires_at > NOW()', [email, 'reset_password']);
    if (!otpResult.rows || otpResult.rows.length === 0) {
        throw new errors_1.BadRequestError('Invalid OTP');
    }
    const storedOtpHash = otpResult.rows[0].otp_hash;
    const isOtpValid = await bcrypt_1.default.compare(otp, storedOtpHash);
    if (!isOtpValid) {
        throw new errors_1.BadRequestError('Invalid OTP');
    }
    const passwordHash = await bcrypt_1.default.hash(newPassword, 10);
    await db_1.default.query('UPDATE users SET password_hash = $1, password_changed_at = NOW() WHERE email = $2', [passwordHash, email]);
    await db_1.default.query('DELETE FROM email_otps WHERE email = $1 AND purpose = $2 AND expires_at > NOW()', [email, 'reset_password']);
    return (0, responce_1.success)(res, { message: 'Password reset successfully' });
};
exports.resetPasswordController = resetPasswordController;
