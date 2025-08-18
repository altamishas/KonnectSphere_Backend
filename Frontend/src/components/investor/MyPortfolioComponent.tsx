"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageCircle,
  Heart,
  RefreshCw,
  Search,
  Building2,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/loading-spinner";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

// Import services
import { chatService } from "@/services/chat-service";
import favouritesService, {
  FavouritePitch,
} from "@/services/favourites-service";

// Type for conversation with additional properties
interface ExtendedConversation {
  _id: string;
  pitchId?: {
    _id?: string;
    companyInfo?: {
      pitchTitle?: string;
      raisedSoFar?: string;
      raisingAmount?: string;
      stage?: string;
      industry1?: string;
    };
    pitchDeal?: {
      summary?: string;
      business?: string;
    };
    media?: {
      banner?: {
        url?: string;
      };
      logo?: {
        url?: string;
      };
    };
    isPremium?: boolean;
  };
  participants?: {
    entrepreneur?: {
      _id?: string;
      fullName?: string;
      avatarImage?: string;
      email?: string;
    };
    investor?: {
      _id?: string;
      fullName?: string;
      avatarImage?: string;
      email?: string;
    };
  };
  lastMessage?: {
    content?: string;
  };
  lastMessageAt?: string;
  unreadCount?: number;
}

