"use client";
import React, { createContext, useContext, useState, useCallback } from "react";

interface LoadingRequest {
  id: string;
}

interface LoadingContextType {
  isLoading: boolean;
  activeRequests: LoadingRequest[];
  startLoading: (id: string) => void;
  stopLoading: (id: string) => void;
  clearAllLoading: () => void;
  getLoadingStatus: () => {
    total: number;
  };
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeRequests, setActiveRequests] = useState<LoadingRequest[]>([]);

  const startLoading = useCallback((id: string) => {
    const request: LoadingRequest = {
      id
    };

    setActiveRequests(prev => {
      // Evita duplicatas
      const filtered = prev.filter(req => req.id !== id);
      return [...filtered, request];
    });
  }, []);

  const stopLoading = useCallback((id: string) => {
    setActiveRequests(prev => prev.filter(req => req.id !== id));
  }, []);

  const clearAllLoading = useCallback(() => {
    setActiveRequests([]);
  }, []);

  const getLoadingStatus = useCallback(() => {
    const total = activeRequests.length;
    return { total };
  }, [activeRequests]);

  const isLoading = activeRequests.length > 0;

  return (
    <LoadingContext.Provider 
      value={{ 
        isLoading, 
        activeRequests, 
        startLoading, 
        stopLoading, 
        clearAllLoading,
        getLoadingStatus
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
