import express from "express";
import {
  addToFavourites,
  removeFromFavourites,
  getFavourites,
  checkFavouriteStatus,
  getFavouritesCount,
} from "./favouritesController";
import tokenVerification from "../middlewares/tokenVerification";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(tokenVerification);

// @route   POST /api/favourites
// @desc    Add pitch to favourites
// @access  Private (Investor only)
router.post("/", addToFavourites);

// @route   DELETE /api/favourites/:pitchId
// @desc    Remove pitch from favourites
// @access  Private (Investor only)
router.delete("/:pitchId", removeFromFavourites);

// @route   GET /api/favourites
// @desc    Get all favourite pitches for the investor
// @access  Private (Investor only)
router.get("/", getFavourites);

// @route   GET /api/favourites/check/:pitchId
// @desc    Check if a pitch is in favourites
// @access  Private (Investor only)
router.get("/check/:pitchId", checkFavouriteStatus);

// @route   GET /api/favourites/count
// @desc    Get favourite pitches count
// @access  Private (Investor only)
router.get("/count", getFavouritesCount);

export default router;
