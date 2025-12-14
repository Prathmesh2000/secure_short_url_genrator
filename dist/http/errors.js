"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnauthorizedError = exports.ConflictError = exports.BadRequestError = exports.ExpiredError = exports.NotFoundError = exports.AppError = void 0;
const statusCodes_1 = require("./statusCodes");
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(msg = 'Resource not found') {
        super(msg, statusCodes_1.HttpStatusCodes.NOT_FOUND);
    }
}
exports.NotFoundError = NotFoundError;
class ExpiredError extends AppError {
    constructor() {
        super('Short URL expired', statusCodes_1.HttpStatusCodes.GONE);
    }
}
exports.ExpiredError = ExpiredError;
class BadRequestError extends AppError {
    constructor(message = 'Bad request') {
        super(message, statusCodes_1.HttpStatusCodes.BAD_REQUEST);
    }
}
exports.BadRequestError = BadRequestError;
class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, statusCodes_1.HttpStatusCodes.CONFLICT);
    }
}
exports.ConflictError = ConflictError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, statusCodes_1.HttpStatusCodes.UNAUTHORIZED);
    }
}
exports.UnauthorizedError = UnauthorizedError;
