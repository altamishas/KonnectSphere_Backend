import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { verify } from "jsonwebtoken";
import { config } from "../config/config";
import { Conversation, Message } from "../chat/chatModel";
import mongoose from "mongoose";

// Extend Socket interface to include user info
interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

// Types for socket events
interface MessageData {
  conversationId: string;
  content: string;
  messageType?: "text" | "image" | "file";
}

interface JoinConversationData {
  conversationId: string;
}

interface MarkAsReadData {
  conversationId: string;
}

interface TypingData {
  conversationId: string;
}

// Store active connections
const activeUsers = new Map<string, string>(); // userId -> socketId
const userSockets = new Map<string, string>(); // socketId -> userId

let io: SocketIOServer;

export const initializeSocket = (server: HTTPServer) => {
  console.log("🔌 Initializing Socket.IO server...");

  io = new SocketIOServer(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        config.FRONTEND_URL as string,
        "https://konect-sphere.vercel.app",
        "https://konnectsphere.vercel.app",
        "https://*.vercel.app",
      ],
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    transports: ["websocket", "polling"],
    pingTimeout: 60000,
    pingInterval: 25000,
    cookie: {
      name: "io",
      httpOnly: true,
      path: "/",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  });

  // Enhanced authentication middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      console.log("🔐 Attempting socket authentication...");
      console.log("🔍 Socket handshake auth:", socket.handshake.auth);
      console.log("🔍 Socket handshake headers:", socket.handshake.headers);

      // Try to get token from client-side auth first (fallback)
      let token = socket.handshake.auth.token;

      // If no token from client, try to get it from HTTP-only cookies
      if (!token) {
        const cookies = socket.handshake.headers.cookie;
        console.log("🍪 Received cookies:", cookies);

        if (cookies) {
          // Parse cookies to extract token
          const cookieArray = cookies.split(";");
          for (const cookie of cookieArray) {
            const [name, value] = cookie.trim().split("=");
            if (name === "token") {
              token = value;
              console.log("✅ Found token in cookies");
              break;
            }
          }
        }
      }

      if (!token) {
        console.log(
          "❌ Socket connection rejected: No token found in auth or cookies"
        );
        console.log("🔍 Available auth methods:", {
          authToken: !!socket.handshake.auth.token,
          cookies: !!socket.handshake.headers.cookie,
          authorization: !!socket.handshake.headers.authorization,
        });
        return next(new Error("Authentication error: No token provided"));
      }

      // Verify JWT token
      console.log("🔑 Verifying JWT token...");
      const payload = verify(token, config.JSON_WEB_TOKEN_SECRET as string) as {
        sub: string;
        role?: string;
      };

      // Add user info to socket
      socket.userId = payload.sub;
      socket.userRole = payload.role || "User";

      console.log(
        `✅ Socket authenticated for user: ${socket.userId} (${
          socket.userRole
        }) via ${socket.handshake.auth.token ? "auth" : "cookie"}`
      );
      next();
    } catch (error) {
      console.log("❌ Socket authentication failed:", error);
      console.log("🔍 Error details:", {
        message: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
      });
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // Handle connections
  io.on("connection", (socket: AuthenticatedSocket) => {
    console.log(`🔗 User connected: ${socket.userId} (${socket.id})`);

    // Store user connection
    if (socket.userId) {
      activeUsers.set(socket.userId, socket.id);
      userSockets.set(socket.id, socket.userId);

      // Notify others that user is online
      socket.broadcast.emit("user_online", { userId: socket.userId });
    }

    // Handle joining conversation
    socket.on("join_conversation", async (data: JoinConversationData) => {
      try {
        const { conversationId } = data;

        // Verify user is part of this conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        const isParticipant =
          conversation.participants.investor.toString() === socket.userId ||
          conversation.participants.entrepreneur.toString() === socket.userId;

        if (!isParticipant) {
          socket.emit("error", {
            message: "Not authorized to join this conversation",
          });
          return;
        }

        // Join the conversation room
        socket.join(conversationId);
        console.log(
          `👥 User ${socket.userId} joined conversation: ${conversationId}`
        );

        socket.emit("conversation_joined", { conversationId });
      } catch (error) {
        console.error("Error joining conversation:", error);
        socket.emit("error", { message: "Failed to join conversation" });
      }
    });

    // Handle leaving conversation
    socket.on("leave_conversation", (data: JoinConversationData) => {
      const { conversationId } = data;
      socket.leave(conversationId);
      console.log(
        `🚪 User ${socket.userId} left conversation: ${conversationId}`
      );
    });

    // Handle sending messages
    socket.on("send_message", async (data: MessageData) => {
      try {
        const { conversationId, content, messageType = "text" } = data;

        if (!content.trim()) {
          socket.emit("error", { message: "Message content cannot be empty" });
          return;
        }

        // Verify conversation exists and user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          socket.emit("error", { message: "Conversation not found" });
          return;
        }

        const isParticipant =
          conversation.participants.investor.toString() === socket.userId ||
          conversation.participants.entrepreneur.toString() === socket.userId;

        if (!isParticipant) {
          socket.emit("error", {
            message: "Not authorized to send messages in this conversation",
          });
          return;
        }

        // Determine receiver
        const receiverId =
          conversation.participants.investor.toString() === socket.userId
            ? conversation.participants.entrepreneur.toString()
            : conversation.participants.investor.toString();

        // Create new message
        const message = new Message({
          conversationId,
          senderId: socket.userId,
          receiverId,
          content: content.trim(),
          messageType,
          isRead: false,
        });

        await message.save();

        // Populate sender info for response
        await message.populate("senderId", "fullName avatarImage role");

        // Update conversation
        conversation.lastMessage = message._id as mongoose.Types.ObjectId;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        console.log(
          `📤 Message sent from ${socket.userId} in conversation ${conversationId}`
        );

        // Emit to all participants in the conversation
        io.to(conversationId).emit("new_message", {
          message,
          conversationId,
        });

        // Emit conversation update
        io.to(conversationId).emit("conversation_updated", {
          conversationId,
          lastMessage: message,
          lastMessageAt: conversation.lastMessageAt,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle marking messages as read
    socket.on("mark_as_read", async (data: MarkAsReadData) => {
      try {
        const { conversationId } = data;

        // Update all unread messages in this conversation for this user
        await Message.updateMany(
          {
            conversationId,
            receiverId: socket.userId,
            isRead: false,
          },
          {
            isRead: true,
            readAt: new Date(),
          }
        );

        // Emit to conversation participants
        io.to(conversationId).emit("messages_read", {
          conversationId,
          readBy: socket.userId,
          readAt: new Date(),
        });

        console.log(
          `✅ Messages marked as read by ${socket.userId} in conversation ${conversationId}`
        );
      } catch (error) {
        console.error("Error marking messages as read:", error);
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });

    // Handle typing indicators
    socket.on("typing_start", (data: TypingData) => {
      const { conversationId } = data;
      socket.to(conversationId).emit("user_typing", {
        userId: socket.userId,
        conversationId,
      });
    });

    socket.on("typing_stop", (data: TypingData) => {
      const { conversationId } = data;
      socket.to(conversationId).emit("user_stopped_typing", {
        userId: socket.userId,
        conversationId,
      });
    });

    // Handle disconnection
    socket.on("disconnect", (reason) => {
      console.log(
        `🔌 User disconnected: ${socket.userId} (${socket.id}) - Reason: ${reason}`
      );

      if (socket.userId) {
        // Remove from active users
        activeUsers.delete(socket.userId);
        userSockets.delete(socket.id);

        // Notify others that user is offline
        socket.broadcast.emit("user_offline", { userId: socket.userId });
      }
    });

    // Handle connection errors
    socket.on("error", (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  console.log("✅ Socket.IO server initialized successfully");
  return io;
};

// Helper function to emit conversation deletion to participants
export const emitConversationDeleted = (conversationId: string) => {
  if (io) {
    console.log(
      `📡 Emitting conversation_deleted event for: ${conversationId}`
    );
    io.to(conversationId).emit("conversation_deleted", { conversationId });
  }
};

// Export function to get io instance
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};
