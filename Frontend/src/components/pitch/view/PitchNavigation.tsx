"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import AskQuestionButton from "@/components/pitch/AskQuestionButton";

import type { PitchInfo } from "@/lib/types/chat";

interface NavigationItem {
  id: string;
  label: string;
}

interface PitchNavigationProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  isScrolled: boolean;
  pitch: PitchInfo;
  accessLevel?: "full" | "overview-only" | "unauthenticated";
}

const PitchNavigation = ({
  activeSection,
  onSectionChange,
  isScrolled,
  pitch,
  accessLevel = "full",
}: PitchNavigationProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const allNavigationItems: NavigationItem[] = [
    { id: "overview", label: "Overview" },
    { id: "pitch-details", label: "Pitch Details" },
    { id: "team", label: "The Team" },
    { id: "documents", label: "Documents" },
    { id: "contact", label: "Contact" },
  ];

  // Filter navigation items based on access level
  const navigationItems =
    accessLevel === "overview-only"
      ? allNavigationItems.filter((item) => item.id === "overview")
      : allNavigationItems;

  return (
    <div
      className={cn(
        "sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-b transition-all duration-300",
        isScrolled ? "shadow-md" : ""
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  activeSection === item.id
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Navigation Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <AskQuestionButton
              pitch={pitch}
              className="bg-primary text-white  hover:bg-primary/90"
            />
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background">
            <div className="py-2 space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "block w-full text-left px-4 py-2 text-sm font-medium transition-colors hover:bg-muted",
                    activeSection === item.id
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PitchNavigation;
