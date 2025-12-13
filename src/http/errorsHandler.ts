import { Request, Response, NextFunction } from 'express';
import { HttpStatusCodes } from "./statusCodes";
import { AppError } from './errors';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Log unexpected errors
  console.error('[ERROR]', err);

  // Fallback for unknown errors
  return res.status(HttpStatusCodes.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: 'Internal server error'
  });
};
