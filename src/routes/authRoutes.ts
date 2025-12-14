import express from "express";
import { forgotPasswordController, loginController, resetPasswordController, signupController, verifySignupController } from "../controllers/authController";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

router.post('/signup', asyncHandler(signupController));
router.post('/verify-email', asyncHandler(verifySignupController));
router.post('/login', asyncHandler(loginController));
router.post('/forgot-password', asyncHandler(forgotPasswordController));
router.post('/reset-password', asyncHandler(resetPasswordController));

export default router;