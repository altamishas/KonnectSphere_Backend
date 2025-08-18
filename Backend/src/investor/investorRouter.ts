import express, { RequestHandler } from "express";
import { body } from "express-validator";
import {
  searchInvestors,
  getInvestorById,
  updateInvestorProfile,
  toggleStarInvestor,
  connectWithInvestor,
  sendMessageToInvestor,
  testInvestorFiltering,
  getPreferredPitches,
} from "./investorController";
import tokenVerification from "../middlewares/tokenVerification";

const investorRouter = express.Router();

// Public routes (no authentication required)

// GET routes
investorRouter.get("/search", searchInvestors);

// Add preferred pitches route (protected)
investorRouter.get(
  "/preferred-pitches",
  tokenVerification,
  getPreferredPitches
);

investorRouter.get("/test-filtering", testInvestorFiltering);

investorRouter.get("/:id", getInvestorById);

// Protected routes (authentication required)

// Update investor profile (only for the investor themselves)
investorRouter.put(
  "/profile",
  tokenVerification,
  [
    body("professionalBackground")
      .optional()
      .isLength({ min: 10, max: 2000 })
      .withMessage(
        "Professional background must be between 10 and 2000 characters"
      ),

    body("areasOfExpertise")
      .optional()
      .custom((value) => {
        if (typeof value === "string") {
          const areas = value.split(",").map((area: string) => area.trim());
          if (areas.length > 10) {
            throw new Error("Maximum 10 areas of expertise allowed");
          }
          for (const area of areas) {
            if (area.length < 2 || area.length > 50) {
              throw new Error(
                "Each area of expertise must be between 2 and 50 characters"
              );
            }
          }
        }
        return true;
      }),

    body("investmentRange.min")
      .optional()
      .isNumeric()
      .withMessage("Minimum investment range must be a number"),

    body("investmentRange.max")
      .optional()
      .isNumeric()
      .withMessage("Maximum investment range must be a number")
      .custom((value, { req }) => {
        if (
          req.body.investmentRange?.min &&
          value <= req.body.investmentRange.min
        ) {
          throw new Error(
            "Maximum investment range must be greater than minimum"
          );
        }
        return true;
      }),

    body("preferredIndustries")
      .optional()
      .custom((value) => {
        if (typeof value === "string") {
          const industries = value
            .split(",")
            .map((industry: string) => industry.trim());
          if (industries.length > 15) {
            throw new Error("Maximum 15 preferred industries allowed");
          }
        }
        return true;
      }),

    body("investmentStage")
      .optional()
      .isArray()
      .withMessage("Investment stage must be an array"),
    body("pastInvestments")
      .optional()
      .isNumeric()
      .withMessage("Past investments must be a number")
      .isInt({ min: 0 })
      .withMessage("Past investments cannot be negative"),

    body("linkedinUrl")
      .optional()
      .custom((value) => {
        if (value && value.trim() !== "" && !value.match(/^https?:\/\/.+/)) {
          throw new Error("LinkedIn URL must be a valid URL");
        }
        return true;
      }),

    body("website")
      .optional()
      .custom((value) => {
        if (value && value.trim() !== "" && !value.match(/^https?:\/\/.+/)) {
          throw new Error("Website must be a valid URL");
        }
        return true;
      }),
  ],
  updateInvestorProfile as RequestHandler
);

// Star/Unstar investor
investorRouter.post(
  "/:investorId/star",
  tokenVerification,
  [
    body("action")
      .isIn(["star", "unstar"])
      .withMessage("Action must be either 'star' or 'unstar'"),
  ],
  toggleStarInvestor as RequestHandler
);

// Connect with investor
investorRouter.post(
  "/:investorId/connect",
  tokenVerification,
  [
    body("message")
      .optional()
      .isLength({ max: 500 })
      .withMessage("Message cannot exceed 500 characters"),
  ],
  connectWithInvestor as RequestHandler
);

// Send message to investor
investorRouter.post(
  "/:investorId/message",
  tokenVerification,
  [
    body("message")
      .notEmpty()
      .withMessage("Message content is required")
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message must be between 1 and 1000 characters"),
  ],
  sendMessageToInvestor as RequestHandler
);

export default investorRouter;
