"use client";

import React, { useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { botActor } from "../utils/canister"; // Ajuste o caminho

export default function LoginPage() {
  const [authClient, setAuthClient] = useState<AuthClient | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [actor, setActor] = useState<any>(botActor);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    AuthClient.create().then(async (client) => {
      setAuthClient(client);
      if (await client.isAuthenticated()) {
        const identity = client.getIdentity();
        setPrincipal(identity.getPrincipal());
        setIsAuthenticated(true);

      }
    });
  }, []);

  const login = async () => {
    if (!authClient) return;
    await authClient.login({
      identityProvider: "https://identity.ic0.app/#authorize",
      onSuccess: async () => {
        const identity = authClient.getIdentity();
        setPrincipal(identity.getPrincipal());
        setIsAuthenticated(true);
      },
      onError: (err) => {
        console.error("Erro no login:", err);
      },
    });
  };

  const logout = async () => {
    if (!authClient) return;
    await authClient.logout();
    setPrincipal(null);
    setIsAuthenticated(false);
    setActor(null);
  };

  // ✅ Exemplo: assinar plano
  const subscribePlan = async (plan: "Standard" | "Pro" | "Premium") => {
    if (!actor) return alert("Faça login primeiro!");

    let planObj;
    switch (plan) {
      case "Standard":
        planObj = { Standard: null };
        break;
      case "Pro":
        planObj = { Pro: null };
        break;
      case "Premium":
        planObj = { Premium: null };
        break;
      default:
        return;
    }

    try {
      const res = await actor.subscribe(planObj);
      alert(res);
    } catch (err) {
      console.error(err);
      alert("Erro ao assinar plano");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-800 to-indigo-900 text-white">
      <h1 className="text-3xl font-bold mb-8">🚀 Login com Internet Identity</h1>

      {isAuthenticated && principal ? (
        <>
          <p className="mb-2">Conectado como:</p>
          <p className="bg-gray-900 px-4 py-2 rounded mb-6 text-sm break-all">
            {principal.toText()}
          </p>
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => subscribePlan("Standard")}
              className="px-4 py-2 bg-green-500 rounded hover:bg-green-600 transition"
            >
              Plano Standard
            </button>
            <button
              onClick={() => subscribePlan("Pro")}
              className="px-4 py-2 bg-yellow-500 rounded hover:bg-yellow-600 transition"
            >
              Plano Pro
            </button>
            <button
              onClick={() => subscribePlan("Premium")}
              className="px-4 py-2 bg-pink-500 rounded hover:bg-pink-600 transition"
            >
              Plano Premium
            </button>
          </div>
          <button
            onClick={logout}
            className="px-6 py-2 bg-red-600 rounded hover:bg-red-700 transition"
          >
            Desconectar
          </button>
        </>
      ) : (
        <>
          <p className="mb-6">Autentique-se usando seu Internet Identity no ICP</p>
          <button
            onClick={login}
            className="px-6 py-3 bg-green-500 rounded hover:bg-green-600 transition text-lg font-semibold"
          >
            🔐 Entrar com Internet Identity
          </button>
        </>
      )}
    </div>
  );
}
