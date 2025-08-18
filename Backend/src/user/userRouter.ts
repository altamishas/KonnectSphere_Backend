import express from "express";
import { body } from "express-validator";
const userRouter = express.Router();
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  passwordChangeHandler,
  userDeletionHandler,
  unsubscribeUser,
  resubscribeUser,
  logoutUser,
  getCurrentUser,
  verifyEmail,
  resendVerificationOTP,
  getFeaturedInvestors,
  getUserById,
  getUserContext,
  debugUserAvatar,
} from "./userController";
import User from "./userModel";
import tokenVerification from "../middlewares/tokenVerification";
import upload from "../middlewares/multter";
import {
  forgotPassword,
  resetPassword,
  verifyResetToken,
} from "../ResetPassword/resetPasswordController";
import { asyncHandler } from "../middlewares/asyncHandler";

// Validation for user registration
userRouter.post(
  "/register",
  [
    body("fullName", "Please enter a valid name").isLength({ min: 5 }).trim(),

    body("email", "Please enter a valid email")
      .isEmail()
      .normalizeEmail()
      .trim()
      .custom((value) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) {
            return Promise.reject("Email already exists. Try another.");
          }
        });
      }),

    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[@$!%*?&]/)
      .withMessage("Password must contain at least one special character"),

    body("role")
      .isIn(["Entrepreneur", "Investor"])
      .withMessage("Please select a valid role")
      .notEmpty()
      .withMessage("Role is required"),

    body("subscriptionPlan")
      .isIn(["Free", "Basic", "Premium", "Investor Access Plan"])
      .withMessage("Please select a valid subscription plan")
      .optional(),

    body("agreedToTerms")
      .isBoolean()
      .equals("true")
      .withMessage("You must agree to the terms and conditions")
      .notEmpty()
      .withMessage("You must agree to the terms"),
  ],
  registerUser
);
userRouter.get("/myProfile", tokenVerification, getUserProfile);
userRouter.put(
  "/updateProfile",
  tokenVerification,
  upload.fields([
    { name: "avatarImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
    { name: "companyLogo_0", maxCount: 1 },
    { name: "companyLogo_1", maxCount: 1 },
    { name: "companyLogo_2", maxCount: 1 },
    { name: "companyLogo_3", maxCount: 1 },
    { name: "companyLogo_4", maxCount: 1 },
  ]),
  asyncHandler(updateUserProfile)
);
userRouter.post(
  "/login",
  [
    body("email", "Please enter a valid email")
      .isEmail()
      .normalizeEmail()
      .trim(),
    body("password", "Please enter a valid password")
      .isLength({ min: 8 })
      .trim(),
  ],
  loginUser
);
userRouter.patch(
  "/updateProfile/changePassword",
  tokenVerification,
  passwordChangeHandler
);
userRouter.delete("/deleteUser", tokenVerification, userDeletionHandler);
userRouter.patch("/unsubscribe", tokenVerification, unsubscribeUser);
userRouter.patch("/resubscribe", tokenVerification, resubscribeUser);
userRouter.post("/logout", tokenVerification, logoutUser);

// Get current user
userRouter.get("/me", tokenVerification, getCurrentUser);

// Get user context (subscription and location)
userRouter.get("/context", tokenVerification, asyncHandler(getUserContext));

userRouter.post(
  "/forgot-password",
  [
    body("email", "Please enter a valid email")
      .isEmail()
      .normalizeEmail()
      .trim(),
  ],
  asyncHandler(forgotPassword)
);

userRouter.get("/reset-password/:token", verifyResetToken);

userRouter.post(
  "/reset-password/:token",
  [
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .matches(/[0-9]/)
      .withMessage("Password must contain at least one number")
      .matches(/[a-z]/)
      .withMessage("Password must contain at least one lowercase letter")
      .matches(/[A-Z]/)
      .withMessage("Password must contain at least one uppercase letter")
      .matches(/[@$!%*?&]/)
      .withMessage("Password must contain at least one special character"),
  ],
  resetPassword
);
userRouter.post(
  "/verify-email",
  [
    body("userId", "User ID is required").notEmpty(),
    body("otp", "Verification code is required")
      .isLength({ min: 6, max: 6 })
      .withMessage("Verification code must be 6 digits"),
  ],
  asyncHandler(verifyEmail)
);

// Resend verification OTP route
userRouter.post(
  "/resend-verification",
  [body("userId", "User ID is required").notEmpty()],
  asyncHandler(resendVerificationOTP)
);

// Get featured premium investors (public route)
userRouter.get("/featured-investors", asyncHandler(getFeaturedInvestors));

// Get user profile by ID (public)
userRouter.get("/profile/:id", asyncHandler(getUserById));

// Debug avatar endpoint
userRouter.get(
  "/debug/avatar",
  tokenVerification,
  asyncHandler(debugUserAvatar)
);

export default userRouter;
