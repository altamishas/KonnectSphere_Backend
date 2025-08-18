"use client";

import { useChat } from "@/hooks/chat/useChat";
import { useAuthUser } from "@/hooks/auth/useAuthUser";
import { useSearchParams } from "next/navigation";
// Removed unused Card import
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle,
  Send,
  User,
  Building2,
  MapPin,
  Globe,
  Circle,
  Trash2,
  CheckCheck,
  Paperclip,
  Download,
  Image as ImageIcon,
  File,
  ArrowLeft,
  Info,
  X,
  MoreVertical,
} from "lucide-react";
import { useState, useRef, useEffect, Suspense } from "react";
import { formatDistanceToNow } from "date-fns";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Conversation, Message } from "@/lib/types/chat";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define proper user type to avoid conflicts
interface ChatUser {
  _id: string;
  fullName: string;
  role: string;
  avatarImage?: {
    url?: string;
  };
}

const ChatPageContent = () => {
  const { user } = useAuthUser();
  const searchParams = useSearchParams();
  const {
    conversations,
    activeConversation,
    messages,
    unreadCount,
    selectConversation,
    sendMessage,
    conversationsLoading,
    messagesLoading,
    isConnected,
    typingUsers,
    markConversationAsRead,
    deleteConversation,
    isMarkingAsRead,
    isDeletingConversation,
  } = useChat();

  const [messageInput, setMessageInput] = useState("");
  const [recentlyUpdatedChats, setRecentlyUpdatedChats] = useState<Set<string>>(
    new Set()
  );
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPitchPanel, setShowPitchPanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(messages.length);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smooth scroll to bottom when new messages arrive
  useEffect(() => {
    const shouldScroll = messages.length > lastMessageCountRef.current;
    lastMessageCountRef.current = messages.length;

    if (shouldScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }
  }, [messages]);

  // Handle URL parameters for conversation navigation
  useEffect(() => {
    const conversationId = searchParams.get("conversation");
    if (conversationId && conversations.length > 0) {
      const targetConversation = conversations.find(
        (conv) => conv._id === conversationId
      );
      if (
        targetConversation &&
        (!activeConversation || activeConversation._id !== conversationId)
      ) {
        console.log("🔗 URL navigation to conversation:", conversationId);
        selectConversation(targetConversation);
      }
    } else if (conversations.length > 0 && !activeConversation) {
      console.log("📋 Auto-selecting first conversation");
      selectConversation(conversations[0]);
    }
  }, [searchParams, conversations, selectConversation, activeConversation]);

  const handleSendMessage = () => {
    if (messageInput.trim() && activeConversation) {
      sendMessage(messageInput.trim());
      setMessageInput("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // TODO: Implement file upload logic
      console.log("Files selected:", files);
    }
  };

  const handleDeleteConversation = () => {
    if (!activeConversation) return;

    // Add confirmation dialog
    const isConfirmed = window.confirm(
      `Are you sure you want to delete this conversation?\n\nThis will permanently delete all messages with ${
        typeof activeConversation.pitchId === "string"
          ? "this entrepreneur"
          : `${
              getOtherParticipant(activeConversation, user as ChatUser).fullName
            } about "${activeConversation.pitchId.companyInfo.pitchTitle}"`
      }.\n\nThis action cannot be undone.`
    );

    if (isConfirmed) {
      deleteConversation(activeConversation._id);
    }
  };

  const handleMarkAllAsRead = () => {
    if (!activeConversation) return;
    markConversationAsRead(activeConversation._id);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background to-muted/20 overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur-sm shadow-sm flex-shrink-0">
        <div className="w-full px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Messages
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isConnected ? (
                    <span className="flex items-center">
                      <Circle className="h-1.5 w-1.5 sm:h-2 sm:w-2 fill-green-500 text-green-500 mr-1" />
                      <span className="hidden sm:inline">
                        Connected • Real-time messaging active
                      </span>
                      <span className="sm:hidden">Connected</span>
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Circle className="h-1.5 w-1.5 sm:h-2 sm:w-2 fill-red-500 text-red-500 mr-1" />
                      Connecting...
                    </span>
                  )}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="animate-pulse text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Layout - Fixed Height */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Mobile Sidebar Overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Mobile Pitch Panel Overlay */}
        {showPitchPanel && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowPitchPanel(false)}
          />
        )}

        {/* Conversations Sidebar - Responsive */}
        <div
          className={cn(
            "flex-shrink-0 bg-background border-r border-border/50 z-50 transition-transform duration-300",
            // Mobile: overlay
            "fixed top-0 left-0 h-full w-80 lg:relative lg:w-auto",
            // Desktop: 25% width (3/12)
            "lg:w-1/4 xl:w-1/5",
            // Show/hide on mobile
            showSidebar ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          )}
        >
          <div className="flex flex-col h-full">
            {/* Mobile header */}
            <div className="lg:hidden p-4 border-b bg-muted/30 flex items-center justify-between">
              <h2 className="font-semibold">Conversations</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSidebar(false)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Desktop header */}
            <div className="hidden lg:block p-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">Conversations</h2>
                <Badge variant="outline" className="text-xs">
                  {conversations.length}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Click to switch between chats
              </p>
            </div>

            {/* Conversations List */}
            <ScrollArea className="flex-1">
              {conversationsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <LoadingSpinner />
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No conversations yet</p>
                  <p className="text-sm">
                    Start by asking a question on a pitch
                  </p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {conversations.map((conversation) => (
                    <ConversationItem
                      key={conversation._id}
                      conversation={conversation}
                      isActive={activeConversation?._id === conversation._id}
                      hasUnread={recentlyUpdatedChats.has(conversation._id)}
                      currentUser={user as ChatUser}
                      onClick={() => {
                        console.log(
                          "👆 User clicked conversation:",
                          conversation._id
                        );
                        selectConversation(conversation);
                        setShowSidebar(false); // Close mobile sidebar
                        setShowPitchPanel(false); // Close pitch panel if open
                        // Remove from recently updated when clicked
                        setRecentlyUpdatedChats((prev) => {
                          const newSet = new Set(prev);
                          newSet.delete(conversation._id);
                          return newSet;
                        });
                      }}
                      onMarkAsRead={markConversationAsRead}
                      onDelete={deleteConversation}
                      isMarkingAsRead={isMarkingAsRead}
                      isDeletingConversation={isDeletingConversation}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* Main Content Area - Enhanced Width */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-w-0">
          {/* Messages Area - Much Wider (60% on desktop) */}
          <div className="flex-1 lg:w-3/5 flex flex-col border-r border-border/50 min-h-0">
            {activeConversation ? (
              <>
                {/* Chat Header with Enhanced Actions */}
                <div className="p-3 sm:p-4 border-b bg-gradient-to-r from-muted/30 to-muted/50 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      {/* Mobile menu button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden h-8 w-8 flex-shrink-0"
                        onClick={() => setShowSidebar(true)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>

                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-primary/20 flex-shrink-0">
                        <AvatarImage
                          src={
                            getOtherParticipant(
                              activeConversation,
                              user as ChatUser
                            ).avatarImage?.url
                          }
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs sm:text-sm">
                          {getOtherParticipant(
                            activeConversation,
                            user as ChatUser
                          )
                            .fullName.split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm sm:text-lg truncate">
                          {
                            getOtherParticipant(
                              activeConversation,
                              user as ChatUser
                            ).fullName
                          }
                        </h3>
                        <p className="text-xs sm:text-sm text-muted-foreground flex items-center">
                          {
                            getOtherParticipant(
                              activeConversation,
                              user as ChatUser
                            ).role
                          }
                          {isConnected && (
                            <>
                              <Circle className="h-1.5 w-1.5 fill-green-500 text-green-500 mx-2" />
                              <span className="hidden sm:inline">Online</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Enhanced Chat Actions - Individual Buttons */}
                    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                      {/* Pitch badge for larger screens */}
                      <Badge
                        variant="outline"
                        className="hidden md:flex text-xs max-w-32 truncate"
                      >
                        {typeof activeConversation.pitchId === "string"
                          ? "Pitch Discussion"
                          : activeConversation.pitchId.companyInfo.pitchTitle}
                      </Badge>

                      {/* Mobile pitch info button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden h-8 w-8"
                        onClick={() => setShowPitchPanel(true)}
                        title="View Pitch Details"
                      >
                        <Info className="h-4 w-4" />
                      </Button>

                      {/* Mark as read button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleMarkAllAsRead}
                        title="Mark as Read"
                        disabled={isMarkingAsRead}
                      >
                        {isMarkingAsRead ? (
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <CheckCheck className="h-4 w-4" />
                        )}
                      </Button>

                      {/* Delete conversation button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={handleDeleteConversation}
                        title="Delete Chat"
                        disabled={isDeletingConversation}
                      >
                        {isDeletingConversation ? (
                          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages Area with proper mobile height */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-hidden bg-gradient-to-b from-background to-muted/10 min-h-0"
                >
                  <ScrollArea className="h-full">
                    <div className="p-3 sm:p-4 pb-4">
                      {messagesLoading ? (
                        <div className="flex items-center justify-center h-96">
                          <LoadingSpinner />
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          {messages.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p className="font-medium">No messages yet</p>
                              <p className="text-sm">
                                Start the conversation below
                              </p>
                            </div>
                          ) : (
                            messages.map((message, index) => (
                              <MessageBubble
                                key={message._id}
                                message={message}
                                isOwn={
                                  typeof message.senderId === "string"
                                    ? message.senderId === user._id
                                    : message.senderId._id === user._id
                                }
                                showAvatar={shouldShowAvatar(
                                  messages,
                                  index,
                                  user._id
                                )}
                                showTimestamp={shouldShowTimestamp(
                                  messages,
                                  index
                                )}
                              />
                            ))
                          )}
                          {typingUsers.size > 0 && <TypingIndicator />}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Enhanced Message Input - Fixed for Mobile */}
                <div className="p-3 sm:p-4 border-t bg-background/95 flex-shrink-0">
                  <div className="flex items-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleFileSelect}
                      className="h-10 w-10 flex-shrink-0"
                      disabled={!isConnected}
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>

                    <div className="flex-1 relative min-w-0">
                      <Input
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type a message..."
                        className="min-h-[40px] resize-none w-full"
                        disabled={!isConnected}
                      />
                    </div>

                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageInput.trim() || !isConnected}
                      className="h-10 w-10 flex-shrink-0 p-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  {!isConnected && (
                    <p className="text-xs text-destructive mt-2 flex items-center">
                      <Circle className="h-2 w-2 fill-current mr-1" />
                      Connecting... Messages will be sent when connection is
                      restored.
                    </p>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={handleFileChange}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Choose a conversation from the sidebar to start messaging
                  </p>
                  {conversations.length > 0 && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setShowSidebar(true)}
                    >
                      <span className="lg:hidden">Open Conversations</span>
                      <span className="hidden lg:inline">
                        Open Latest Conversation
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pitch Info Panel - Wider & Mobile Responsive */}
          <div
            className={cn(
              "lg:w-2/5 border-l border-border/50 bg-background",
              // Mobile: overlay panel
              "lg:relative",
              showPitchPanel
                ? "fixed top-0 right-0 h-full w-80 z-50 lg:relative lg:w-auto lg:z-auto"
                : "hidden lg:block"
            )}
          >
            {/* Mobile close button */}
            {showPitchPanel && (
              <div className="lg:hidden p-4 border-b bg-muted/30 flex items-center justify-between">
                <h3 className="font-semibold">Pitch Details</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPitchPanel(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {activeConversation &&
            typeof activeConversation.pitchId !== "string" ? (
              <PitchInfoPanel pitch={activeConversation.pitchId} />
            ) : (
              <div className="flex items-center justify-center h-full text-center p-6">
                <div>
                  <Building2 className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-sm">
                    Pitch information will appear here when you select a
                    conversation
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Conversation Item
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  hasUnread: boolean;
  currentUser: ChatUser;
  onClick: () => void;
  onMarkAsRead: (conversationId: string) => void;
  onDelete: (conversationId: string) => void;
  isMarkingAsRead: boolean;
  isDeletingConversation: boolean;
}

const ConversationItem = ({
  conversation,
  isActive,
  hasUnread,
  currentUser,
  onClick,
  onMarkAsRead,
  onDelete,
  isMarkingAsRead,
  isDeletingConversation,
}: ConversationItemProps) => {
  const otherParticipant = getOtherParticipant(conversation, currentUser);
  const pitchTitle =
    typeof conversation.pitchId === "string"
      ? "Pitch Discussion"
      : conversation.pitchId.companyInfo.pitchTitle;

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent conversation selection
    onMarkAsRead(conversation._id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent conversation selection

    // Add confirmation dialog
    const isConfirmed = window.confirm(
      `Are you sure you want to delete this conversation?\n\nThis will permanently delete all messages with ${otherParticipant.fullName} about "${pitchTitle}".\n\nThis action cannot be undone.`
    );

    if (isConfirmed) {
      onDelete(conversation._id);
    }
  };

  return (
    <div
      className={cn(
        "p-3 rounded-lg cursor-pointer transition-all duration-200 border relative group",
        isActive
          ? "bg-primary/10 border-primary/30 shadow-md"
          : hasUnread
          ? "bg-accent/50 border-accent hover:bg-accent/70"
          : "hover:bg-muted/50 border-transparent"
      )}
      onClick={onClick}
    >
      <div className="flex items-start space-x-3">
        <div className="relative">
          <Avatar
            className={cn("h-10 w-10", hasUnread && "ring-2 ring-primary/30")}
          >
            <AvatarImage src={otherParticipant.avatarImage?.url} />
            <AvatarFallback className="text-sm font-semibold">
              {otherParticipant.fullName
                .split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          {hasUnread && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p
              className={cn(
                "text-sm truncate",
                hasUnread
                  ? "font-bold text-foreground"
                  : "font-medium text-foreground"
              )}
            >
              {otherParticipant.fullName}
            </p>
            {conversation.lastMessageAt && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>

          {/* Enhanced Pitch Title Display */}
          <div className="flex items-center space-x-1 mb-1">
            <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground truncate font-medium">
              {pitchTitle}
            </p>
          </div>

          {conversation.lastMessage && (
            <p
              className={cn(
                "text-xs truncate",
                hasUnread
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {conversation.lastMessage.content}
            </p>
          )}
        </div>

        {/* Three-dots dropdown menu */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={handleMarkAsRead}
                disabled={isMarkingAsRead}
                className="flex items-center space-x-2"
              >
                {isMarkingAsRead ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <CheckCheck className="h-4 w-4 flex-shrink-0" />
                )}
                <span>Mark as Read</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeletingConversation}
                className="flex items-center space-x-2 text-destructive focus:text-destructive"
              >
                {isDeletingConversation ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <Trash2 className="h-4 w-4 flex-shrink-0" />
                )}
                <span>Delete Chat</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

// Enhanced Message Bubble with File Support
interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  showTimestamp: boolean;
}

const MessageBubble = ({
  message,
  isOwn,
  showAvatar,
  showTimestamp,
}: MessageBubbleProps) => {
  const isFileMessage =
    message.messageType === "file" || message.messageType === "image";

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-end space-x-2 max-w-[90%] sm:max-w-[85%] ${
          isOwn ? "flex-row-reverse space-x-reverse" : ""
        }`}
      >
        {showAvatar && !isOwn && (
          <Avatar className="h-6 w-6 flex-shrink-0">
            <AvatarImage
              src={
                typeof message.senderId !== "string"
                  ? message.senderId.avatarImage?.url
                  : undefined
              }
            />
            <AvatarFallback className="text-xs">
              {typeof message.senderId !== "string"
                ? message.senderId.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : "U"}
            </AvatarFallback>
          </Avatar>
        )}

        <div
          className={cn(
            "px-3 py-2 rounded-lg break-words shadow-sm",
            isOwn
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground border"
          )}
        >
          {isFileMessage ? (
            <div className="flex items-center space-x-2">
              {message.messageType === "image" ? (
                <ImageIcon className="h-4 w-4 flex-shrink-0" />
              ) : (
                <File className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="text-sm truncate">{message.content}</span>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 flex-shrink-0"
              >
                <Download className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content}
            </p>
          )}

          {showTimestamp && (
            <p
              className={cn(
                "text-xs mt-1",
                isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
              )}
            >
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

const TypingIndicator = () => (
  <div className="flex items-center space-x-2">
    <Avatar className="h-6 w-6">
      <AvatarFallback className="text-xs">
        <User className="h-3 w-3" />
      </AvatarFallback>
    </Avatar>
    <div className="bg-muted px-3 py-2 rounded-lg border">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
        <div
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        />
        <div
          className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        />
      </div>
    </div>
  </div>
);

// Enhanced Pitch Info Panel
interface PitchInfoPanelProps {
  pitch: {
    _id: string;
    companyInfo: {
      pitchTitle: string;
      description: string;
      country: string;
      industry1?: string;
    };
    pitchDeal?: {
      dealType: string;
    };
    media?: {
      logo?: {
        url: string;
      };
    };
  };
}

const PitchInfoPanel = ({ pitch }: PitchInfoPanelProps) => (
  <div className="h-full flex flex-col">
    <div className="p-4 border-b bg-muted/30">
      <h3 className="font-semibold text-sm text-muted-foreground text-center">
        PITCH DETAILS
      </h3>
    </div>

    <ScrollArea className="flex-1">
      <div className="p-6 space-y-6">
        {/* Pitch Logo/Banner */}
        {pitch.media?.logo && (
          <div className="aspect-video bg-muted/30 rounded-lg overflow-hidden border max-w-sm mx-auto">
            <Image
              src={pitch.media.logo.url}
              alt={pitch.companyInfo.pitchTitle}
              className="w-full h-full object-cover"
              width={300}
              height={200}
            />
          </div>
        )}

        {/* Centralized Pitch Title */}
        <div className="text-center space-y-2">
          <h2 className="font-bold text-xl leading-tight text-foreground">
            {pitch.companyInfo.pitchTitle}
          </h2>
        </div>

        {/* Centralized Short Summary */}
        <div className="text-center space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Summary
          </h4>
          <p className="text-sm text-foreground leading-relaxed max-w-md mx-auto">
            {pitch.companyInfo.description ||
              "A compelling business opportunity in the business sector."}
          </p>
        </div>

        <Separator className="my-4" />

        {/* Additional Details */}
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span>{pitch.companyInfo.industry1 || "Business"}</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span>{pitch.companyInfo.country}</span>
          </div>
          {pitch.pitchDeal?.dealType && (
            <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {pitch.pitchDeal.dealType === "equity"
                  ? "Equity Investment"
                  : "Loan Investment"}
              </Badge>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        {/* Centralized Action Button */}
        <div className="flex justify-center pt-2">
          <Button
            className="w-full max-w-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            onClick={() => window.open(`/view-pitch/${pitch._id}`, "_blank")}
          >
            <Globe className="h-4 w-4 mr-2" />
            View Full Pitch
          </Button>
        </div>
      </div>
    </ScrollArea>
  </div>
);

// Helper Functions
const getOtherParticipant = (
  conversation: Conversation,
  currentUser: ChatUser
) => {
  return currentUser.role === "Investor"
    ? conversation.participants.entrepreneur
    : conversation.participants.investor;
};

const shouldShowAvatar = (
  messages: Message[],
  index: number,
  currentUserId: string
): boolean => {
  if (index === 0) return true;

  const currentMessage = messages[index];
  const previousMessage = messages[index - 1];

  const currentSenderId =
    typeof currentMessage.senderId === "string"
      ? currentMessage.senderId
      : currentMessage.senderId._id;
  const previousSenderId =
    typeof previousMessage.senderId === "string"
      ? previousMessage.senderId
      : previousMessage.senderId._id;

  return (
    currentSenderId !== previousSenderId || currentSenderId === currentUserId
  );
};

const shouldShowTimestamp = (messages: Message[], index: number): boolean => {
  if (index === messages.length - 1) return true;

  const currentMessage = messages[index];
  const nextMessage = messages[index + 1];

  const currentTime = new Date(currentMessage.createdAt).getTime();
  const nextTime = new Date(nextMessage.createdAt).getTime();

  // Show timestamp if more than 5 minutes between messages
  return nextTime - currentTime > 5 * 60 * 1000;
};

const ChatPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <ChatPageContent />
  </Suspense>
);

export default ChatPage;
