"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { investorService } from "@/services/investor-service";
import { InvestorFilterState } from "@/lib/types";
import { useErrorHandler } from "@/hooks/useErrorHandler";

const INITIAL_FILTERS: InvestorFilterState = {
  investmentRange: [1000, 10000000],
  countries: [],
  industries: [],
  stages: [],
};

export const useInvestorSearch = () => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<InvestorFilterState>(INITIAL_FILTERS);
  const [sortBy, setSortBy] = useState<
    "relevance" | "investments" | "connections"
  >("relevance");
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  // Search investors query
  const {
    data: searchResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["investors", "search", searchQuery, filters, sortBy, page],
    queryFn: () => {
      return investorService.searchInvestors({
        query: searchQuery,
        industries: filters.industries,
        countries: filters.countries,
        stages: filters.stages,
        investmentRange: filters.investmentRange,
        sortBy,
        page,
        limit: 20,
      });
    },
    enabled: true,
    retry: 1,
  });

  // Star investor mutation
  const starMutation = useMutation({
    mutationFn: investorService.starInvestor,
    onSuccess: () => {
      handleSuccess("Investor starred successfully!");
      queryClient.invalidateQueries({ queryKey: ["investors"] });
    },
    onError: (error: Error) => {
      handleError(error, "Failed to star investor");
    },
  });

  // Unstar investor mutation
  const unstarMutation = useMutation({
    mutationFn: investorService.unstarInvestor,
    onSuccess: () => {
      handleSuccess("Investor unstarred successfully!");
      queryClient.invalidateQueries({ queryKey: ["investors"] });
    },
    onError: (error: Error) => {
      handleError(error, "Failed to unstar investor");
    },
  });

  // Connect with investor mutation
  const connectMutation = useMutation({
    mutationFn: ({
      investorId,
      message,
    }: {
      investorId: string;
      message?: string;
    }) => investorService.connectWithInvestor(investorId, message),
    onSuccess: () => {
      handleSuccess("Connection request sent successfully!");
    },
    onError: (error: Error) => {
      handleError(error, "Failed to send connection request");
    },
  });

  // Send message mutation
  const messageMutation = useMutation({
    mutationFn: ({
      investorId,
      message,
    }: {
      investorId: string;
      message: string;
    }) => investorService.sendMessageToInvestor(investorId, message),
    onSuccess: () => {
      handleSuccess("Message sent successfully!");
    },
    onError: (error: Error) => {
      handleError(error, "Failed to send message");
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const applyFilters = (newFilters: InvestorFilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchQuery("");
    setPage(1);
  };

  const toggleStar = (investorId: string, isStarred: boolean) => {
    if (isStarred) {
      unstarMutation.mutate(investorId);
    } else {
      starMutation.mutate(investorId);
    }
  };

  const connectWithInvestor = (investorId: string, message?: string) => {
    connectMutation.mutate({ investorId, message });
  };

  const sendMessage = (investorId: string, message: string) => {
    messageMutation.mutate({ investorId, message });
  };

  return {
    // Search state
    searchQuery,
    filters,
    sortBy,
    page,

    // Search results
    investors: searchResponse?.investors || [],
    total: searchResponse?.total || 0,
    isLoading,
    error,

    // Pagination data
    pagination: {
      page,
      limit: 20,
      total: searchResponse?.total || 0,
      totalPages: Math.ceil((searchResponse?.total || 0) / 20),
    },

    // Actions
    handleSearch,
    applyFilters,
    resetFilters,
    setSortBy,
    setPage: (newPage: number) => {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    toggleStar,
    connectWithInvestor,
    sendMessage,
    refetch,

    // Mutation states
    isStarring: starMutation.isPending || unstarMutation.isPending,
    isConnecting: connectMutation.isPending,
    isSendingMessage: messageMutation.isPending,
  };
};
