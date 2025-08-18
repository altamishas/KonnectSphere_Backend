import { Response, NextFunction } from "express";
import createHttpError from "http-errors";
import mongoose from "mongoose";
import { Conversation, Message, IConversation } from "./chatModel";
import User from "../user/userModel";
import Pitch from "../pitch/pitchModel";
import { AuthRequest } from "../middlewares/tokenVerification";
import { emitConversationDeleted } from "../socket/socketHandler";

// Get user's conversations
export const getUserConversations = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    let conversations: IConversation[];

    if (user.role === "Investor") {
      conversations = await Conversation.find({
        "participants.investor": userId,
        isActive: true,
      })
        .populate("participants.entrepreneur", "fullName avatarImage email")
        .populate("pitchId", "companyInfo pitchDeal media isPremium userId")
        .populate("lastMessage")
        .sort({ lastMessageAt: -1 });
    } else {
      conversations = await Conversation.find({
        "participants.entrepreneur": userId,
        isActive: true,
      })
        .populate("participants.investor", "fullName avatarImage email")
        .populate("pitchId", "companyInfo pitchDeal media isPremium userId")
        .populate("lastMessage")
        .sort({ lastMessageAt: -1 });
    }

    res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("Error getting user conversations:", error);
    next(createHttpError(500, "Failed to get conversations"));
  }
};

// Get conversation by ID
export const getConversationById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    if (!mongoose.isValidObjectId(conversationId)) {
      return next(createHttpError(400, "Invalid conversation ID"));
    }

    const conversation = await Conversation.findById(conversationId)
      .populate("participants.investor", "fullName avatarImage email role")
      .populate("participants.entrepreneur", "fullName avatarImage email role")
      .populate("pitchId", "companyInfo media")
      .populate("lastMessage");

    if (!conversation) {
      return next(createHttpError(404, "Conversation not found"));
    }

    // Check if user is a participant
    const isParticipant =
      conversation.participants.investor._id.toString() === userId ||
      conversation.participants.entrepreneur._id.toString() === userId;

    if (!isParticipant) {
      return next(createHttpError(403, "Access denied to this conversation"));
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("Error getting conversation:", error);
    next(createHttpError(500, "Failed to get conversation"));
  }
};

// Get messages for a conversation
export const getConversationMessages = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    if (!mongoose.isValidObjectId(conversationId)) {
      return next(createHttpError(400, "Invalid conversation ID"));
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(createHttpError(404, "Conversation not found"));
    }

    const isParticipant =
      conversation.participants.investor.toString() === userId ||
      conversation.participants.entrepreneur.toString() === userId;

    if (!isParticipant) {
      return next(createHttpError(403, "Access denied to this conversation"));
    }

    // Get messages with pagination (newest first)
    const messages = await Message.find({ conversationId })
      .populate("senderId", "fullName avatarImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Reverse for chronological order (oldest first)
    messages.reverse();

    // Mark messages as read for the current user
    await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    const totalMessages = await Message.countDocuments({ conversationId });
    const totalPages = Math.ceil(totalMessages / limit);

    res.status(200).json({
      success: true,
      data: {
        messages,
        pagination: {
          currentPage: page,
          totalPages,
          totalMessages,
          hasMore: page < totalPages,
        },
      },
    });
  } catch (error) {
    console.error("Error getting conversation messages:", error);
    next(createHttpError(500, "Failed to get messages"));
  }
};

