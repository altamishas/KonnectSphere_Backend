import { User } from "../types";

// Message types
export interface Message {
  _id: string;
  conversationId: string;
  senderId: string | User;
  receiverId: string | User;
  content: string;
  messageType: "text" | "image" | "file";
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Conversation types
export interface Conversation {
  _id: string;
  participants: {
    investor: User;
    entrepreneur: User;
  };
  pitchId: string | PitchInfo;
  lastMessage?: Message;
  lastMessageAt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Pitch info for conversation context
export interface PitchInfo {
  _id: string;
  companyInfo: {
    pitchTitle: string;
    description: string;
    country: string;
    industry1?: string;
  };
  media: {
    logo?: {
      url: string;
    };
  };
}

// Chat API responses
export interface ConversationsResponse {
  success: boolean;
  data: Conversation[];
}

export interface ConversationResponse {
  success: boolean;
  data: Conversation;
}

export interface MessagesResponse {
  success: boolean;
  data: {
    messages: Message[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalMessages: number;
      hasMore: boolean;
    };
  };
}

export interface SendMessageResponse {
  success: boolean;
  message: string;
  data: Message;
}

export interface InitiateConversationResponse {
  success: boolean;
  message: string;
  data: {
    conversation: Conversation;
    initialMessage: Message;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}

// Socket event types
export interface SocketEvents {
  // Emitted events (client to server)
  join_conversation: (data: { conversationId: string }) => void;
  leave_conversation: (data: { conversationId: string }) => void;
  send_message: (data: {
    conversationId: string;
    content: string;
    messageType?: "text" | "image" | "file";
  }) => void;
  mark_as_read: (data: { conversationId: string }) => void;
  typing_start: (data: { conversationId: string }) => void;
  typing_stop: (data: { conversationId: string }) => void;

  // Received events (server to client)
  new_message: (data: { message: Message; conversationId: string }) => void;
  conversation_updated: (data: {
    conversationId: string;
    lastMessage: Message;
    lastMessageAt: string;
  }) => void;
  conversation_joined: (data: { conversationId: string }) => void;
  conversation_deleted: (data: { conversationId: string }) => void;
  messages_read: (data: {
    conversationId: string;
    readBy: string;
    readAt: string;
  }) => void;
  user_typing: (data: { userId: string; conversationId: string }) => void;
  user_stopped_typing: (data: {
    userId: string;
    conversationId: string;
  }) => void;
  user_online: (data: { userId: string }) => void;
  user_offline: (data: { userId: string }) => void;
  user_joined_conversation: (data: {
    userId: string;
    conversationId: string;
  }) => void;
  user_left_conversation: (data: {
    userId: string;
    conversationId: string;
  }) => void;
  error: (data: { message: string }) => void;
}

// Chat state types
export interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  typingUsers: Set<string>;
  onlineUsers: Set<string>;
}

// Request types
export interface InitiateConversationRequest {
  pitchId: string;
  message: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  messageType?: "text" | "image" | "file";
}

// Component props types
export interface ChatSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onConversationSelect: (conversation: Conversation) => void;
  unreadCount: number;
  isLoading: boolean;
}

export interface ChatMessageAreaProps {
  conversation: Conversation | null;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  typingUsers: Set<string>;
}

export interface PitchInfoPanelProps {
  pitch: PitchInfo | null;
  conversation: Conversation | null;
}

export interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
}

export interface AskQuestionModalProps {
  pitch: PitchInfo;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  isLoading: boolean;
}
