"use client";
import React from "react";
import { useLoadingIntegration } from "../context/useLoadingIntegration";
import { LoadingOverlay } from "./LoadingOverlay";

interface LoadingIntegrationWrapperProps {
  children: React.ReactNode;
  showGlobalLoading?: boolean;
  showLoadingDetails?: boolean;
}

export const LoadingIntegrationWrapper: React.FC<LoadingIntegrationWrapperProps> = ({
  children,
  showGlobalLoading = true,
  showLoadingDetails = false
}) => {
  // Conecta o proxy de requisições com o contexto de loading
  useLoadingIntegration();

  return (
    <>
      {children}
      {showGlobalLoading && (
        <LoadingOverlay showDetails={showLoadingDetails} />
      )}
    </>
  );
};
