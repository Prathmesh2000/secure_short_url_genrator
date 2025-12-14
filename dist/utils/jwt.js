"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not set');
}
// Type assertion after the check ensures TypeScript knows JWT_SECRET is a string
const secret = JWT_SECRET;
function signToken(payload) {
    return jsonwebtoken_1.default.sign(payload, secret, {
        expiresIn: JWT_EXPIRES_IN
    });
}
function verifyToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, secret);
    return decoded;
}
