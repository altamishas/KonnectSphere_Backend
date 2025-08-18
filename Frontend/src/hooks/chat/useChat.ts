import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSocket } from "./useSocket";
import { chatService } from "@/services/chat-service";
import {
  Conversation,
  Message,
  InitiateConversationRequest,
} from "@/lib/types/chat";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useAuthUser } from "@/hooks/auth/useAuthUser";

export const useChat = () => {
  const { handleError, handleSuccess, handleInfo } = useErrorHandler();
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [realtimeUnreadCount, setRealtimeUnreadCount] = useState<number>(0);
  const queryClient = useQueryClient();
  const { socket, isConnected, joinConversation, leaveConversation } =
    useSocket();
  const socketEventHandlersSetup = useRef(false);
  const { user } = useAuthUser();

  // Track the last active conversation to prevent stale updates
  const lastActiveConversationRef = useRef<string | null>(null);

  // Fetch conversations with more frequent updates
  const {
    data: conversationsData,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: chatService.getConversations,
    refetchOnWindowFocus: true,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Fetch active conversation details
  const { data: activeConversationData, isLoading: conversationLoading } =
    useQuery({
      queryKey: ["conversation", activeConversationId],
      queryFn: () =>
        activeConversationId
          ? chatService.getConversationById(activeConversationId)
          : null,
      enabled: !!activeConversationId,
      refetchOnWindowFocus: false,
    });

  // Fetch messages for active conversation
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ["messages", activeConversationId],
    queryFn: () =>
      activeConversationId
        ? chatService.getConversationMessages(activeConversationId)
        : null,
    enabled: !!activeConversationId,
    refetchOnWindowFocus: false,
  });

  // Fetch unread count with real-time updates
  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: chatService.getUnreadCount,
    refetchInterval: 10000, // More frequent updates
    refetchOnWindowFocus: true,
  });

  // Update realtime unread count when data changes
  useEffect(() => {
    if (unreadData?.data?.unreadCount !== undefined) {
      setRealtimeUnreadCount(unreadData.data.unreadCount);
    }
  }, [unreadData]);

  // Update last active conversation ref when activeConversationId changes
  useEffect(() => {
    lastActiveConversationRef.current = activeConversationId;
  }, [activeConversationId]);

  // Mutation for initiating conversation
  const initiateConversationMutation = useMutation({
    mutationFn: chatService.initiateConversation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setActiveConversationId(data.data.conversation._id);
      handleSuccess("Conversation started successfully!");
    },
    onError: (
      error: Error & { response?: { data?: { message?: string } } }
    ) => {
      handleError(error, "Failed to start conversation");
    },
  });

  // Mutation for sending messages via API (fallback)
  const sendMessageMutation = useMutation({
    mutationFn: chatService.sendMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", activeConversationId],
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
    onError: (
      error: Error & { response?: { data?: { message?: string } } }
    ) => {
      handleError(error, "Failed to send message");
    },
  });

  // Mutation for marking messages as read
  const markAsReadMutation = useMutation({
    mutationFn: chatService.markMessagesAsRead,
    onSuccess: (_, conversationId) => {
      console.log(
        "✅ Messages marked as read for conversation:",
        conversationId
      );
      // Refresh relevant data
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      handleSuccess("Messages marked as read");
    },
    onError: (
      error: Error & { response?: { data?: { message?: string } } }
    ) => {
      handleError(error, "Failed to mark messages as read");
    },
  });

  // Mutation for deleting conversation
  const deleteConversationMutation = useMutation({
    mutationFn: chatService.deleteConversation,
    onSuccess: (data, conversationId) => {
      console.log("🗑️ Conversation deleted successfully:", data);

      // If we deleted the active conversation, clear it
      if (activeConversationId === conversationId) {
        setActiveConversationId(null);
      }

      // Refresh conversations list and unread count
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });

      // Remove messages cache for this conversation
      queryClient.removeQueries({ queryKey: ["messages", conversationId] });
      queryClient.removeQueries({ queryKey: ["conversation", conversationId] });

      handleSuccess(
        `Chat deleted successfully! ${data.data.deletedMessagesCount} messages removed.`
      );
    },
    onError: (
      error: Error & { response?: { data?: { message?: string } } }
    ) => {
      handleError(error, "Failed to delete conversation");
    },
  });

  // FIXED: Enhanced socket event handlers with proper conversation isolation
  useEffect(() => {
    if (!socket || socketEventHandlersSetup.current) return;

    console.log("🔧 Setting up enhanced socket event handlers");

    // FIXED: Handle new messages with proper conversation isolation
    const handleNewMessage = (data: {
      message: Message;
      conversationId: string;
    }) => {
      console.log("📨 Received new message:", {
        conversationId: data.conversationId,
        content: data.message.content.substring(0, 50),
        senderId: data.message.senderId,
        currentUserId: user?._id,
        activeConversation: activeConversationId,
      });

      // Always update conversations list and unread count immediately
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });

      // Check if this message is for the currently active conversation
      if (data.conversationId === activeConversationId) {
        console.log("✅ Message is for ACTIVE conversation, updating messages");

        queryClient.setQueryData(
          ["messages", activeConversationId],
          (oldData: { data: { messages: Message[] } } | undefined) => {
            if (!oldData) return oldData;

            // FIXED: Remove temp messages first, then check for duplicates
            const messagesWithoutTemp = oldData.data.messages.filter(
              (msg) => !msg._id.startsWith("temp-")
            );

            // Check if this message already exists (avoid duplicates)
            const messageExists = messagesWithoutTemp.some(
              (msg: Message) => msg._id === data.message._id
            );

            if (!messageExists) {
              const updatedData = {
                ...oldData,
                data: {
                  ...oldData.data,
                  messages: [...messagesWithoutTemp, data.message],
                },
              };
              console.log(
                "✅ Message added to active conversation (replacing any temp messages)"
              );
              return updatedData;
            } else {
              console.log("ℹ️ Message already exists in active conversation");
              return oldData;
            }
          }
        );

        // Auto-mark as read for active conversation
        if (socket && isConnected && data.message.senderId !== user?._id) {
          console.log("📖 Auto-marking message as read (active conversation)");
          socket.emit("mark_as_read", { conversationId: data.conversationId });
        }
      } else {
        // FIXED: Added proper else statement - this is for messages in other conversations
        console.log(
          "📭 Message for DIFFERENT conversation, showing notification"
        );

        // Update conversation list to show new message
        queryClient.setQueryData(
          ["conversations"],
          (oldData: { data: Conversation[] } | undefined) => {
            if (!oldData) return oldData;

            return {
              ...oldData,
              data: oldData.data.map((conv) =>
                conv._id === data.conversationId
                  ? {
                      ...conv,
                      lastMessage: data.message,
                      lastMessageAt: new Date().toISOString(),
                    }
                  : conv
              ),
            };
          }
        );

        // Show toast notification only for messages from others in different conversations
        if (data.message.senderId !== user?._id) {
          const senderName =
            typeof data.message.senderId !== "string"
              ? data.message.senderId.fullName
              : "Someone";

          // Find the conversation to get pitch info
          const conversation = conversationsData?.data.find(
            (conv) => conv._id === data.conversationId
          );
          const pitchTitle =
            conversation && typeof conversation.pitchId !== "string"
              ? conversation.pitchId.companyInfo.pitchTitle
              : "Pitch Discussion";

          const messagePreview = `💬 ${senderName}: ${data.message.content.substring(
            0,
            50
          )}${
            data.message.content.length > 50 ? "..." : ""
          }\n📋 Re: ${pitchTitle}`;
          handleInfo(messagePreview);
          if (conversation) {
            selectConversation(conversation);
          }
        }

        // Increment unread count for messages from others
        if (data.message.senderId !== user?._id) {
          setRealtimeUnreadCount((prev) => prev + 1);
        }
      }
    };

    // Handle conversation updates
    const handleConversationUpdated = (data: { conversationId: string }) => {
      console.log("🔄 Conversation updated:", data.conversationId);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      // If it's the active conversation, refresh it
      if (data.conversationId === activeConversationId) {
        queryClient.invalidateQueries({
          queryKey: ["conversation", activeConversationId],
        });
      }
    };

    // Handle conversation deletion by other participants
    const handleConversationDeleted = (data: { conversationId: string }) => {
      console.log(
        "🗑️ Conversation deleted by other participant:",
        data.conversationId
      );

      // If we're currently in the deleted conversation, clear it
      if (activeConversationId === data.conversationId) {
        setActiveConversationId(null);
        handleInfo(
          "This conversation has been deleted by the other participant"
        );
      }

      // Refresh conversations list and unread count
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });

      // Remove caches for this conversation
      queryClient.removeQueries({
        queryKey: ["messages", data.conversationId],
      });
      queryClient.removeQueries({
        queryKey: ["conversation", data.conversationId],
      });
    };

    // Handle messages read with unread count updates
    const handleMessagesRead = (data: {
      conversationId: string;
      readBy: string;
      readAt: string;
    }) => {
      console.log("📖 Messages read in conversation:", data.conversationId);

      if (data.conversationId === activeConversationId) {
        queryClient.invalidateQueries({
          queryKey: ["messages", activeConversationId],
        });
      }

      // Update unread count immediately
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    };

    // Handle typing indicators
    const handleUserTyping = (data: {
      userId: string;
      conversationId: string;
    }) => {
      if (
        data.conversationId === activeConversationId &&
        data.userId !== user?._id
      ) {
        setTypingUsers((prev) => new Set(prev).add(data.userId));

        // Auto-remove typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }, 3000);
      }
    };

    const handleUserStoppedTyping = (data: {
      userId: string;
      conversationId: string;
    }) => {
      if (data.conversationId === activeConversationId) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    };

    // Handle online status
    const handleUserOnline = (data: { userId: string }) => {
      setOnlineUsers((prev) => new Set(prev).add(data.userId));
    };

    const handleUserOffline = (data: { userId: string }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    };

    // Handle errors
    const handleSocketError = (data: { message: string }) => {
      console.error("Socket error:", data.message);
      handleError(data.message);
    };

    // Register event listeners
    socket.on("new_message", handleNewMessage);
    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("conversation_deleted", handleConversationDeleted);
    socket.on("messages_read", handleMessagesRead);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("error", handleSocketError);

    socketEventHandlersSetup.current = true;

    // Cleanup function
    return () => {
      console.log("🧹 Cleaning up socket event handlers");
      socket.off("new_message", handleNewMessage);
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("conversation_deleted", handleConversationDeleted);
      socket.off("messages_read", handleMessagesRead);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("error", handleSocketError);
      socketEventHandlersSetup.current = false;
    };
  }, [
    socket,
    activeConversationId,
    queryClient,
    conversationsData,
    isConnected,
    user,
    handleError,
    handleInfo,
  ]);

  // ENHANCED: Better conversation selection with proper room management
  const selectConversation = useCallback(
    (conversation: Conversation) => {
      console.log("🔄 Switching to conversation:", {
        newConversationId: conversation._id,
        previousActiveId: activeConversationId,
        pitchTitle:
          typeof conversation.pitchId === "string"
            ? "Pitch Discussion"
            : conversation.pitchId.companyInfo.pitchTitle,
      });

      // Leave previous conversation room if switching
      if (activeConversationId && activeConversationId !== conversation._id) {
        console.log("🚪 Leaving previous conversation:", activeConversationId);
        leaveConversation(activeConversationId);
      }

      // Set new active conversation BEFORE joining room
      setActiveConversationId(conversation._id);

      // Join new conversation room
      console.log("🏠 Joining new conversation:", conversation._id);
      joinConversation(conversation._id);

      // Clear typing users for previous conversation
      setTypingUsers(new Set());

      // Mark messages as read for this conversation
      if (socket && isConnected) {
        console.log("📖 Marking messages as read for new conversation");
        socket.emit("mark_as_read", { conversationId: conversation._id });
      }

      // Update unread count when switching conversations
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
    [
      activeConversationId,
      leaveConversation,
      joinConversation,
      socket,
      isConnected,
      queryClient,
    ]
  );

  // ENHANCED: Better send message function with conversation-specific optimistic updates
  const sendMessage = useCallback(
    (content: string) => {
      if (!activeConversationId || !content.trim()) {
        console.log("❌ Cannot send message: missing conversation or content");
        return;
      }

      console.log("📤 Sending message to conversation:", {
        conversationId: activeConversationId,
        content: content.substring(0, 50),
        userId: user?._id,
      });

      // Create optimistic message with conversation-specific temp ID
      const tempId = `temp-${activeConversationId}-${Date.now()}`;
      const tempMessage: Message = {
        _id: tempId,
        conversationId: activeConversationId,
        senderId: user?._id || "temp-user",
        receiverId: "temp-receiver", // Will be replaced by real message
        content: content.trim(),
        messageType: "text",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isRead: false,
      };

      // FIXED: Add optimistic message only to the current active conversation
      queryClient.setQueryData(
        ["messages", activeConversationId],
        (oldData: { data: { messages: Message[] } } | undefined) => {
          if (!oldData) return oldData;

          console.log(
            "🔄 Adding optimistic message to conversation:",
            activeConversationId
          );
          return {
            ...oldData,
            data: {
              ...oldData.data,
              messages: [...oldData.data.messages, tempMessage],
            },
          };
        }
      );

      // Send via socket or API fallback
      if (socket && isConnected) {
        console.log("📡 Sending message via socket");
        socket.emit("send_message", {
          conversationId: activeConversationId,
          content: content.trim(),
          messageType: "text",
        });
      } else {
        console.log("⚠️ Socket not connected, using API fallback");
        sendMessageMutation.mutate({
          conversationId: activeConversationId,
          content: content.trim(),
          messageType: "text",
        });
      }
    },
    [
      activeConversationId,
      socket,
      isConnected,
      sendMessageMutation,
      queryClient,
      user,
    ]
  );

  // Initiate conversation
  const initiateConversation = useCallback(
    (data: InitiateConversationRequest) => {
      initiateConversationMutation.mutate(data);
    },
    [initiateConversationMutation]
  );

  // Mark messages as read for a conversation
  const markConversationAsRead = useCallback(
    (conversationId: string) => {
      console.log("📖 Marking conversation as read:", conversationId);
      markAsReadMutation.mutate(conversationId);
    },
    [markAsReadMutation]
  );

  // Delete conversation and all its messages
  const deleteConversation = useCallback(
    (conversationId: string) => {
      console.log("🗑️ Deleting conversation:", conversationId);
      deleteConversationMutation.mutate(conversationId);
    },
    [deleteConversationMutation]
  );

  return {
    // Data
    conversations: conversationsData?.data || [],
    activeConversation: activeConversationData?.data || null,
    messages: messagesData?.data?.messages || [],
    unreadCount: realtimeUnreadCount || unreadData?.data?.unreadCount || 0,
    typingUsers,
    onlineUsers,

    // Loading states
    conversationsLoading,
    conversationLoading,
    messagesLoading,
    isInitiatingConversation: initiateConversationMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
    isMarkingAsRead: markAsReadMutation.isPending,
    isDeletingConversation: deleteConversationMutation.isPending,

    // Connection state
    isConnected,

    // Actions
    selectConversation,
    sendMessage,
    initiateConversation,
    markConversationAsRead,
    deleteConversation,

    // Current state
    activeConversationId,

    // Errors
    conversationsError,
  };
};
