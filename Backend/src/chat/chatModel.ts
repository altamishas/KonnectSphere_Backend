import mongoose, { Schema, Document } from "mongoose";

// Conversation interface
export interface IConversation extends Document {
  participants: {
    investor: mongoose.Types.ObjectId;
    entrepreneur: mongoose.Types.ObjectId;
  };
  pitchId: mongoose.Types.ObjectId;
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Message interface
export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  content: string;
  messageType: "text" | "image" | "file";
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Conversation Schema
const conversationSchema = new Schema<IConversation>(
  {
    participants: {
      investor: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      entrepreneur: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    pitchId: {
      type: Schema.Types.ObjectId,
      ref: "Pitch",
      required: true,
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Message Schema
const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    messageType: {
      type: String,
      enum: ["text", "image", "file"],
      default: "text",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
conversationSchema.index(
  { "participants.investor": 1, "participants.entrepreneur": 1, pitchId: 1 },
  { unique: true }
);
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ isActive: 1 });

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

// Create and export models
export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);
export const Message = mongoose.model<IMessage>("Message", messageSchema);
