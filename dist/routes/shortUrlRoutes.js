"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const asyncHandler_1 = require("../utils/asyncHandler");
const shortUrlController_1 = require("../controllers/shortUrlController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
router.post('/generate', auth_1.requireAuth, (0, asyncHandler_1.asyncHandler)(shortUrlController_1.generateShortUrlController));
router.get('/:shortCode', (0, asyncHandler_1.asyncHandler)(shortUrlController_1.redirectShortUrlController));
exports.default = router;
