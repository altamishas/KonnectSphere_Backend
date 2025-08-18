import express, { RequestHandler } from "express";
import { body, param } from "express-validator";
import tokenVerification from "../middlewares/tokenVerification";
import {
  getUserConversations,
  getConversationById,
  getConversationMessages,
  initiateConversation,
  sendMessage,
  markMessagesAsRead,
  getUnreadCount,
  deleteConversation,
} from "./chatController";

const chatRouter = express.Router();

// All chat routes require authentication
chatRouter.use(tokenVerification);

// Get user's conversations
chatRouter.get("/conversations", getUserConversations as RequestHandler);

// Get specific conversation by ID
chatRouter.get(
  "/conversations/:conversationId",
  [param("conversationId").isMongoId().withMessage("Invalid conversation ID")],
  getConversationById as RequestHandler
);

// Get messages for a conversation
chatRouter.get(
  "/conversations/:conversationId/messages",
  [param("conversationId").isMongoId().withMessage("Invalid conversation ID")],
  getConversationMessages as RequestHandler
);

// Initiate a new conversation (investor only)
chatRouter.post(
  "/conversations/initiate",
  [
    body("pitchId").isMongoId().withMessage("Valid pitch ID is required"),
    body("message")
      .notEmpty()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message must be between 1 and 1000 characters"),
  ],
  initiateConversation as RequestHandler
);

// Send a message
chatRouter.post(
  "/conversations/:conversationId/messages",
  [
    param("conversationId").isMongoId().withMessage("Invalid conversation ID"),
    body("content")
      .notEmpty()
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage("Message content must be between 1 and 1000 characters"),
    body("messageType")
      .optional()
      .isIn(["text", "image", "file"])
      .withMessage("Invalid message type"),
  ],
  sendMessage as RequestHandler
);

// Mark messages as read
chatRouter.patch(
  "/conversations/:conversationId/read",
  [param("conversationId").isMongoId().withMessage("Invalid conversation ID")],
  markMessagesAsRead as RequestHandler
);

// Delete conversation and all its messages
chatRouter.delete(
  "/conversations/:conversationId",
  [param("conversationId").isMongoId().withMessage("Invalid conversation ID")],
  deleteConversation as RequestHandler
);

// Get unread message count
chatRouter.get("/unread-count", getUnreadCount as RequestHandler);

export default chatRouter;
