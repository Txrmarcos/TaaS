"use client";
import { useEffect } from "react";
import { useLoading } from "./LoadingContext";
import { setLoadingCallbacks } from "../app/utils/canister";

// Hook para conectar o proxy de requisições com o contexto de loading
export const useLoadingIntegration = () => {
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    // Conecta os callbacks do contexto de loading com o proxy
    setLoadingCallbacks({
      startLoading,
      stopLoading
    });

    // Cleanup - remove os callbacks quando o componente é desmontado
    return () => {
      setLoadingCallbacks({
        startLoading: () => {},
        stopLoading: () => {}
      });
    };
  }, [startLoading, stopLoading]);
};
