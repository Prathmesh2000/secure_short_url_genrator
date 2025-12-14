"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtp = void 0;
exports.encodeBase62 = encodeBase62;
exports.generateShortCode = generateShortCode;
exports.extractAccessMeta = extractAccessMeta;
const OFFSET = 10000000;
const MIN_LENGTH = 6;
const BASE62_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const BASE = BASE62_ALPHABET.length; // 62
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString().padStart(6, '0');
};
exports.generateOtp = generateOtp;
function encodeBase62(num) {
    if (!Number.isSafeInteger(num) || num < 0) {
        throw new Error('encodeBase62 expects a non-negative integer');
    }
    if (num === 0)
        return BASE62_ALPHABET[0];
    let result = '';
    while (num > 0) {
        result = BASE62_ALPHABET[num % BASE] + result;
        num = Math.floor(num / BASE);
    }
    return result;
}
function generateShortCode(id) {
    const encoded = encodeBase62(id + OFFSET);
    return encoded.padStart(MIN_LENGTH, 'a');
}
function extractAccessMeta(req) {
    return {
        ip: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
        referer: req.headers['referer'] ?? null
    };
}
