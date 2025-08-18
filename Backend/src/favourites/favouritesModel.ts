import mongoose, { Document, Schema, Types } from "mongoose";

// Interface for the Favourite document
export interface IFavourite extends Document {
  _id: Types.ObjectId;
  investor: Types.ObjectId; // Reference to User (investor)
  pitch: Types.ObjectId; // Reference to Pitch
  addedAt: Date;
}

// Favourite Schema
const favouriteSchema = new Schema<IFavourite>({
  investor: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  pitch: {
    type: Schema.Types.ObjectId,
    ref: "Pitch",
    required: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index to ensure unique investor-pitch combinations
favouriteSchema.index({ investor: 1, pitch: 1 }, { unique: true });

// Index for efficient querying by investor
favouriteSchema.index({ investor: 1, addedAt: -1 });

export const Favourite = mongoose.model<IFavourite>(
  "Favourite",
  favouriteSchema
);
