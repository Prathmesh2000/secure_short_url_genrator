"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const statusCodes_1 = require("./statusCodes");
const errors_1 = require("./errors");
const errorHandler = (err, req, res, next) => {
    if (err instanceof errors_1.AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message
        });
    }
    // Log unexpected errors
    console.error('[ERROR]', err);
    // Fallback for unknown errors
    return res.status(statusCodes_1.HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Internal server error'
    });
};
exports.errorHandler = errorHandler;