// Initiate a new conversation (investor only)
export const initiateConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { pitchId, message } = req.body;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    if (!pitchId || !message) {
      return next(
        createHttpError(400, "Pitch ID and initial message are required")
      );
    }

    if (!mongoose.isValidObjectId(pitchId)) {
      return next(createHttpError(400, "Invalid pitch ID"));
    }

    // Get user and verify they are an investor with proper subscription
    const user = await User.findById(userId);
    if (!user) {
      return next(createHttpError(404, "User not found"));
    }

    if (user.role !== "Investor") {
      return next(
        createHttpError(403, "Only investors can initiate conversations")
      );
    }

    if (user.subscriptionPlan !== "Investor Access Plan") {
      return next(
        createHttpError(
          403,
          "Investor Access Plan required to contact entrepreneurs"
        )
      );
    }

    // Get pitch and verify it exists
    const pitch = await Pitch.findById(pitchId).populate(
      "userId",
      "fullName role"
    );
    if (!pitch) {
      return next(createHttpError(404, "Pitch not found"));
    }

    if (pitch.status !== "published") {
      return next(
        createHttpError(403, "Can only contact about published pitches")
      );
    }

    const entrepreneur = pitch.userId as any;
    if (!entrepreneur || entrepreneur.role !== "Entrepreneur") {
      return next(createHttpError(404, "Entrepreneur not found"));
    }

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      "participants.investor": userId,
      "participants.entrepreneur": entrepreneur._id,
      pitchId: pitchId,
    });

    if (conversation) {
      return res.status(200).json({
        success: true,
        message: "Conversation already exists",
        data: { conversationId: conversation._id },
      });
    }

    // Create new conversation
    conversation = new Conversation({
      participants: {
        investor: userId,
        entrepreneur: entrepreneur._id,
      },
      pitchId: pitchId,
      lastMessageAt: new Date(),
    });

    await conversation.save();

    // Create initial message
    const initialMessage = new Message({
      conversationId: conversation._id,
      senderId: userId,
      receiverId: entrepreneur._id,
      content: message,
      messageType: "text",
    });

    await initialMessage.save();

    // Update conversation with last message
    conversation.lastMessage = initialMessage._id as any;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate for response
    await conversation.populate(
      "participants.investor",
      "fullName avatarImage email"
    );
    await conversation.populate(
      "participants.entrepreneur",
      "fullName avatarImage email"
    );
    await conversation.populate(
      "pitchId",
      "companyInfo.pitchTitle companyInfo.industry1 media.logo"
    );

    res.status(201).json({
      success: true,
      message: "Conversation initiated successfully",
      data: {
        conversation,
        initialMessage,
      },
    });
  } catch (error) {
    console.error("Error initiating conversation:", error);
    next(createHttpError(500, "Failed to initiate conversation"));
  }
};

// Send a message
export const sendMessage = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    const { content, messageType = "text" } = req.body;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    if (!content) {
      return next(createHttpError(400, "Message content is required"));
    }

    if (!mongoose.isValidObjectId(conversationId)) {
      return next(createHttpError(400, "Invalid conversation ID"));
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(createHttpError(404, "Conversation not found"));
    }

    const isParticipant =
      conversation.participants.investor.toString() === userId ||
      conversation.participants.entrepreneur.toString() === userId;

    if (!isParticipant) {
      return next(createHttpError(403, "Access denied to this conversation"));
    }

    // Determine receiver
    const receiverId =
      conversation.participants.investor.toString() === userId
        ? conversation.participants.entrepreneur
        : conversation.participants.investor;

    // Create message
    const message = new Message({
      conversationId,
      senderId: userId,
      receiverId,
      content,
      messageType,
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id as any;
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate message for response
    await message.populate("senderId", "fullName avatarImage");

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    next(createHttpError(500, "Failed to send message"));
  }
};

// Mark messages as read
export const markMessagesAsRead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    if (!mongoose.isValidObjectId(conversationId)) {
      return next(createHttpError(400, "Invalid conversation ID"));
    }

    // Verify user is part of conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(createHttpError(404, "Conversation not found"));
    }

    const isParticipant =
      conversation.participants.investor.toString() === userId ||
      conversation.participants.entrepreneur.toString() === userId;

    if (!isParticipant) {
      return next(createHttpError(403, "Access denied to this conversation"));
    }

    // Mark unread messages as read
    const result = await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
      data: { updatedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    next(createHttpError(500, "Failed to mark messages as read"));
  }
};

// Get unread message count
export const getUnreadCount = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    next(createHttpError(500, "Failed to get unread count"));
  }
};

// Delete conversation and all its messages
export const deleteConversation = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    if (!userId) {
      return next(createHttpError(401, "User not authenticated"));
    }

    if (!mongoose.isValidObjectId(conversationId)) {
      return next(createHttpError(400, "Invalid conversation ID"));
    }

    // Verify conversation exists and user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return next(createHttpError(404, "Conversation not found"));
    }

    const isParticipant =
      conversation.participants.investor.toString() === userId ||
      conversation.participants.entrepreneur.toString() === userId;

    if (!isParticipant) {
      return next(createHttpError(403, "Access denied to this conversation"));
    }

    // Delete all messages in this conversation first
    const deletedMessages = await Message.deleteMany({
      conversationId: conversationId,
    });

    // Delete the conversation
    await Conversation.findByIdAndDelete(conversationId);

    // Emit socket event to notify other participants
    emitConversationDeleted(conversationId);

    console.log(
      `🗑️ Deleted conversation ${conversationId} and ${deletedMessages.deletedCount} messages`
    );

    res.status(200).json({
      success: true,
      message: "Conversation and all messages deleted successfully",
      data: {
        deletedMessagesCount: deletedMessages.deletedCount,
        conversationId: conversationId,
      },
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    next(createHttpError(500, "Failed to delete conversation"));
  }
};
