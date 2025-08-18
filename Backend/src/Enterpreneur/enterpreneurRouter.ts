import express from "express";
import path from "node:path";
import { postCreatePitch } from "./pitchController";
import multer from "multer";
import tokenVerification from "../middlewares/tokenVerification";
const enterpreneurRouter = express.Router();
//==========Multer Configuration=======
const uploadMulter = multer({
  dest: path.resolve(__dirname, "../../public/data/Uploads"),
  limits: { fileSize: 3e7 }, //3e7 ==>30mb
});

enterpreneurRouter.post(
  "/create-pitch",
  tokenVerification,

  uploadMulter.fields([
    { name: "pdfFile", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),

  postCreatePitch
);

export default enterpreneurRouter;
