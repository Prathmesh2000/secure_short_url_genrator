"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirectShortUrlController = exports.generateShortUrlController = void 0;
const responce_1 = require("../http/responce");
const errors_1 = require("../http/errors");
const db_1 = __importStar(require("../services/db"));
const statusCodes_1 = require("../http/statusCodes");
const commonFunctions_1 = require("../utils/commonFunctions");
const redisConnect_1 = require("../services/redisConnect");
const redis_1 = __importDefault(require("../services/redis"));
const analytics_1 = require("../services/analytics");
const generateShortUrlController = async (req, res) => {
    const { longUrl, TTL = 100, headerValues = {} } = req.body;
    const { id } = req.user;
    if (!longUrl) {
        throw new errors_1.BadRequestError('Long URL is required');
    }
    const expiresAt = new Date(Date.now() + (TTL ?? 0) * 24 * 60 * 60 * 1000);
    const shortCode = await (0, db_1.withTransaction)(async (client) => {
        const result = await client.query('INSERT INTO short_urls (user_id, long_url, header_values, expires_at) VALUES ($1, $2, $3, $4) RETURNING *', [id, longUrl, headerValues, expiresAt]);
        if (!result.rows || result.rows.length === 0) {
            throw new errors_1.AppError('Failed to generate short URL', statusCodes_1.HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
        const shortCodeId = Number(result.rows[0].id);
        const generatedShortCode = (0, commonFunctions_1.generateShortCode)(shortCodeId);
        await client.query('UPDATE short_urls SET short_code = $1 WHERE id = $2', [generatedShortCode, shortCodeId]);
        return generatedShortCode;
    });
    return (0, responce_1.success)(res, { message: 'Short URL generated successfully', shortUrl: `${process.env.REDIRECT_URL}/${shortCode}` });
};
exports.generateShortUrlController = generateShortUrlController;
const redirectShortUrlController = async (req, res) => {
    const { shortCode } = req.params;
    const redisKey = `short:${shortCode}`;
    // ---------- 1️⃣ Try Redis ----------
    try {
        await (0, redisConnect_1.connectRedis)();
        const cached = await redis_1.default.get(redisKey);
        if (cached) {
            const cachedData = JSON.parse(cached);
            const meta = (0, commonFunctions_1.extractAccessMeta)(req);
            (0, analytics_1.recordShortUrlAccess)(cachedData.id, meta);
            return (0, responce_1.redirect)(res, cachedData.url);
        }
    }
    catch (err) {
        // Redis failure is ignored
        console.warn('[REDIS] cache miss or unavailable');
    }
    const shortUrl = await db_1.default.query('SELECT * FROM short_urls WHERE short_code = $1', [shortCode]);
    if (!shortUrl.rows || shortUrl.rows.length === 0) {
        throw new errors_1.AppError('Short URL not found', statusCodes_1.HttpStatusCodes.NOT_FOUND);
    }
    const shortUrlData = shortUrl.rows[0];
    if (shortUrlData.expires_at < new Date()) {
        throw new errors_1.AppError('Short URL expired', statusCodes_1.HttpStatusCodes.GONE);
    }
    if (!shortUrlData.is_active) {
        throw new errors_1.AppError('Short URL is not active', statusCodes_1.HttpStatusCodes.GONE);
    }
    // ---------- 3️⃣ Populate Redis (best effort) ----------
    try {
        let ttl = 3600; // default 1h
        if (shortUrlData.expires_at) {
            const secondsLeft = Math.floor((new Date(shortUrlData.expires_at).getTime() - Date.now()) / 1000);
            if (secondsLeft <= 0) {
                throw new errors_1.AppError('Short URL expired', statusCodes_1.HttpStatusCodes.GONE);
            }
            ttl = Math.min(secondsLeft, ttl);
        }
        if (ttl > 30) {
            await (0, redisConnect_1.connectRedis)();
            const payload = {
                id: shortUrlData.id,
                url: shortUrlData.long_url
            };
            await redis_1.default.setex(redisKey, ttl, JSON.stringify(payload));
        }
        if (shortUrlData.long_url) {
            const meta = (0, commonFunctions_1.extractAccessMeta)(req);
            (0, analytics_1.recordShortUrlAccess)(shortUrlData.id, meta);
            return (0, responce_1.redirect)(res, shortUrlData.long_url);
        }
    }
    catch (err) {
        console.error('[REDIS] error', err);
    }
    return (0, responce_1.success)(res, { message: 'Short URL redirected successfully', shortUrl: shortUrl.rows[0] });
};
exports.redirectShortUrlController = redirectShortUrlController;
