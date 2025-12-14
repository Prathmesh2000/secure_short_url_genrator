import { HttpStatusCodes } from "./statusCodes";

class AppError extends Error {
    public statusCode: HttpStatusCodes;

    constructor(message: string, statusCode: HttpStatusCodes) {
        super(message);
        this.statusCode = statusCode;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends AppError {
    constructor(msg = 'Resource not found') {
        super(msg, HttpStatusCodes.NOT_FOUND);
    }
}

class ExpiredError extends AppError {
    constructor() {
        super('Short URL expired', HttpStatusCodes.GONE);
    }
}

class BadRequestError extends AppError {
    constructor(message: string = 'Bad request') {
        super(message, HttpStatusCodes.BAD_REQUEST);
    }
}

class ConflictError extends AppError {
    constructor(message: string = 'Conflict') {
        super(message, HttpStatusCodes.CONFLICT);
    }
}

export {
    AppError,
    NotFoundError,
    ExpiredError,
    BadRequestError,
    ConflictError
};