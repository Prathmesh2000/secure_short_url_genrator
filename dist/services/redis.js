"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_1 = __importDefault(require("ioredis"));
const redis = new ioredis_1.default(process.env.REDIS_URL, {
    enableOfflineQueue: false, // strict
    maxRetriesPerRequest: 2,
    tls: {}, // REQUIRED for Upstash
    lazyConnect: true // IMPORTANT
});
redis.on('connect', () => {
    console.log('[REDIS] connected');
});
redis.on('error', (err) => {
    console.error('[REDIS] error', err.message);
});
exports.default = redis;