export const MyPortfolioComponent = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"interested" | "favourites">(
    "interested"
  );
  const [favouritesPage] = useState(1);

  // Fetch conversations for interested pitches
  const {
    data: conversationsData,
    isLoading: isLoadingConversations,
    error: conversationsError,
    refetch: refetchConversations,
  } = useQuery({
    queryKey: ["investor-conversations"],
    queryFn: () => chatService.getConversations(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch favourites count
  const { data: favouritesCountData, isLoading: isLoadingFavouritesCount } =
    useQuery({
      queryKey: ["favourites-count"],
      queryFn: () => favouritesService.getFavouritesCount(),
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

  // Fetch favourite pitches
  const {
    data: favouritesData,
    isLoading: isLoadingFavourites,
    error: favouritesError,
    refetch: refetchFavourites,
  } = useQuery({
    queryKey: ["favourites", favouritesPage],
    queryFn: () => favouritesService.getFavourites(favouritesPage, 12),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: activeTab === "favourites",
  });

  // Mutation for toggling favourites
  const toggleFavouriteMutation = useMutation({
    mutationFn: (pitchId: string) => favouritesService.toggleFavourite(pitchId),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["favourites-count"] });
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      queryClient.invalidateQueries({
        queryKey: ["favourite-status"],
        exact: false,
      });

      toast.success(
        result.added ? "Added to favourites!" : "Removed from favourites!"
      );
    },
    onError: (error) => {
      toast.error("Failed to update favourites");
      console.error("Favourite toggle error:", error);
    },
  });

  // Mutation for initiating conversation
  const initiateConversationMutation = useMutation({
    mutationFn: async ({
      pitchId,
      message,
    }: {
      pitchId: string;
      message: string;
    }) => {
      return await chatService.initiateConversation({ pitchId, message });
    },
    onSuccess: (result) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["investor-conversations"] });
      queryClient.invalidateQueries({ queryKey: ["favourites"] });
      queryClient.invalidateQueries({ queryKey: ["favourites-count"] });

      toast.success("Conversation started successfully!");

      // Navigate to chat page with the new conversation
      window.location.href = `/chat?conversation=${result.data.conversation._id}`;
    },
    onError: (error) => {
      toast.error("Failed to start conversation");
      console.error("Conversation initiation error:", error);
    },
  });

  const conversations = (conversationsData?.data ||
    []) as ExtendedConversation[];
  const favouritesCount = favouritesCountData?.data?.count || 0;
  const favouritePitches = favouritesData?.data || [];

  // Calculate statistics
  const totalInterestedPitches = conversations.length;
  const activeConversations = conversations.filter(
    (conv) => conv.lastMessage?.content !== "No messages yet"
  ).length;

  const handleStartConversation = (conversationId: string) => {
    window.location.href = `/chat?conversation=${conversationId}`;
  };

  const handleToggleFavourite = (pitchId: string) => {
    toggleFavouriteMutation.mutate(pitchId);
  };

  const handleSendMessage = (pitchId: string, pitchTitle: string) => {
    const defaultMessage = `Hi! I'm interested in your pitch "${pitchTitle}". I'd like to learn more about this opportunity.`;
    initiateConversationMutation.mutate({
      pitchId,
      message: defaultMessage,
    });
  };

  const isLoading =
    isLoadingConversations ||
    isLoadingFavouritesCount ||
    (activeTab === "favourites" && isLoadingFavourites);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  const renderErrorState = (
    error: unknown,
    refetch: () => void,
    title: string
  ) => (
    <div className="text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
        <RefreshCw className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        There was an error loading your data. Please try again.
      </p>
      <Button onClick={() => refetch()}>Try Again</Button>
    </div>
  );

  const renderEmptyState = (
    icon: React.ReactNode,
    title: string,
    description: string,
    actionButton?: React.ReactNode
  ) => (
    <div className="text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4">{description}</p>
      {actionButton && (
        <div className="flex justify-center gap-2">{actionButton}</div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Total Interested Pitches
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {totalInterestedPitches}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Favourite Pitches
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {favouritesCount}
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
                  {activeConversations}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Interested and Favourites */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "interested" | "favourites")
        }
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger
            value="interested"
            className="flex items-center space-x-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Interested ({totalInterestedPitches})</span>
          </TabsTrigger>
          <TabsTrigger
            value="favourites"
            className="flex items-center space-x-2"
          >
            <Heart className="h-4 w-4" />
            <span>Favourites ({favouritesCount})</span>
          </TabsTrigger>
        </TabsList>

        {/* Interested Tab Content */}
        <TabsContent value="interested">
          {conversationsError ? (
            renderErrorState(
              conversationsError,
              refetchConversations,
              "Failed to load conversations"
            )
          ) : totalInterestedPitches === 0 ? (
            renderEmptyState(
              <Building2 className="h-8 w-8 text-slate-400" />,
              "No interested pitches yet",
              "You haven't started any conversations with entrepreneurs yet. Start exploring pitches to find interesting opportunities.",
              <Button asChild>
                <Link href="/explore-pitches">
                  <Search className="h-4 w-4 mr-2" />
                  Explore Pitches
                </Link>
              </Button>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {conversations.map((conversation) => {
                const pitch = conversation.pitchId || {};
                const entrepreneur =
                  conversation.participants?.entrepreneur || {};

                return (
                  <Card
                    key={conversation._id}
                    className="overflow-hidden transition-all duration-300 hover:shadow-md border border-border/60 group h-full flex flex-col"
                  >
                    {/* Pitch Image */}
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={
                          pitch.media?.banner?.url ||
                          pitch.media?.logo?.url ||
                          "/images/pic1.jpg"
                        }
                        alt={pitch.companyInfo?.pitchTitle || "Pitch"}
                        fill
                        style={{ objectFit: "cover" }}
                        className="group-hover:scale-105 transition-transform duration-500"
                      />
                      <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground hover:bg-primary/90">
                        {pitch.companyInfo?.industry1 || "General"}
                      </Badge>
                      {pitch.isPremium && (
                        <Badge className="absolute top-3 left-3 bg-yellow-500 text-white">
                          Premium
                        </Badge>
                      )}
                      {/* Unread messages indicator */}
                      {(conversation.unreadCount || 0) > 0 && (
                        <Badge className="absolute bottom-3 right-3 bg-red-500 text-white">
                          {conversation.unreadCount} new
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-5 flex-grow">
                      <div className="mb-2 mt-1">
                        <h3 className="text-xl font-semibold line-clamp-1 text-foreground">
                          {pitch.companyInfo?.pitchTitle || "Untitled Pitch"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {entrepreneur.fullName || "Unknown Entrepreneur"}
                        </p>
                      </div>

                      <p className="text-sm line-clamp-2 mb-4 text-foreground">
                        {pitch.pitchDeal?.summary ||
                          pitch.pitchDeal?.business ||
                          "No description available"}
                      </p>

                      <div className="space-y-3">
                        {/* Funding Information */}
                        {(pitch.companyInfo?.raisedSoFar ||
                          pitch.companyInfo?.raisingAmount) && (
                          <div>
                            <div className="flex justify-between text-sm mb-1 text-foreground">
                              <span>
                                $
                                {parseInt(
                                  pitch.companyInfo?.raisedSoFar || "0"
                                ).toLocaleString()}
                              </span>
                              <span>
                                $
                                {parseInt(
                                  pitch.companyInfo?.raisingAmount || "0"
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{
                                  width: `${Math.min(
                                    (parseInt(
                                      pitch.companyInfo?.raisedSoFar || "0"
                                    ) /
                                      parseInt(
                                        pitch.companyInfo?.raisingAmount || "1"
                                      )) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>
                                {Math.round(
                                  (parseInt(
                                    pitch.companyInfo?.raisedSoFar || "0"
                                  ) /
                                    parseInt(
                                      pitch.companyInfo?.raisingAmount || "1"
                                    )) *
                                    100
                                )}
                                % Funded
                              </span>
                              <span>
                                {pitch.companyInfo?.stage || "Unknown Stage"}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Entrepreneur Info */}
                        <div className="flex items-center">
                          <Avatar className="h-6 w-6 mr-2">
                            <AvatarImage src={entrepreneur.avatarImage} />
                            <AvatarFallback className="text-xs">
                              {entrepreneur.fullName?.charAt(0) || "E"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {entrepreneur.fullName || "Unknown Entrepreneur"}
                          </span>
                        </div>

                        {/* Last Message Info */}
                        {conversation.lastMessage?.content && (
                          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                              Last Message:
                            </p>
                            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 italic">
                              &ldquo;{conversation.lastMessage.content}&rdquo;
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                              {conversation.lastMessageAt
                                ? formatDistanceToNow(
                                    new Date(conversation.lastMessageAt),
                                    {
                                      addSuffix: true,
                                    }
                                  )
                                : "No messages yet"}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>

                    <div className="p-5 pt-0 flex gap-2">
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() =>
                          handleStartConversation(conversation._id)
                        }
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        {(conversation.unreadCount || 0) > 0
                          ? "View Messages"
                          : "Continue Chat"}
                      </Button>
                      {pitch._id && (
                        <Button variant="outline" className="flex-1" asChild>
                          <Link href={`/view-pitch/${pitch._id}`}>
                            <Building2 className="h-4 w-4 mr-2" />
                            View Pitch
                          </Link>
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Favourites Tab Content */}
        <TabsContent value="favourites">
          {favouritesError ? (
            renderErrorState(
              favouritesError,
              refetchFavourites,
              "Failed to load favourites"
            )
          ) : favouritePitches.length === 0 ? (
            renderEmptyState(
              <Heart className="h-8 w-8 text-slate-400" />,
              "No favourite pitches yet",
              "You haven't saved any pitches to your favourites yet. Start exploring pitches and click the heart icon to save them.",
              <Button asChild>
                <Link href="/explore-pitches">
                  <Search className="h-4 w-4 mr-2" />
                  Explore Pitches
                </Link>
              </Button>
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {favouritePitches.map((pitch: FavouritePitch) => (
                <Card
                  key={pitch._id}
                  className="overflow-hidden transition-all duration-300 hover:shadow-md border border-border/60 group h-full flex flex-col"
                >
                  {/* Pitch Image */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={pitch.media?.banner?.url || "/images/pic1.jpg"}
                      alt={pitch.companyInfo.pitchTitle}
                      fill
                      style={{ objectFit: "cover" }}
                      className="group-hover:scale-105 transition-transform duration-500"
                    />
                    <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground hover:bg-primary/90">
                      {pitch?.companyInfo.industry1}
                    </Badge>
                    {pitch.isPremium && (
                      <Badge className="absolute top-3 left-3 bg-yellow-500 text-white">
                        Premium
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-5 flex-grow">
                    <div className="mb-2 mt-1">
                      <h3 className="text-xl font-semibold line-clamp-1 text-foreground">
                        {pitch.companyInfo.pitchTitle}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {pitch.userId.company || "No company"}
                      </p>
                    </div>

                    <p className="text-sm line-clamp-2 mb-4 text-foreground">
                      {pitch.pitchDeal?.summary ||
                        pitch.pitchDeal?.business ||
                        "No description available"}
                    </p>

                    <div className="space-y-3">
                      {/* Funding Information */}
                      <div>
                        <div className="flex justify-between text-sm mb-1 text-foreground">
                          <span>
                            $
                            {parseInt(
                              pitch.companyInfo.raisedSoFar || "0"
                            ).toLocaleString()}
                          </span>
                          <span>
                            $
                            {parseInt(
                              pitch.companyInfo.raisingAmount || "0"
                            ).toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{
                              width: `${Math.min(
                                (parseInt(
                                  pitch.companyInfo.raisedSoFar || "0"
                                ) /
                                  parseInt(
                                    pitch.companyInfo.raisingAmount || "1"
                                  )) *
                                  100,
                                100
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>
                            {Math.round(
                              (parseInt(pitch.companyInfo.raisedSoFar || "0") /
                                parseInt(
                                  pitch.companyInfo.raisingAmount || "1"
                                )) *
                                100
                            )}
                            % Funded
                          </span>
                          <span>{pitch.companyInfo.stage}</span>
                        </div>
                      </div>

                      {/* Entrepreneur Info */}
                      <div className="flex items-center">
                        <Avatar className="h-6 w-6 mr-2">
                          <AvatarImage src={pitch.userId.avatar} />
                          <AvatarFallback className="text-xs">
                            {pitch.userId.name?.charAt(0) || "E"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {pitch.userId.name}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <div className="p-5 pt-0 flex gap-2">
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                      asChild
                    >
                      <Link href={`/view-pitch/${pitch._id}`}>View Pitch</Link>
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() =>
                        handleSendMessage(
                          pitch._id,
                          pitch.companyInfo.pitchTitle
                        )
                      }
                      disabled={initiateConversationMutation.isPending}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      {initiateConversationMutation.isPending
                        ? "..."
                        : "Send Message"}
                    </Button>
                  </div>

                  {/* Remove from favorites button */}
                  <div className="px-5 pb-5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleToggleFavourite(pitch._id)}
                      disabled={toggleFavouriteMutation.isPending}
                    >
                      <Heart className="h-3 w-3 mr-1 fill-current" />
                      {toggleFavouriteMutation.isPending
                        ? "..."
                        : "Remove from Favorites"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyPortfolioComponent;
