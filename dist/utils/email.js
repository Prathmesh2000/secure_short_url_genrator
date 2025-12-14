"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = sendOtpEmail;
const dotenv_1 = __importDefault(require("dotenv"));
const resend_1 = require("resend");
dotenv_1.default.config();
if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
}
if (!process.env.EMAIL_FROM) {
    throw new Error('EMAIL_FROM is not set');
}
const resend = new resend_1.Resend(process.env.RESEND_API_KEY);
function getSubject(purpose) {
    switch (purpose) {
        case 'signup':
            return 'Verify your email address';
        case 'reset_password':
            return 'Reset your password';
        default:
            return 'Your verification code';
    }
}
function getBody(otp, purpose) {
    const action = purpose === 'signup'
        ? 'complete your signup'
        : 'reset your password';
    return `
Your verification code is:

${otp}

This code will expire in 10 minutes.

If you did not request this, you can safely ignore this email.

— Short URL Team
`.trim();
}
async function sendOtpEmail(to, otp, purpose) {
    const result = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to,
        subject: getSubject(purpose),
        text: getBody(otp, purpose)
    });
    return result?.data?.id || null;
}
