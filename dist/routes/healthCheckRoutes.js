"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const responce_1 = require("../http/responce");
const db_1 = __importDefault(require("../services/db"));
const statusCodes_1 = require("../http/statusCodes");
const errors_1 = require("../http/errors");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = express_1.default.Router();
router.get("/", (0, asyncHandler_1.asyncHandler)(async (req, res) => {
    try {
        await db_1.default.query('SELECT 1');
        console.log('[DB] connection verified');
        (0, responce_1.success)(res, { message: "Health check passed" });
    }
    catch (error) {
        console.error('[DB] connection error', error);
        throw new errors_1.AppError('Database connection failed', statusCodes_1.HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
}));
exports.default = router;
