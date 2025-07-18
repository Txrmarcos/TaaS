"use client";
import { useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";
import { useRouter } from "next/navigation";
import { botActor } from "../utils/canister";

export interface UserStatus {
  plan: {
    Standard?: null;
    Pro?: null;
    Premium?: null;
  };
  resetAt: bigint;
  requestsLeft: bigint;
}

export function useAuth() {
  const [authClient, setAuthClient] = useState<any>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const client = await AuthClient.create();
      setAuthClient(client);
      const isAuth = await client.isAuthenticated();
      if (isAuth) {
        const identity = client.getIdentity();
        setPrincipal(identity.getPrincipal());
        setIsAuthenticated(true);
        await fetchStatus();
      }
    };
    init();
  }, []);

  const login = async () => {
    if (!authClient) return;
    setIsLoading(true);
    try {
      await authClient.login({
        identityProvider: "https://identity.ic0.app/#authorize",
        onSuccess: async () => {
          const identity = authClient.getIdentity();
          setPrincipal(identity.getPrincipal());
          setIsAuthenticated(true);
          await fetchStatus();
          router.push("/chat");
        },
        onError: (err: any) => {
          console.error("Erro no login:", err);
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!authClient) return;
    setIsLoading(true);
    try {
      await authClient.logout();
      setPrincipal(null);
      setIsAuthenticated(false);
      setStatus(null);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatus = async () => {
      try {
          const res = (await botActor.get_user_status()) as any;
          console.log("Status do usuário:", res);
          if (res) {
              setStatus(res[0] as UserStatus);
          } else {
              setStatus(null);
          }
      } catch (err) {
          console.error(err);
      }
  };

  return {
    authClient,
    principal,
    isAuthenticated,
    status,
    login,
    logout,
    isLoading,
  };
}
