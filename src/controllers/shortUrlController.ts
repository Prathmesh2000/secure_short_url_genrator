import { Request, Response } from "express";
import { redirect, success } from "../http/responce";
import { AppError, BadRequestError } from "../http/errors";
import { User } from "../types/express";
import db, { withTransaction } from "../services/db";
import { HttpStatusCodes } from "../http/statusCodes";
import { extractAccessMeta, generateShortCode } from "../utils/commonFunctions";
import { connectRedis } from "../services/redisConnect";
import redis from "../services/redis";
import { recordShortUrlAccess } from "../services/analytics";

export const generateShortUrlController = async (req: Request, res: Response) => {
    const { longUrl, TTL=100, headerValues = {} } = req.body;
    const {id} = req.user as User;

    if (!longUrl) {
        throw new BadRequestError('Long URL is required');
    }

    const expiresAt = new Date(Date.now() + (TTL ?? 0) * 24 * 60 * 60 * 1000);
    
    const shortCode = await withTransaction(async (client) => {
        const result = await client.query('INSERT INTO short_urls (user_id, long_url, header_values, expires_at) VALUES ($1, $2, $3, $4) RETURNING *', [id, longUrl, headerValues, expiresAt]);
        if (!result.rows || result.rows.length === 0) {
            throw new AppError('Failed to generate short URL', HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
        const shortCodeId = Number(result.rows[0].id);
        const generatedShortCode = generateShortCode(shortCodeId);
        await client.query('UPDATE short_urls SET short_code = $1 WHERE id = $2', [generatedShortCode, shortCodeId]);
        return generatedShortCode;
    });
    
    return success(res, { message: 'Short URL generated successfully', shortUrl: `${process.env.REDIRECT_URL}/${shortCode}` });
}

export const redirectShortUrlController = async (req: Request, res: Response) => {
    const { shortCode } = req.params;
    const redisKey = `short:${shortCode}`;
    // ---------- 1️⃣ Try Redis ----------
    try {
        await connectRedis();
        const cached = await redis.get(redisKey);

        if (cached) {
            const cachedData = JSON.parse(cached);
            const meta = extractAccessMeta(req);
            recordShortUrlAccess(cachedData.id, meta);
            return res.status(200).json({
                url: cachedData.url,
            });
            // return redirect(res, cachedData.url);
        }
    } catch (err) {
        // Redis failure is ignored
        console.warn('[REDIS] cache miss or unavailable');
    }


    const shortUrl = await db.query('SELECT * FROM short_urls WHERE short_code = $1', [shortCode]);
    if (!shortUrl.rows || shortUrl.rows.length === 0) {
        throw new AppError('Short URL not found', HttpStatusCodes.NOT_FOUND);
    }
    const shortUrlData = shortUrl.rows[0];
    if (shortUrlData.expires_at < new Date()) {
        throw new AppError('Short URL expired', HttpStatusCodes.GONE);
    }
    if(!shortUrlData.is_active) {
        throw new AppError('Short URL is not active', HttpStatusCodes.GONE);
    }
      // ---------- 3️⃣ Populate Redis (best effort) ----------
    try {
        let ttl = 3600; // default 1h
        if (shortUrlData.expires_at) {
            const secondsLeft = Math.floor(
                (new Date(shortUrlData.expires_at).getTime() - Date.now()) / 1000
            );
        
            if (secondsLeft <= 0) {
                throw new AppError('Short URL expired', HttpStatusCodes.GONE);
            }
        
            ttl = Math.min(secondsLeft, ttl);
        }
        if(ttl > 30) {
            await connectRedis();
            const payload = {
                id: shortUrlData.id,
                url: shortUrlData.long_url
            };

            await redis.setex(redisKey, ttl, JSON.stringify(payload));
        }

        if(shortUrlData.long_url) {
            const meta = extractAccessMeta(req);
            recordShortUrlAccess(shortUrlData.id, meta);
            return res.status(200).json({
                url: shortUrlData.long_url,
            });
            
            // return redirect(res, shortUrlData.long_url);
        }
    
    } catch (err) {
        console.error('[REDIS] error', err);
    }

    return success(res, { message: 'Short URL redirected successfully', shortUrl: shortUrl.rows[0] });
}