// File: lib/queryClient.ts

import { QueryClient } from "@tanstack/react-query";

// Create a function that returns a new QueryClient
// This ensures we don't create the client during SSR to avoid hydration mismatches
export const getQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default options for better UX and performance
        refetchOnWindowFocus: true,
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
        // For profile data specifically, we'll override these settings in the useProfile hook
      },
    },
  });
};

// Helper function to reset or clear queries based on pattern
export const resetQueries = (queryClient: QueryClient, pattern?: string[]) => {
  if (pattern) {
    // Reset specific query patterns
    pattern.forEach((queryKey) => {
      queryClient.removeQueries({ queryKey: [queryKey] });
    });
  } else {
    // Reset all queries
    queryClient.clear();
  }
};
