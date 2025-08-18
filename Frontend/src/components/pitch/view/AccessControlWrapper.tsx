"use client";

import { ReactNode } from "react";
import { useAuthUser } from "@/hooks/auth/useAuthUser";
import { EntrepreneurUpgradeMessage } from "./EntrepreneurUpgradeMessage";
import { UnauthorizedAccessMessage } from "./UnauthorizedAccessMessage";

interface AccessControlWrapperProps {
  children: ReactNode;
  section: "overview" | "full-content";
  pitchOwnerId?: string; // ID of the pitch owner
  isRestricted?: boolean; // Flag from backend indicating restricted access
}

export const AccessControlWrapper = ({
  children,
  section,
  pitchOwnerId,
  isRestricted,
}: AccessControlWrapperProps) => {
  const { user, isAuthenticated, loading } = useAuthUser();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // For overview section, always show content
  if (section === "overview") {
    return <>{children}</>;
  }

  // For full content sections, apply access control
  if (section === "full-content") {
    // Check if backend has already restricted the content
    if (isRestricted) {
      return <EntrepreneurUpgradeMessage isEntrepreneurRestriction={true} />;
    }

    // Check if current user is the pitch owner
    const isPitchOwner =
      isAuthenticated && user && pitchOwnerId && user._id === pitchOwnerId;

    // Unauthorized users - show upgrade message
    if (!isAuthenticated || !user) {
      return <UnauthorizedAccessMessage />;
    }

    // Pitch owner (entrepreneur) - show full content
    if (isPitchOwner) {
      return <>{children}</>;
    }

    // Other entrepreneur users - show upgrade message (they should get restricted content from backend)
    if (user.role === "Entrepreneur") {
      return <EntrepreneurUpgradeMessage isEntrepreneurRestriction={true} />;
    }

    // Investor users - show full content
    if (user.role === "Investor") {
      return <>{children}</>;
    }

    // Fallback for unknown roles
    return <UnauthorizedAccessMessage />;
  }

  return <>{children}</>;
};
