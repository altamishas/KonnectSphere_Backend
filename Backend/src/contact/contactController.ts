import { Request, Response } from "express";
import emailService from "../utils/emailService";
import { asyncHandler } from "../middlewares/asyncHandler";

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
export const submitContactForm = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, email, subject, message }: ContactFormData = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      res.status(400);
      throw new Error("All fields are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400);
      throw new Error("Please provide a valid email address");
    }

    // Validate subject
    const validSubjects = [
      "technical-support",
      "billing-question",
      "feature-request",
      "bug-report",
      "account-support",
      "other",
    ];
    if (!validSubjects.includes(subject)) {
      res.status(400);
      throw new Error("Invalid subject selected");
    }

    try {
      // Send email to company
      await emailService.sendContactFormEmail({
        name,
        email,
        subject,
        message,
      });

      // Send confirmation email to user
      await emailService.sendContactFormConfirmation(email, name, subject);

      res.status(200).json({
        success: true,
        message:
          "Your message has been sent successfully. We'll get back to you soon!",
      });
    } catch (error) {
      console.error("Error sending contact form email:", error);
      res.status(500);
      throw new Error("Failed to send your message. Please try again later.");
    }
  }
);
