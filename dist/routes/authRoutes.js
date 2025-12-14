"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = require("../controllers/authController");
const asyncHandler_1 = require("../utils/asyncHandler");
const router = express_1.default.Router();
router.post('/signup', (0, asyncHandler_1.asyncHandler)(authController_1.signupController));
router.post('/verify-email', (0, asyncHandler_1.asyncHandler)(authController_1.verifySignupController));
router.post('/login', (0, asyncHandler_1.asyncHandler)(authController_1.loginController));
router.post('/forgot-password', (0, asyncHandler_1.asyncHandler)(authController_1.forgotPasswordController));
router.post('/reset-password', (0, asyncHandler_1.asyncHandler)(authController_1.resetPasswordController));
exports.default = router;
