"use client";

import * as LucideIcons from "lucide-react";
import { FC } from "react";

interface LucideIconProps
  extends React.ComponentProps<typeof LucideIcons.AlertCircle> {
  name: string;
}

export function LucideIcon({ name, ...props }: LucideIconProps) {
  // Convert kebab-case to PascalCase to match Lucide naming
  const formattedName = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  // Try to get the icon component, with fallback
  const IconComponent =
    (LucideIcons[formattedName as keyof typeof LucideIcons] as FC) ||
    (LucideIcons[name as keyof typeof LucideIcons] as FC) ||
    LucideIcons.HelpCircle;

  return <IconComponent {...props} />;
}
