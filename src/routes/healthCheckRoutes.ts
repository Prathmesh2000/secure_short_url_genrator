import express, { Request, Response } from "express";
import { success } from "../http/responce";
import db from "../services/db";
import { HttpStatusCodes } from "../http/statusCodes";
import { AppError } from "../http/errors";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

router.get("/", asyncHandler(async(req: Request, res: Response) => {
    try {
        await db.query('SELECT 1');
        console.log('[DB] connection verified');
        success(res, { message: "Health check passed" });
    } catch (error) {
        console.error('[DB] connection error', error);
        throw new AppError('Database connection failed', HttpStatusCodes.INTERNAL_SERVER_ERROR);
    }
}));

export default router;