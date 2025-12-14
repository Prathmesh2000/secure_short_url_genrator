"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const errors_1 = require("../http/errors");
const jwt_1 = require("../utils/jwt");
const db_1 = __importDefault(require("../services/db"));
const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            return next(new errors_1.UnauthorizedError('Unauthorized'));
        }
        let payload;
        try {
            payload = (0, jwt_1.verifyToken)(token);
        }
        catch {
            return next(new errors_1.UnauthorizedError('Invalid or expired token'));
        }
        const result = await db_1.default.query('SELECT password_updated_at, id FROM users WHERE email = $1', [payload.email]);
        if (result.rowCount === 0) {
            return next(new errors_1.UnauthorizedError('User not found'));
        }
        const user = result.rows[0];
        const tokenIssuedAt = (payload.iat ?? 0) * 1000; // seconds → ms
        const currentTime = new Date().getTime();
        const tokenExpiredAt = (payload.exp ?? 0) * 1000; // seconds → ms
        // Invalidate tokens issued before password change (if password was changed)
        if (user.password_updated_at) {
            const passwordChangedAt = new Date(user.password_updated_at).getTime();
            if (tokenIssuedAt < passwordChangedAt) {
                return next(new errors_1.UnauthorizedError('Token expired due to password change'));
            }
        }
        if (tokenExpiredAt < currentTime) {
            return next(new errors_1.UnauthorizedError('Token expired'));
        }
        // Attach user to request
        req.user = {
            username: payload.username,
            email: payload.email,
            id: user.id
        };
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.requireAuth = requireAuth;
