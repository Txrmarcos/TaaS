"use client";
import React from "react";
import { useLoading } from "../context/LoadingContext";
import "./loader.css";

interface LoadingOverlayProps {
  showDetails?: boolean;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  showDetails = false, 
  className = "" 
}) => {
  const { isLoading, getLoadingStatus } = useLoading();

  if (!isLoading) return null;

  const status = getLoadingStatus();

  return (
    <div className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <div className="flex items-center justify-center">
        {/* Apenas a animação */}
        <div className="loader-custom"></div>
      </div>
    </div>
  );
};

// Componente para loading inline (menor)
export const InlineLoading: React.FC<{ 
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ 
  size = "md",
  className = "" 
}) => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  const loaderClass = `loader-inline-${size}`;

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={loaderClass}></div>
    </div>
  );
};
