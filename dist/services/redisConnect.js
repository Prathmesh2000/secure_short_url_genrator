"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectRedis = connectRedis;
const redis_1 = __importDefault(require("./redis"));
async function connectRedis() {
    if (redis_1.default.status === 'ready' ||
        redis_1.default.status === 'connecting' ||
        redis_1.default.status === 'reconnecting') {
        return;
    }
    if (redis_1.default.status === 'wait') {
        await redis_1.default.connect();
        return;
    }
    throw new Error(`Redis in unexpected state: ${redis_1.default.status}`);
}
