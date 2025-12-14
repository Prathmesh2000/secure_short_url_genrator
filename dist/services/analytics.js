"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordShortUrlAccess = recordShortUrlAccess;
const db_1 = __importDefault(require("./db"));
async function recordShortUrlAccess(shortUrlId, meta) {
    try {
        await db_1.default.query(`
      INSERT INTO short_url_access_logs
        (short_url_id, ip_address, user_agent, referer)
      VALUES ($1, $2, $3, $4)
      `, [
            shortUrlId,
            meta.ip ?? null,
            meta.userAgent ?? null,
            meta.referer ?? null
        ]);
        await db_1.default.query(`
      INSERT INTO short_url_stats (short_url_id, click_count, last_accessed)
      VALUES ($1, 1, now())
      ON CONFLICT (short_url_id)
      DO UPDATE SET
        click_count = short_url_stats.click_count + 1,
        last_accessed = now()
      `, [shortUrlId]);
    }
    catch (err) {
        console.error('[ANALYTICS]', err);
    }
}
