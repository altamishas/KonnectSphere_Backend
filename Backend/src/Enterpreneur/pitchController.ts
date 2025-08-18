import { validationResult } from "express-validator";
import Book from "./pitchModal";
import { Request, Response, NextFunction } from "express";
import createHttpError from "http-errors";
import cloudinary from "../config/cloudinaryConfig";
import path from "path";
import fs from "fs";

const uploadToCloudinary = (
  FolderName: string,
  FileName: string,
  FilePath: string,
  Mimetype: string,
  resourceType: string = "auto"
) => {
  return cloudinary.uploader.upload(FilePath, {
    folder: FolderName,
    filename_override: FileName,
    format: Mimetype,
    resource_type: resourceType as "auto" | "raw" | "image" | "video",
  });
};
const postCreatePitch = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = createHttpError(403, "Validation Error Occurred");
    error.stack = errors
      .array()
      .map((err) => err.msg)
      .join(",");
    return next(error);
  }

  const files = req.files as {
    coverImage: Express.Multer.File[];
    pdfFile: Express.Multer.File[];
  };

  const coverfileName = files.coverImage[0].filename;
  const coverfilePath = path.resolve(
    __dirname,
    "../../public/data/Uploads",
    coverfileName
  );
  const coverImageMimeType = files.coverImage[0].mimetype.split("/")[1];

  const pdfFileName = files.pdfFile[0].filename;
  const pdfFilePath = path.resolve(
    __dirname,
    "../../public/data/Uploads",
    pdfFileName
  );
  const pdfFileMimeType = files.pdfFile[0].mimetype.split("/")[1];

  try {
    const [coverImageResult, pdfFileResult] = await Promise.all([
      uploadToCloudinary(
        "coverImages",
        coverfileName,
        coverfilePath,
        coverImageMimeType,
        "image"
      ),
      uploadToCloudinary(
        "booksPdf",
        pdfFileName,
        pdfFilePath,
        pdfFileMimeType,
        "raw"
      ),
    ]);

    const coverImageSecureUrl = coverImageResult.secure_url;
    const pdfFileSecureUrl = pdfFileResult.secure_url;

    // Database process
    const { title, genre } = req.body;
    const newBook = new Book({
      title,
      author: "66b4026fb802edbf7cc59538",
      genre,
      coverImage: coverImageSecureUrl,
      pdfFile: pdfFileSecureUrl,
    });

    // Delete the local files after successful upload
    await fs.promises.unlink(coverfilePath);
    await fs.promises.unlink(pdfFilePath);

    const book = await newBook.save();

    // Response
    res
      .status(201)
      .json({ message: "Pitch Created Successfully", id: book._id });
  } catch (error) {
    return next(error);
  }
};

export { postCreatePitch };
