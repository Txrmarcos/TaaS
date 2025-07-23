"use client";
import { useEffect } from "react";
import { useLoading } from "./LoadingContext";
import { setLoadingCallbacks } from "../app/utils/canister";

export const useLoadingIntegration = () => {
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    setLoadingCallbacks({
      startLoading,
      stopLoading
    });

    return () => {
      setLoadingCallbacks({
        startLoading: () => {},
        stopLoading: () => {}
      });
    };
  }, [startLoading, stopLoading]);
};
