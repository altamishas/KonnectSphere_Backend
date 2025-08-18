import express from "express";
import { submitContactForm } from "./contactController";

const contactRouter = express.Router();

// POST /api/contact - Submit contact form
contactRouter.post("/", submitContactForm);

export default contactRouter;
