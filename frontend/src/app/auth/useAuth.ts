"use client";
import { useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";
import { useRouter } from "next/navigation";
// Modificado para importar a função centralizada que cria todos os atores
import { createSearchNewsActor } from "../utils/canister";

// A interface UserStatus pode ser mantida se for usada em outras partes do seu app
export interface UserStatus {
  plan: { Standard?: null; Pro?: null; Premium?: null; };
  resetAt: bigint;
  requestsLeft: bigint;
}

export function useAuth() {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      try {
        const client = await AuthClient.create();
        setAuthClient(client);
        const isAuth = await client.isAuthenticated();
        if (isAuth) {
          const identity = client.getIdentity();
          setPrincipal(identity.getPrincipal());
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Failed to initialize auth client:", error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const login = async () => {
    if (!authClient) return;
    setIsLoading(true);
    await authClient.login({
      identityProvider: "https://identity.ic0.app/#authorize",
      onSuccess: async () => {
        const identity = authClient.getIdentity();
        const userPrincipal = identity.getPrincipal();
        setPrincipal(userPrincipal);
        setIsAuthenticated(true);

        // ===== LÓGICA DE VERIFICAÇÃO INTEGRADA COM O CANISTER =====
        try {
          // 1. Obtém o ator de usuários a partir da função centralizada
          const { usersActor } = createSearchNewsActor(authClient);

          // 2. Tenta buscar o perfil do usuário.
          await usersActor.getProfile(userPrincipal);

          // 3. Se a linha acima NÃO gerou erro, o perfil existe.
          console.log("Perfil encontrado no canister. Redirecionando para /chat");
          router.push("/chat");

        } catch (error) {
          // 4. Se ocorreu um erro, muito provavelmente é porque o perfil não existe.
          console.log("Perfil não encontrado no canister. Redirecionando para /register-profile");
          router.push("/register-profile");
        } finally {
          setIsLoading(false);
        }
        // ==========================================================
      },
      onError: (err: any) => {
        console.error("Error during login:", err);
        setIsLoading(false);
      },
    });
  };

  const logout = async () => {
    if (!authClient) return;
    setIsLoading(true);
    await authClient.logout();
    setPrincipal(null);
    setIsAuthenticated(false);
    setStatus(null);
    router.push("/");
    setIsLoading(false);
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
