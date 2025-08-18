"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { chatService } from "@/services/chat-service";
import { useAuthUser } from "@/hooks/auth/useAuthUser";

const MessageIcon = () => {
  const router = useRouter();
  const { isAuthenticated } = useAuthUser();

  // Fetch unread count with frequent updates for real-time feel
  const { data: unreadData } = useQuery({
    queryKey: ["unread-count"],
    queryFn: chatService.getUnreadCount,
    enabled: isAuthenticated,
    refetchInterval: 5000, // Update every 5 seconds for real-time feel
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const unreadCount = unreadData?.data?.unreadCount || 0;

  const handleClick = () => {
    if (isAuthenticated) {
      router.push("/chat");
    } else {
      router.push("/login");
    }
  };

  if (!isAuthenticated) {
    return null; // Don't show message icon for unauthenticated users
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className="relative h-12 w-12 hover:bg-accent/50 transition-colors"
        title="Messages"
      >
        <MessageCircle className="h-10 w-10" />

        {/* Enhanced Unread count badge with animation */}
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs font-semibold animate-pulse border-2 border-background"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export default MessageIcon;
