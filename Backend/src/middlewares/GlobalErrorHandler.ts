import { NextFunction, Request, Response } from "express";
import { config } from "../config/config";
import { HttpError } from "http-errors";

const GlobalErrorHandler = (
  error: HttpError,
  req: Request,
  res: Response,
  // Express requires 4 parameters for error handlers, even if 'next' is unused
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const statusCode = error.statusCode || 500;

  // Improved error response format for better frontend handling
  const errorResponse = {
    success: false,
    message: error.message || "An unexpected error occurred",
    statusCode,
    ...(config.NODE_ENV === "development" && {
      stack: error.stack,
      details: error.stack ? error.stack.split("\n").slice(1, 4) : undefined,
    }),
  };

  // Log error for debugging
  console.error(`❌ ${req.method} ${req.path} - ${statusCode}:`, error.message);

  // Send consistent error response
  res.status(statusCode).json(errorResponse);
};

export default GlobalErrorHandler;
