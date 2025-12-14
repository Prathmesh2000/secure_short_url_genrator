import express from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { generateShortUrlController, redirectShortUrlController } from "../controllers/shortUrlController";
import { requireAuth } from "../middleware/auth";
const router = express.Router();

router.post('/generate', requireAuth, asyncHandler(generateShortUrlController));
router.get('/:shortCode', asyncHandler(redirectShortUrlController));
export default router;