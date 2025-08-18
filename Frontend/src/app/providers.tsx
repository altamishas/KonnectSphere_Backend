// File: app/providers.tsx

"use client";

import { ReactNode, useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Provider } from "react-redux";
import { store } from "@/store/index";
import { getQueryClient } from "@/utils/queryClient";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: ReactNode }) {
  // Use useState with a function to ensure the QueryClient is only created once on the client
  // This avoids hydration mismatches in Next.js
  const [queryClient] = useState(() => getQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </ThemeProvider>
      </Provider>
    </QueryClientProvider>
  );
}
