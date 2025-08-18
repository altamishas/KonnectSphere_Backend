import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import { verify } from "jsonwebtoken";
import { config } from "../config/config";

export interface AuthRequest extends Request {
  userId: string;
}

const tokenVerification = (req: Request, res: Response, next: NextFunction) => {
  // Try to get token from cookie first
  let token = req.cookies.token;

  // If no token in cookie, check Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    return next(
      createHttpError(
        401,
        "Authentication required. Please log in to access this resource."
      )
    );
  }

  // Verify token
  try {
    const payload = verify(token, config.JSON_WEB_TOKEN_SECRET as string);
    // Add the userID from token to req object for further use
    const _req = req as AuthRequest;
    _req.userId = payload.sub as string;
    // If token is valid then next()
    next();
  } catch (error) {
    const isExpired =
      error instanceof Error && error.name === "TokenExpiredError";
    const message = isExpired
      ? "Your session has expired. Please log in again."
      : "Invalid authentication token. Please log in again.";
    return next(createHttpError(401, message));
  }
};

// Optional token verification - sets userId if token exists but doesn't fail if missing
export const optionalTokenVerification = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Try to get token from cookie first
  let token = req.cookies.token;

  // If no token in cookie, check Authorization header
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  // If no token, continue without authentication
  if (!token) {
    return next();
  }

  // Verify token if it exists
  try {
    const payload = verify(token, config.JSON_WEB_TOKEN_SECRET as string);
    // Add the userID from token to req object for further use
    const _req = req as AuthRequest;
    _req.userId = payload.sub as string;
    console.log("🔐 Optional auth: User authenticated with ID:", _req.userId);
    next();
  } catch {
    console.log(
      "🔐 Optional auth: Invalid token, continuing without authentication"
    );
    // Continue without authentication even if token is invalid
    next();
  }
};

export default tokenVerification;
