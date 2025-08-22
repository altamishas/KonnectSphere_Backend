import axios from "axios";
import {
  ConversationsResponse,
  MessagesResponse,
  InitiateConversationRequest,
  InitiateConversationResponse,
  SendMessageRequest,
  SendMessageResponse,
  UnreadCountResponse,
  ConversationResponse,
} from "@/lib/types/chat";

// Configure axios with proper base URL for backend on port 8080
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080/api",
  withCredentials: true, // Important for HTTP-only cookies
});

export const chatService = {
  // Get user's conversations
  getConversations: async (): Promise<ConversationsResponse> => {
    const response = await api.get("/chat/conversations");
    return response.data;
  },

  // Get specific conversation by ID
  getConversationById: async (
    conversationId: string
  ): Promise<ConversationResponse> => {
    const response = await api.get(`/chat/conversations/${conversationId}`);
    return response.data;
  },

  // Get messages for a conversation
  getConversationMessages: async (
    conversationId: string
  ): Promise<MessagesResponse> => {
    const response = await api.get(
      `/chat/conversations/${conversationId}/messages`
    );
    return response.data;
  },

  // Initiate a new conversation
  initiateConversation: async (
    data: InitiateConversationRequest
  ): Promise<InitiateConversationResponse> => {
    const response = await api.post("/chat/conversations/initiate", data);
    return response.data;
  },

  // Send a message
  sendMessage: async (
    data: SendMessageRequest
  ): Promise<SendMessageResponse> => {
    const response = await api.post(
      `/chat/conversations/${data.conversationId}/messages`,
      {
        content: data.content,
        messageType: data.messageType,
      }
    );
    return response.data;
  },

  // Mark messages as read
  markMessagesAsRead: async (conversationId: string): Promise<void> => {
    await api.patch(`/chat/conversations/${conversationId}/read`);
  },

  // Delete conversation and all its messages
  deleteConversation: async (
    conversationId: string
  ): Promise<{
    success: boolean;
    message: string;
    data: { deletedMessagesCount: number; conversationId: string };
  }> => {
    const response = await api.delete(`/chat/conversations/${conversationId}`);
    return response.data;
  },

  // Get unread message count
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await api.get("/chat/unread-count");
    return response.data;
  },

  // Get entrepreneur details from a pitch
  getEntrepreneurFromPitch: async (
    pitchId: string
  ): Promise<{ entrepreneurId: string }> => {
    try {
      const response = await api.get(`/pitch/${pitchId}`);
      return {
        entrepreneurId:
          typeof response.data.data.userId === "string"
            ? response.data.data.userId
            : response.data.data.userId._id,
      };
    } catch (error) {
      console.error("Error getting entrepreneur from pitch:", error);
      throw error;
    }
  },

  // FIXED: Check if conversation exists for current user + specific pitch
  checkConversationExists: async (
    pitchId: string
  ): Promise<{ exists: boolean; conversationId?: string }> => {
    try {
      const conversations = await chatService.getConversations();

      // Find conversation that matches:
      // 1. Same pitch (pitchId)
      // 2. Current user is a participant (already filtered by getConversations)
      // This ensures we only find conversations for THIS user about THIS specific pitch
      const existingConversation = conversations.data.find((conv) => {
        const conversationPitchId =
          typeof conv.pitchId === "string" ? conv.pitchId : conv.pitchId._id;

        return conversationPitchId === pitchId;
      });

      if (existingConversation) {
        console.log(
          "✅ Found existing conversation for current user + pitch:",
          {
            conversationId: existingConversation._id,
            pitchId: pitchId,
            pitchTitle:
              typeof existingConversation.pitchId === "string"
                ? "Pitch Discussion"
                : existingConversation.pitchId.companyInfo.pitchTitle,
          }
        );
      } else {
        console.log(
          "🔍 No existing conversation found for current user + pitch:",
          pitchId
        );
      }

      return {
        exists: !!existingConversation,
        conversationId: existingConversation?._id,
      };
    } catch (error) {
      console.error("Error checking conversation existence:", error);
      return { exists: false };
    }
  },
};
