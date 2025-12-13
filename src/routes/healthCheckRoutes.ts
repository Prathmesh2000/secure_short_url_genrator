import express, { Request, Response } from "express";
import { success } from "../http/responce";
import db from "../services/db";
import { HttpStatusCodes } from "../http/statusCodes";

const router = express.Router();

router.get("/", async(req: Request, res: Response) => {
    const errorHandler = (res: Response, status: HttpStatusCodes, message: string) => {
        res.status(status).json({
            success: false,
            error: message
        });
    };
    try {
        await db.query('SELECT 1');
        console.log('[DB] connection verified');
        success(res, { message: "Health check passed" });
    } catch (error) {
        console.error('[DB] connection error', error);
        errorHandler(res, HttpStatusCodes.INTERNAL_SERVER_ERROR, 'Database connection failed');
    }
});

export default router;