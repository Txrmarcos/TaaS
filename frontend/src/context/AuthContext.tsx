"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";
import { useRouter } from "next/navigation";
import { clearAgentCache } from "../app/utils/canister";

interface AuthContextType {
  authClient: AuthClient | null;
  isAuthenticated: boolean;
  principal: Principal | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        setIsLoading(true);
        const client = await AuthClient.create();
        setAuthClient(client);
        
        const authenticated = await client.isAuthenticated();
        if (authenticated) {
          const identity = client.getIdentity();
          const principal = identity.getPrincipal();
          setPrincipal(principal);
          setIsAuthenticated(true);
          console.log("🔐 User authenticated:", principal.toText());
        } else {
          console.log("🔐 User not authenticated");
        }
      } catch (error) {
        console.error("❌ Auth initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Verify authentication on page focus/visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && authClient) {
        try {
          const authenticated = await authClient.isAuthenticated();
          if (authenticated !== isAuthenticated) {
            if (authenticated) {
              const identity = authClient.getIdentity();
              const principal = identity.getPrincipal();
              setPrincipal(principal);
              setIsAuthenticated(true);
              console.log("🔐 Auth restored:", principal.toText());
            } else {
              setPrincipal(null);
              setIsAuthenticated(false);
              console.log("🔐 Auth lost");
            }
          }
        } catch (error) {
          console.error("❌ Auth verification error:", error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated]); // Removido authClient da dependência

  const login = async () => {
    if (!authClient) return;
    setIsLoading(true);
    try {
      await authClient.login({
        identityProvider: "https://identity.ic0.app/#authorize",
        onSuccess: async () => {
          try {
            // Verify authentication after login
            const authenticated = await authClient.isAuthenticated();
            if (authenticated) {
              const identity = authClient.getIdentity();
              const principal = identity.getPrincipal();
              setPrincipal(principal);
              setIsAuthenticated(true);
              console.log("🔐 Login successful:", principal.toText());
              router.push("/news-feed");
            } else {
              console.error("❌ Login verification failed");
            }
          } catch (error) {
            console.error("❌ Login verification error:", error);
          }
        },
        onError: (err: any) => {
          console.error("❌ Login error:", err);
        },
      });
    } catch (error) {
      console.error("❌ Login setup error:", error);
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
      clearAgentCache(); // Limpar cache de agentes
      console.log("🔐 Logout successful");
      router.push("/");
    } catch (error) {
      console.error("❌ Logout error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ authClient,isAuthenticated, principal, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
