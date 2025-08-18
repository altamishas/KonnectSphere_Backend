"use client";

import { useQuery } from "@tanstack/react-query";
import { chatService } from "@/services/chat-service";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Building2,
  Calendar,
  Users,
  TrendingUp,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Types for our component
interface InterestedInvestor {
  id: string;
  name: string;
  email: string;
  avatarImage?: {
    url?: string;
    public_id?: string;
  };
  pitchTitle: string;
  pitchId: string;
  conversationId: string;
  lastMessageAt: string;
  lastMessage: string;
  unreadCount: number;
}

export const MyInvestorsComponent = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const router = useRouter();

  // Fetch conversations to get interested investors
  const {
    data: conversationsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["entrepreneur-conversations"],
    queryFn: chatService.getConversations,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Transform conversations to investor data
  const interestedInvestors: InterestedInvestor[] =
    conversationsResponse?.data?.map((conversation) => {
      // For entrepreneurs, the investor is the one who initiated the conversation
      const investor = conversation.participants.investor;
      const pitchTitle =
        typeof conversation.pitchId === "string"
          ? "Pitch Discussion"
          : conversation.pitchId.companyInfo.pitchTitle;

      return {
        id: typeof investor === "string" ? investor : investor._id,
        name: typeof investor === "string" ? "Investor" : investor.fullName,
        email: typeof investor === "string" ? "" : investor.email || "",
        avatarImage:
          typeof investor === "string" ? undefined : investor.avatarImage,
        pitchTitle,
        pitchId:
          typeof conversation.pitchId === "string"
            ? conversation.pitchId
            : conversation.pitchId._id,
        conversationId: conversation._id,
        lastMessageAt: conversation.lastMessageAt,
        lastMessage: conversation.lastMessage?.content || "No messages yet",
        unreadCount: 0, // Default to 0 since unreadCount might not exist
      };
    }) || [];

  const handleStartConversation = (conversationId: string) => {
    router.push(`/chat?conversation=${conversationId}`);
  };

  if (!isClient) {
    return null; // Or a loading spinner
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <span className="text-slate-600 dark:text-slate-400">
            Loading interested investors...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          Error Loading Investors
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          We couldn&apos;t load your interested investors. Please try again.
        </p>
        <Button onClick={() => refetch()}>Try Again</Button>
      </div>
    );
  }

  if (interestedInvestors.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
          No Interested Investors Yet
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          When investors are interested in your pitches and contact you,
          they&apos;ll appear here. Make sure your pitches are published and
          engaging to attract investors.
        </p>
        <div className="space-x-3">
          <Button asChild>
            <Link href="/my-pitches">Review My Pitches</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/explore-pitches">See Successful Pitches</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Interested Investors
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {interestedInvestors.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Active Conversations
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {
                    interestedInvestors.filter(
                      (investor) => investor.lastMessage !== "No messages yet"
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Unread Messages
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {interestedInvestors.reduce(
                    (total, investor) => total + investor.unreadCount,
                    0
                  )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interestedInvestors.map((investor) => (
          <Card
            key={investor.id}
            className="hover:shadow-lg transition-all duration-300"
          >
            <CardHeader className="pb-4">
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={investor.avatarImage?.url} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {investor.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {investor.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {investor.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">
                    {investor.name}
                  </CardTitle>
                  <div className="flex items-center text-sm text-slate-500 mt-1">
                    <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {formatDistanceToNow(new Date(investor.lastMessageAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Pitch Information */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                  <Building2 className="h-4 w-4 mr-2 flex-shrink-0" />
                  <span className="font-medium">Interested in:</span>
                </div>
                <Badge
                  variant="secondary"
                  className="w-full justify-center py-1"
                >
                  {investor.pitchTitle}
                </Badge>
              </div>

              {/* Last Message */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Last Message:
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 italic">
                  &ldquo;{investor.lastMessage}&rdquo;
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <Button
                  className="w-full"
                  onClick={() =>
                    handleStartConversation(investor.conversationId)
                  }
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {investor.unreadCount > 0 ? "View Messages" : "Continue Chat"}
                </Button>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/view-pitch/${investor.pitchId}`}>
                      <Building2 className="h-3 w-3 mr-1" />
                      View Pitch
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/investor/${investor.id}`}>
                      <Users className="h-3 w-3 mr-1" />
                      View Profile
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
