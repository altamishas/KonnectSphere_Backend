"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MessageCircle, Crown, Lock } from "lucide-react";
import { useAuthUser } from "@/hooks/auth/useAuthUser";
import { useSubscriptionAccess } from "@/hooks/subscription/useSubscription";
import { chatService } from "@/services/chat-service";
import AskQuestionModal from "@/components/chat/AskQuestionModal";
import { PitchInfo } from "@/lib/types/chat";
import { toast } from "sonner";

interface AskQuestionButtonProps {
  pitch: PitchInfo;
  className?: string;
}

const AskQuestionButton = ({
  pitch,
  className = "",
}: AskQuestionButtonProps) => {
  const { user, isAuthenticated } = useAuthUser();
  const { isInvestorPlan, isLoading: subscriptionLoading } =
    useSubscriptionAccess();
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInitiating, setIsInitiating] = useState(false);
  const [existingConversation, setExistingConversation] = useState<{
    exists: boolean;
    conversationId?: string;
  }>({ exists: false });

  // Check if conversation already exists for THIS user + THIS pitch
  useEffect(() => {
    const checkExistingConversation = async () => {
      if (isAuthenticated && user?.role === "Investor" && isInvestorPlan) {
        try {
          console.log("🔍 Checking existing conversation for:", {
            userId: user._id,
            pitchId: pitch._id,
            pitchTitle: pitch.companyInfo.pitchTitle,
          });

          const result = await chatService.checkConversationExists(pitch._id);
          console.log("🔍 Conversation check result:", result);

          setExistingConversation(result);
        } catch (error) {
          console.error("Error checking existing conversation:", error);
        }
      }
    };

    checkExistingConversation();
  }, [
    isAuthenticated,
    user,
    isInvestorPlan,
    pitch._id,
    pitch.companyInfo.pitchTitle,
  ]);

  const handleClick = () => {
    console.log("👆 Ask Question button clicked for pitch:", {
      pitchId: pitch._id,
      pitchTitle: pitch.companyInfo.pitchTitle,
      existingConversation,
    });

    // Check authentication
    if (!isAuthenticated) {
      toast.error("Please log in to contact entrepreneurs");
      router.push("/login");
      return;
    }

    // Check if user is an investor
    if (user?.role !== "Investor") {
      toast.error("Only investors can contact entrepreneurs");
      return;
    }

    // Check subscription
    if (!isInvestorPlan) {
      toast.error("Investor Access Plan required to contact entrepreneurs");
      router.push("/pricing");
      return;
    }

    // If conversation exists, navigate to chat
    if (existingConversation.exists && existingConversation.conversationId) {
      console.log(
        "🔗 Navigating to existing conversation:",
        existingConversation.conversationId
      );
      router.push(`/chat?conversation=${existingConversation.conversationId}`);
      return;
    }

    // Otherwise, open modal to initiate conversation
    console.log("💬 Opening modal to initiate new conversation");
    setIsModalOpen(true);
  };

  const handleInitiateConversation = async (message: string) => {
    if (!user) return;

    console.log("📤 Initiating conversation:", {
      pitchId: pitch._id,
      pitchTitle: pitch.companyInfo.pitchTitle,
      message: message.substring(0, 50) + "...",
    });

    setIsInitiating(true);
    try {
      const result = await chatService.initiateConversation({
        pitchId: pitch._id,
        message,
      });

      console.log("✅ Conversation initiated successfully:", result);
      toast.success("Conversation started successfully!");
      setIsModalOpen(false);

      // Navigate to the new conversation
      router.push(`/chat?conversation=${result.data.conversation._id}`);
    } catch (error) {
      console.error("❌ Error initiating conversation:", error);
      const errorMessage = "Failed to start conversation";
      toast.error(errorMessage);
    } finally {
      setIsInitiating(false);
    }
  };

  // Show different states based on user status
  const getButtonContent = () => {
    if (!isAuthenticated) {
      return {
        icon: <MessageCircle className="h-4 w-4" />,
        text: "Ask Question",
        variant: "default" as const,
      };
    }

    if (user?.role !== "Investor") {
      return {
        icon: <Lock className="h-4 w-4" />,
        text: "Investor Only",
        variant: "outline" as const,
      };
    }

    if (subscriptionLoading) {
      return {
        icon: <MessageCircle className="h-4 w-4" />,
        text: "Loading...",
        variant: "outline" as const,
      };
    }

    if (!isInvestorPlan) {
      return {
        icon: <Crown className="h-4 w-4" />,
        text: "Upgrade Required",
        variant: "outline" as const,
      };
    }

    if (existingConversation.exists) {
      return {
        icon: <MessageCircle className="h-4 w-4" />,
        text: "Continue Chat",
        variant: "default" as const,
      };
    }

    return {
      icon: <MessageCircle className="h-4 w-4" />,
      text: "Ask Question",
      variant: "default" as const,
    };
  };

  const buttonContent = getButtonContent();

  return (
    <>
      <Button
        onClick={handleClick}
        variant={buttonContent.variant}
        className={`${className} flex items-center space-x-2`}
        data-ask-question="true"
        disabled={subscriptionLoading || isInitiating}
      >
        {buttonContent.icon}
        <span>{buttonContent.text}</span>
      </Button>

      <AskQuestionModal
        pitch={pitch}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleInitiateConversation}
        isLoading={isInitiating}
      />
    </>
  );
};

export default AskQuestionButton;
