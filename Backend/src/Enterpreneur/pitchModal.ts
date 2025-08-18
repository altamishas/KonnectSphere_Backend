import mongoose from "mongoose";
import { Book } from "./pitchTypes";
const Schema = mongoose.Schema;

const bookSchema = new Schema<Book>(
  {
    title: {
      type: String,
      required: true,
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    genre: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    pdfFile: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model<Book>("Book", bookSchema);
