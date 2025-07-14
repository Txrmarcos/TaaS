"use client";
import React, { useEffect, useState } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";
import { HttpAgent } from "@dfinity/agent";
import { AccountIdentifier, SubAccount, LedgerCanister } from "@dfinity/ledger-icp";
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

export function principalToAccountIdentifier(principal: Principal, subaccount?: Uint8Array): string {
  return AccountIdentifier.fromPrincipal({
    principal,
    subAccount: subaccount ? SubAccount.fromBytes(subaccount) : undefined
  }).toHex();
}

export default function LoginPage() {
    const [authClient, setAuthClient] = useState<any>(null);
    const [principal, setPrincipal] = useState<any>(null);
    const [actor, setActor] = useState<any>(botActor);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [status, setStatus] = useState<UserStatus | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);


    useEffect(() => {
        const initializeAuth = async () =>
            AuthClient.create().then(async (client) => {
                setAuthClient(client);
                if (await client.isAuthenticated()) {
                    const identity = client.getIdentity();
                    setPrincipal(identity.getPrincipal());
                    setIsAuthenticated(true);
                    await fetchStatus();
                }
            });

        setIsInitializing(false);
        initializeAuth();
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
            setActor(null);
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
            await fetchStatus();
        } catch (err) {
            console.error(err);
            alert("Erro ao assinar plano");
        }
    };

    const getPlanColor = (planName: string) => {
        switch (planName) {
            case "Standard":
                return "text-green-400";
            case "Pro":
                return "text-yellow-400";
            case "Premium":
                return "text-pink-400";
            default:
                return "text-gray-400";
        }
    };

    const formatDate = (timestamp: bigint) => {
        return new Date(Number(timestamp / BigInt(1_000_000))).toLocaleString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }
        );
    };

    if (isInitializing) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0E13] relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-md mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-full mb-4 shadow-lg">
                            <span className="text-2xl">🚀</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Internet Identity
                        </h1>
                        <p className="text-white/80">
                            Conecte-se ao futuro descentralizado
                        </p>
                    </div>
                    {/* Main Content */}
                    <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-white/20">
                        {isAuthenticated && principal ? (
                            <div className="space-y-6">
                                {/* User Info */}
                                <div className="text-center">
                                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-3">
                                        <span className="text-green-400 text-xl">
                                            ✓
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-semibold text-white mb-2">
                                        Conectado com sucesso!
                                    </h2>
                                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                        <p className="text-xs text-white/70 mb-1">
                                            Principal ID:
                                        </p>
                                        <p className="text-sm text-white font-mono break-all">
                                            {principal?.toText()}
                                        </p>
                                    </div>
                                </div>

                                {/* Status Card */}
                                {status ? (
                                    <div className="bg-white/5 rounded-xl p-5 border border-white/10 space-y-3">
                                        <h3 className="text-lg font-semibold text-white flex items-center">
                                            <span className="w-2 h-2 bg-green-400 rounded-full mr-3"></span>
                                            Status da Conta
                                        </h3>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/70">
                                                    Plano Atual:
                                                </span>
                                                <span
                                                    className={`font-semibold ${getPlanColor(
                                                        Object.keys(
                                                            status.plan
                                                        )[0] ?? "Indefinido"
                                                    )}`}
                                                >
                                                    {Object.keys(
                                                        status.plan
                                                    )[0] ?? "Indefinido"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/70">
                                                    Requests Restantes:
                                                </span>
                                                <span className="text-white font-semibold">
                                                    {status.requestsLeft
                                                        ? status.requestsLeft.toString()
                                                        : "N/A"}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-white/70">
                                                    Reset em:
                                                </span>
                                                <span className="text-white font-semibold text-sm">
                                                    {status.resetAt
                                                        ? formatDate(
                                                              status.resetAt
                                                          )
                                                        : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5">
                                        <div className="flex items-center">
                                            <span className="text-orange-400 text-xl mr-3">
                                                ⚠️
                                            </span>
                                            <span className="text-orange-300">
                                                Nenhum plano ativo encontrado
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Subscription Plans */}
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-white">
                                        Escolha seu Plano
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        <button
                                            onClick={() =>
                                                subscribePlan("Standard")
                                            }
                                            disabled={isLoading}
                                            className="flex items-center justify-between p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl transition-all duration-200 group disabled:opacity-50"
                                        >
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
                                                <span className="text-green-400 font-semibold">
                                                    Standard
                                                </span>
                                            </div>
                                            <span className="text-green-400 group-hover:translate-x-1 transition-transform">
                                                →
                                            </span>
                                        </button>

                                        <button
                                            onClick={() => subscribePlan("Pro")}
                                            disabled={isLoading}
                                            className="flex items-center justify-between p-4 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl transition-all duration-200 group disabled:opacity-50"
                                        >
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
                                                <span className="text-yellow-400 font-semibold">
                                                    Pro
                                                </span>
                                            </div>
                                            <span className="text-yellow-400 group-hover:translate-x-1 transition-transform">
                                                →
                                            </span>
                                        </button>

                                        <button
                                            onClick={() =>
                                                subscribePlan("Premium")
                                            }
                                            disabled={isLoading}
                                            className="flex items-center justify-between p-4 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 rounded-xl transition-all duration-200 group disabled:opacity-50"
                                        >
                                            <div className="flex items-center">
                                                <div className="w-3 h-3 bg-pink-400 rounded-full mr-3"></div>
                                                <span className="text-pink-400 font-semibold">
                                                    Premium
                                                </span>
                                            </div>
                                            <span className="text-pink-400 group-hover:translate-x-1 transition-transform">
                                                →
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                {/* Logout Button */}
                                <button
                                    onClick={logout}
                                    disabled={isLoading}
                                    className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-xl transition-all duration-200 font-semibold disabled:opacity-50"
                                >
                                    {isLoading
                                        ? "Desconectando..."
                                        : "Desconectar"}
                                </button>
                            </div>
                        ) : (
                            <div className="text-center space-y-6">
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-bold text-white">
                                        Bem-vindo!
                                    </h2>
                                    <p className="text-white/80">
                                        Autentique-se usando seu Internet
                                        Identity para acessar a plataforma
                                    </p>
                                </div>

                                <button
                                    onClick={login}
                                    disabled={isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] hover:opacity-90 text-white rounded-xl transition-all duration-200 font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                                >
                                    {isLoading ? (
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    ) : (
                                        <span className="mr-2">🔐</span>
                                    )}
                                    {isLoading
                                        ? "Conectando..."
                                        : "Entrar com Internet Identity"}
                                </button>

                                <div className="text-xs text-white/50 space-y-1">
                                    <p>
                                        Sua identidade é protegida pela
                                        blockchain da Internet Computer
                                    </p>
                                    <p>
                                        Sem senhas, sem dados pessoais
                                        armazenados
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="text-center mt-8 text-white/50 text-sm">
                        <p>Powered by Internet Computer Protocol</p>
                    </div>
                </div>
            </div>
        </div>
    );

}
