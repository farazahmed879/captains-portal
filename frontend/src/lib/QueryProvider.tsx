'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

interface QueryProviderProps {
  children: React.ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Avoid unnecessary refetches when data is already fresh
            staleTime: 1000 * 60 * 3, // 3 minutes
            gcTime: 1000 * 60 * 15, // 15 minutes
            refetchOnWindowFocus: false, // Don't trigger refetch every time window is focused
            refetchOnReconnect: false, // Don't trigger refetch on reconnect
            retry: 1, // Only retry once on failure
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
