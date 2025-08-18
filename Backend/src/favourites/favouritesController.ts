import { Request, Response } from "express";
import { RequestHandler } from "express";
import { Favourite } from "./favouritesModel";
import Pitch from "../pitch/pitchModel";
import { asyncHandler } from "../middlewares/asyncHandler";

// Extend Request interface to include userId
interface AuthenticatedRequest extends Request {
  userId: string;
}

// Add pitch to favourites
export const addToFavourites: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { pitchId } = req.body;
    const investorId = (req as AuthenticatedRequest).userId;

    if (!investorId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!pitchId) {
      return res.status(400).json({
        success: false,
        message: "Pitch ID is required",
      });
    }

    // Check if pitch exists
    const pitch = await Pitch.findById(pitchId);
    if (!pitch) {
      return res.status(404).json({
        success: false,
        message: "Pitch not found",
      });
    }

    // Check if already in favourites
    const existingFavourite = await Favourite.findOne({
      investor: investorId,
      pitch: pitchId,
    });

    if (existingFavourite) {
      return res.status(400).json({
        success: false,
        message: "Pitch already in favourites",
      });
    }

    // Add to favourites
    const favourite = new Favourite({
      investor: investorId,
      pitch: pitchId,
    });

    await favourite.save();

    res.status(201).json({
      success: true,
      message: "Pitch added to favourites successfully",
      data: favourite,
    });
  }
);

// Remove pitch from favourites
export const removeFromFavourites: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { pitchId } = req.params;
    const investorId = (req as AuthenticatedRequest).userId;

    if (!investorId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const favourite = await Favourite.findOneAndDelete({
      investor: investorId,
      pitch: pitchId,
    });

    if (!favourite) {
      return res.status(404).json({
        success: false,
        message: "Favourite not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Pitch removed from favourites successfully",
    });
  }
);

// Get all favourite pitches for the investor
export const getFavourites: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const investorId = (req as AuthenticatedRequest).userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const skip = (page - 1) * limit;

    if (!investorId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get favourite pitches with pagination
    const favourites = await Favourite.find({ investor: investorId })
      .populate({
        path: "pitch",
        populate: [
          {
            path: "userId",
            select: "name email avatar company location",
          },
        ],
      })
      .sort({ addedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count for pagination
    const totalFavourites = await Favourite.countDocuments({
      investor: investorId,
    });

    // Extract pitch data
    const pitches = favourites.map((fav) => fav.pitch).filter((pitch) => pitch); // Filter out null pitches (in case pitch was deleted)

    res.status(200).json({
      success: true,
      data: pitches,
      pagination: {
        page,
        limit,
        total: totalFavourites,
        totalPages: Math.ceil(totalFavourites / limit),
      },
    });
  }
);

// Check if a pitch is in favourites
export const checkFavouriteStatus: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const { pitchId } = req.params;
    const investorId = (req as AuthenticatedRequest).userId;

    if (!investorId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const favourite = await Favourite.findOne({
      investor: investorId,
      pitch: pitchId,
    });

    res.status(200).json({
      success: true,
      data: {
        isFavourite: !!favourite,
      },
    });
  }
);

// Get favourite pitches count
export const getFavouritesCount: RequestHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const investorId = (req as AuthenticatedRequest).userId;

    if (!investorId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const count = await Favourite.countDocuments({ investor: investorId });

    res.status(200).json({
      success: true,
      data: {
        count,
      },
    });
  }
);
