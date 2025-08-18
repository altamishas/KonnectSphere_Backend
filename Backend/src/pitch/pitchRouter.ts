import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import tokenVerification, {
  optionalTokenVerification,
} from "../middlewares/tokenVerification";
import {
  checkPitchLimit,
  checkDocumentAccess,
} from "../middlewares/subscriptionAccessControl";
import {
  getPitchDraft,
  updateCompanyInfo,
  updatePitchDeal,
  updateTeam,
  updateMedia,
  updateDocuments,
  updatePackage,
  autoSavePitch,
  uploadFile,
  deleteFile,
  deletePitch,
  removeMediaFile,
  getUserPitches,
  getPublishedPitches,
  getFeaturedPitches,
  getPublicFeaturedPitches,
  getPitchById,
  getPitchByIdForOwner,
  cleanupEmptyDrafts,
  getPitchCount,
  testPitchData,
  testFiltering,
  checkPublishingRights,
  reactivateEntrepreneurSubscriptions,
} from "./pitchController";
import { asyncHandler } from "../middlewares/asyncHandler";

const pitchRouter = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

// File filter function
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check file types based on route
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|avi|mov|wmv|webm/;
  const allowedDocumentTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|txt/;

  const extname =
    allowedImageTypes.test(path.extname(file.originalname).toLowerCase()) ||
    allowedVideoTypes.test(path.extname(file.originalname).toLowerCase()) ||
    allowedDocumentTypes.test(path.extname(file.originalname).toLowerCase());

  const mimetype = /image\/.*|video\/.*|application\/.*|text\/.*/.test(
    file.mimetype
  );

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images, videos, and documents are allowed."
      )
    );
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: fileFilter,
});

// Configure specific upload middleware for different endpoints
const uploadTeamFiles = upload.fields([
  { name: "profileImage_0", maxCount: 1 },
  { name: "profileImage_1", maxCount: 1 },
  { name: "profileImage_2", maxCount: 1 },
  { name: "profileImage_3", maxCount: 1 },
  { name: "profileImage_4", maxCount: 1 },
  { name: "profileImage_5", maxCount: 1 },
  { name: "profileImage_6", maxCount: 1 },
  { name: "profileImage_7", maxCount: 1 },
  { name: "profileImage_8", maxCount: 1 },
  { name: "profileImage_9", maxCount: 1 },
]);

const uploadMediaFiles = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
  { name: "images", maxCount: 10 },
  { name: "uploadedVideo", maxCount: 1 },
]);

const uploadDocumentFiles = upload.fields([
  { name: "businessPlan", maxCount: 1 },
  { name: "financials", maxCount: 1 },
  { name: "pitchDeck", maxCount: 1 },
  { name: "executiveSummary", maxCount: 1 },
  { name: "additionalDocuments", maxCount: 5 },
]);

// Public routes with optional authentication (works for both authenticated and unauthenticated users)
pitchRouter.get("/published", optionalTokenVerification, getPublishedPitches);
pitchRouter.get("/public/featured", getPublicFeaturedPitches); // Public route for homepage (must come before /public/:id)
pitchRouter.get(
  "/public/:id",
  optionalTokenVerification,
  asyncHandler(getPitchById)
);
pitchRouter.get("/count", asyncHandler(getPitchCount));
pitchRouter.get("/featured", tokenVerification, getFeaturedPitches); // Keep existing route for other uses
pitchRouter.get("/test-data", asyncHandler(testPitchData));
pitchRouter.get("/test-filtering", asyncHandler(testFiltering));

// Protected routes (authentication required)
pitchRouter.use(tokenVerification); // Apply authentication middleware to all routes below

// Get pitch draft
pitchRouter.get("/draft", getPitchDraft);

// Step-by-step form updates
pitchRouter.put("/company-info", updateCompanyInfo);
pitchRouter.put("/pitch-deal", updatePitchDeal);
pitchRouter.put("/team", uploadTeamFiles, updateTeam);
pitchRouter.put("/media", uploadMediaFiles, updateMedia);
pitchRouter.put(
  "/documents",
  checkDocumentAccess as express.RequestHandler,
  uploadDocumentFiles,
  updateDocuments
);
pitchRouter.put(
  "/package",
  checkPitchLimit as express.RequestHandler,
  updatePackage
);

// Auto-save functionality
pitchRouter.post("/auto-save", autoSavePitch);

// File upload routes
pitchRouter.post("/upload/:fileType", upload.single("file"), uploadFile);
pitchRouter.delete("/file", deleteFile);
pitchRouter.delete("/media-file", removeMediaFile);

// Delete pitch
pitchRouter.delete("/:pitchId", deletePitch);

// Get user's pitches
pitchRouter.get("/my-pitches", getUserPitches);

// Get single pitch by ID for owner (authenticated)
pitchRouter.get("/my-pitch/:id", getPitchByIdForOwner);

// Cleanup empty drafts
pitchRouter.delete("/cleanup-drafts", cleanupEmptyDrafts);

// Check publishing rights for entrepreneurs
pitchRouter.get("/publishing-rights", checkPublishingRights);

// DEBUG ROUTES (development only)
pitchRouter.post(
  "/debug/reactivate-subscriptions",
  asyncHandler(reactivateEntrepreneurSubscriptions)
);

export default pitchRouter;
