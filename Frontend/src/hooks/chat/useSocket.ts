import { useEffect, useRef, useState, useCallback } from "react";
import { Socket, io } from "socket.io-client";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { SocketEvents } from "@/lib/types/chat";

interface UseSocketReturn {
  socket: Socket<SocketEvents> | null;
  isConnected: boolean;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (data: {
    conversationId: string;
    content: string;
    messageType?: "text" | "image" | "file";
  }) => void;
  markAsRead: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
}

export const useSocket = (): UseSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket<SocketEvents> | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentRoomsRef = useRef<Set<string>>(new Set()); // Track joined rooms
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Initialize socket connection
  const initSocket = useCallback(() => {
    if (!isAuthenticated) return;

    // Don't create multiple connections
    if (socketRef.current?.connected) {
      console.log("Socket already connected");
      return;
    }

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Connect to the backend server (Railway in production, localhost in dev)
    const serverUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
    const token = localStorage.getItem("token"); // Get token from localStorage as fallback

    console.log("🔌 Initializing socket connection to:", serverUrl);

    // Enhanced Socket.IO configuration with debugging
    console.log("🔧 Socket connection config:", {
      serverUrl,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      isProduction: process.env.NODE_ENV === "production",
    });

    socketRef.current = io(serverUrl, {
      withCredentials: true, // Enable cross-domain cookie support
      transports: ["websocket", "polling"],
      auth: {
        token: token, // Send token in auth for fallback
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 60000, // Increased timeout
      forceNew: true, // Force new connection
      extraHeaders: {
        Authorization: token ? `Bearer ${token}` : "",
        "X-Client-Type": "web",
      },
    });

    const socket = socketRef.current;

    // Connection events
    socket.on("connect", () => {
      console.log(
        "✅ Connected to chat server via HTTP-only cookie authentication"
      );
      setIsConnected(true);

      // Clear any reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clear rooms tracking on reconnection
      currentRoomsRef.current.clear();
    });

    socket.on("disconnect", (reason) => {
      console.log("❌ Disconnected from chat server:", reason);
      setIsConnected(false);

      // Clear rooms tracking on disconnect
      currentRoomsRef.current.clear();

      // Only attempt reconnection for recoverable disconnections
      if (reason === "io server disconnect" || reason === "transport close") {
        // Schedule reconnection
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isAuthenticated) {
            console.log("🔄 Attempting to reconnect...");
            socket.connect();
          }
        }, 2000);
      }
    });

    socket.on("connect_error", (error: Error) => {
      console.error("💥 Socket connection error:", error);
      console.log("🔍 Connection details:", {
        serverUrl,
        hasToken: !!token,
        withCredentials: true,
        transports: ["websocket", "polling"],
      });

      // Try to reconnect with localStorage token if cookie auth fails
      if (!token && localStorage.getItem("token")) {
        console.log("🔄 Retrying connection with localStorage token...");
        socket.auth = { token: localStorage.getItem("token") };
        socket.connect();
      } else {
        console.log("⚠️ No fallback authentication available");
        setIsConnected(false);
      }
    });

    // Handle successful room joining
    socket.on("conversation_joined", (data: { conversationId: string }) => {
      console.log(
        "✅ Successfully joined conversation room:",
        data.conversationId
      );
      currentRoomsRef.current.add(data.conversationId);
    });

    return socket;
  }, [isAuthenticated]);

  // Initialize socket when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initSocket();
    } else {
      // Clean up when not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clear rooms tracking
      currentRoomsRef.current.clear();
    }

    // Cleanup function
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [isAuthenticated, initSocket]);

  // ENHANCED: Socket methods with better room management
  const joinConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      // Don't join if already in this room
      if (currentRoomsRef.current.has(conversationId)) {
        console.log("🔄 Already in conversation room:", conversationId);
        return;
      }

      console.log("🏠 Joining conversation:", conversationId);
      socketRef.current.emit("join_conversation", { conversationId });
    } else {
      console.log("⚠️ Cannot join conversation - socket not connected");
    }
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      // Only leave if we're actually in this room
      if (currentRoomsRef.current.has(conversationId)) {
        console.log("🚪 Leaving conversation:", conversationId);
        socketRef.current.emit("leave_conversation", { conversationId });
        currentRoomsRef.current.delete(conversationId);
      } else {
        console.log("ℹ️ Not in conversation room to leave:", conversationId);
      }
    }
  }, []);

  const sendMessage = useCallback(
    (data: {
      conversationId: string;
      content: string;
      messageType?: "text" | "image" | "file";
    }) => {
      if (socketRef.current?.connected) {
        console.log(
          "📤 Sending message via socket:",
          data.content.substring(0, 50)
        );
        socketRef.current.emit("send_message", data);
      } else {
        console.log("⚠️ Cannot send message - socket not connected");
      }
    },
    []
  );

  const markAsRead = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("mark_as_read", { conversationId });
    }
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("typing_start", { conversationId });
    }
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit("typing_stop", { conversationId });
    }
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinConversation,
    leaveConversation,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
  };
};
