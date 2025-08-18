import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";
import User from "../user/userModel";
import PasswordResetToken from "./resetPasswordModal";
import createHttpError from "http-errors";
import bcrypt from "bcryptjs";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";
import crypto from "crypto";
import emailService from "../utils/emailService";

/**
 * Request password reset by email
 * @route POST /api/users/forgot-password
 * @access Public
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        createHttpError(
          400,
          errors
            .array()
            .map((err) => err.msg)
            .join(", ")
        )
      );
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message:
          "If your email exists in our system, you will receive a password reset link.",
      });
    }

    await PasswordResetToken.deleteMany({ userId: user._id });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await new PasswordResetToken({
      userId: user._id,
      token: hashedToken,
      expiresAt: new Date(
        Date.now() + config.PASSWORD_RESET_EXPIRY * 60 * 1000
      ),
    }).save();

    await emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.fullName
    );

    res.status(200).json({
      message:
        "If your email exists in our system, you will receive a password reset link.",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify password reset token
 * @route GET /api/users/reset-password/:token
 * @access Public
 */
export const verifyResetToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const resetToken = await PasswordResetToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
      isUsed: false,
    });

    if (!resetToken) {
      return next(
        createHttpError(400, "Invalid or expired password reset token")
      );
    }

    res.status(200).json({
      message: "Token is valid",
      userId: resetToken.userId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password with token
 * @route POST /api/users/reset-password/:token
 * @access Public
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(
        createHttpError(
          400,
          errors
            .array()
            .map((err) => err.msg)
            .join(", ")
        )
      );
    }

    const { token } = req.params;
    const { password } = req.body;
    console.log("Backend method called ", password);

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const resetToken = await PasswordResetToken.findOne({
      token: hashedToken,
      expiresAt: { $gt: new Date() },
      isUsed: false,
    });

    if (!resetToken) {
      return next(
        createHttpError(400, "Invalid or expired password reset token")
      );
    }

    const user = await User.findById(resetToken.userId);
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;
    await user.save();

    resetToken.isUsed = true;
    await resetToken.save();

    await emailService.sendPasswordResetSuccessEmail(user.email, user.fullName);

    const authToken = sign(
      { sub: user._id },
      config.JSON_WEB_TOKEN_SECRET as string,
      {
        expiresIn: "3d",
      }
    );

    res.cookie("token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      message: "Password reset successful. You are now logged in.",
    });
  } catch (error) {
    next(error);
  }
};
