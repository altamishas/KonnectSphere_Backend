"use client";

import { useEffect } from "react";
import { authService } from "@/services/auth-service";

/**
 * Component to initialize authentication state on client-side
 * This should be included in the root layout to ensure auth state is properly set
 */
export default function AuthInitializer() {
  useEffect(() => {
    // Initialize auth state when the app loads
    authService.initializeAuth();

    // Optional: Refresh auth status periodically (every 30 minutes)
    const refreshInterval = setInterval(() => {
      if (authService.isAuthenticated()) {
        authService.refreshAuthStatus().catch((error) => {
          console.warn("Auth refresh failed:", error);
        });
      }
    }, 30 * 60 * 1000); // 30 minutes

    // Cleanup interval on unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // This component doesn't render anything
  return null;
}
