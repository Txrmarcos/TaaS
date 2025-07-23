"use client";
import { useLoading } from "./LoadingContext";

export const useLoadingUtils = () => {
  const { isLoading, activeRequests, getLoadingStatus } = useLoading();

  return {
    isLoading,
    requestCount: activeRequests.length,
    
    getStatus: getLoadingStatus,
    
    formatDuration: (startTime: number) => {
      const duration = Date.now() - startTime;
      if (duration < 1000) return `${duration}ms`;
      if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
      return `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`;
    }
  };
};
