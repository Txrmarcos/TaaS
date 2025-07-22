"use client";
import React, { useEffect, useState } from "react";
import { Principal } from "@dfinity/principal";
import { HttpAgent } from "@dfinity/agent";
import { AccountIdentifier, LedgerCanister } from "@dfinity/ledger-icp";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { createSearchNewsActor } from "../utils/canister";

export interface UserStatus {
    plan: {
        Standard?: null;
        Pro?: null;
        Premium?: null;
    };
    resetAt: bigint;
    requestsLeft: bigint;
}

export default function PlansPage() {
    const { isAuthenticated, principal, isLoading, authClient } = useAuth();

        const { botActor } = createSearchNewsActor(authClient);

    const [actor, setActor] = useState<any>(botActor);
    const [status, setStatus] = useState<UserStatus | null>(null);
    const [isLoadingBalance, setIsLoadingBalance] = useState(false);
    const [icpBalance, setIcpBalance] = useState<string | null>(null);
    const [ckBalance, setCkBalance] = useState<string | null>(null);
    const [bitcoinAddress, setBitcoinAddress] = useState<string | null>(null);
    const [showBitcoinDeposit, setShowBitcoinDeposit] = useState(false);
    const [isGeneratingAddress, setIsGeneratingAddress] = useState(false);
    const [showIcpDeposit, setShowIcpDeposit] = useState(false);
    const [icpDepositAddress, setIcpDepositAddress] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/"); // Redirect to home or login page
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (isAuthenticated && principal) {
            fetchStatus();
            fetchICPBalance(principal);
            fetchCkBTCBalance(principal);
            generateIcpDepositAddress(principal);
        }
    }, [isAuthenticated, principal]);

    // Função para gerar endereço ICP
    const generateIcpDepositAddress = (userPrincipal: Principal) => {
        try {
            const accountIdentifier = AccountIdentifier.fromPrincipal({
                principal: userPrincipal,
            });
            setIcpDepositAddress(accountIdentifier.toHex());
        } catch (error) {
            console.error("Erro ao gerar endereço ICP:", error);
        }
    };

    // Função para gerar endereço Bitcoin
    const generateBitcoinAddress = async () => {
        if (!principal) return;
        
        setIsGeneratingAddress(true);
        try {
            const agent = new HttpAgent({
                host: "https://ic0.app",
            });

            // ID do canister ckBTC Minter
            const ckBTCMinterCanisterId = "mqygn-kiaaa-aaaar-qaadq-cai";

            // Criar o ator para o ckBTC Minter
            const ckBTCMinter = await import("@dfinity/ckbtc");
            
            const minter = ckBTCMinter.CkBTCMinterCanister.create({
                agent,
                canisterId: Principal.fromText(ckBTCMinterCanisterId),
            });

            // Gerar endereço Bitcoin
            const btcAddress = await minter.getBtcAddress({
                owner: principal,
                // subaccount is optional, so you can omit it or use new Uint8Array(32)
                // subaccount: new Uint8Array(32)
            });

            setBitcoinAddress(btcAddress);
            
        } catch (error) {
            console.error("Erro ao gerar endereço Bitcoin:", error);
            alert("Erro ao gerar endereço Bitcoin. Tente novamente.");
        } finally {
            setIsGeneratingAddress(false);
        }
    };

    const fetchCkBTCBalance = async (userPrincipal: Principal) => {
        setIsLoadingBalance(true);
        try {
            const agent = new HttpAgent({
                host: "https://ic0.app",
            });

            const ckBTCCanisterId = "mxzaz-hqaaa-aaaar-qaada-cai";

            const ckBTCCanister = await import("@dfinity/ledger-icrc");
            
            const ledger = ckBTCCanister.IcrcLedgerCanister.create({
                agent,
                canisterId: Principal.fromText(ckBTCCanisterId),
            });

            const balance = await ledger.balance({
                owner: userPrincipal,
                certified: false,
            });

            console.log("Saldo ckBTC retornado:", balance);
            
            const ckBTCAmount = (Number(balance) / 100_000_000).toFixed(8);
            setCkBalance(ckBTCAmount); 
        } catch (error) {
            console.error("Erro ao buscar saldo ckBTC:", error);
            setCkBalance("Erro ao carregar saldo ckBTC");
        } finally {
            setIsLoadingBalance(false);
        }
    };

    const fetchICPBalance = async (userPrincipal: Principal) => {
        setIsLoadingBalance(true);
        try {
            const agent = new HttpAgent({
                host: "https://ic0.app",
            });

            const accountIdentifier = AccountIdentifier.fromPrincipal({
                principal: userPrincipal,
            });

            console.log("Account ID:", accountIdentifier.toHex());

            const ledger = LedgerCanister.create({
                agent,
                canisterId: Principal.fromText("ryjl3-tyaaa-aaaaa-aaaba-cai"),
            });

            const balance = await ledger.accountBalance({
            accountIdentifier: accountIdentifier.toHex(),
            certified: false,
            });

            console.log("Saldo retornado:", balance);
            
            const icpAmount = (Number(balance) / 100_000_000).toFixed(8);
            setIcpBalance(icpAmount);
            
        } catch (error) {
            console.error("Detalhes do erro:", error);
            
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            if (errorMessage.includes("update method")) {
                setIcpBalance("Método não encontrado - verifique as dependências");
            } else if (errorMessage.includes("agent")) {
                setIcpBalance("Erro de conexão com IC");
            } else {
                setIcpBalance("0.00000000");
            }
        } finally {
            setIsLoadingBalance(false);
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

    const refreshBalance = async () => {
        if (principal) {
            await fetchICPBalance(principal);
            await fetchCkBTCBalance(principal);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copiado para a área de transferência!");
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

    if (isLoading) {
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

                                {/* ICP Balance Card */}
                                <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl p-5 border border-blue-500/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-blue-400 font-bold">∞</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">
                                                    Saldo ICP
                                                </h3>
                                                <p className="text-white/60 text-sm">
                                                    Internet Computer Protocol
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {isLoadingBalance ? (
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                                            ) : (
                                                <div>
                                                    <p className="text-2xl font-bold text-blue-400">
                                                        {icpBalance || "0.00000000"}
                                                    </p>
                                                    <p className="text-white/60 text-sm">ICP</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <button
                                            onClick={refreshBalance}
                                            disabled={isLoadingBalance}
                                            className="py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-lg transition-all duration-200 text-sm font-semibold disabled:opacity-50"
                                        >
                                            {isLoadingBalance ? "Atualizando..." : "Atualizar"}
                                        </button>
                                        <button
                                            onClick={() => setShowIcpDeposit(!showIcpDeposit)}
                                            className="py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 rounded-lg transition-all duration-200 text-sm font-semibold"
                                        >
                                            Depositar ICP
                                        </button>
                                    </div>
                                </div>

                                {/* ICP Deposit Section */}
                                {showIcpDeposit && icpDepositAddress && (
                                    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-5 border border-cyan-500/20">
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                            <span className="text-cyan-400 mr-2">∞</span>
                                            Depósito de ICP
                                        </h3>
                                        
                                        <div className="space-y-4">
                                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                                <p className="text-xs text-white/70 mb-2">
                                                    Seu endereço ICP (Account Identifier):
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-white font-mono break-all mr-2">
                                                        {icpDepositAddress}
                                                    </p>
                                                    <button
                                                        onClick={() => copyToClipboard(icpDepositAddress)}
                                                        className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 rounded transition-all duration-200 text-xs whitespace-nowrap"
                                                    >
                                                        Copiar
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                                <p className="text-xs text-white/70 mb-2">
                                                    Ou use seu Principal ID:
                                                </p>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm text-white font-mono break-all mr-2">
                                                        {principal?.toText()}
                                                    </p>
                                                    <button
                                                        onClick={() => copyToClipboard(principal?.toText())}
                                                        className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 text-cyan-400 rounded transition-all duration-200 text-xs whitespace-nowrap"
                                                    >
                                                        Copiar
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                                <p className="text-blue-400 text-sm font-semibold mb-2">
                                                    ℹ️ Instruções:
                                                </p>
                                                <div className="text-white/80 text-xs space-y-1">
                                                    <p>• Envie ICP para o Account Identifier ou Principal ID acima</p>
                                                    <p>• Valor mínimo: 0.0001 ICP</p>
                                                    <p>• Use o Account Identifier para exchanges</p>
                                                    <p>• Use o Principal ID para dApps e carteiras IC</p>
                                                    <p>• Transações são processadas quase instantaneamente</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ckBTC Balance Card */}
                                <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-5 border border-yellow-500/20">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center mr-3">
                                                <span className="text-yellow-400 font-bold">₿</span>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-semibold text-white">
                                                    Saldo ckBTC
                                                </h3>
                                                <p className="text-white/60 text-sm">
                                                    Chain-key Bitcoin
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {isLoadingBalance ? (
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
                                            ) : (
                                                <div>
                                                    <p className="text-2xl font-bold text-yellow-400">
                                                        {ckBalance || "0.00000000"}
                                                    </p>
                                                    <p className="text-white/60 text-sm">ckBTC</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        <button
                                            onClick={refreshBalance}
                                            disabled={isLoadingBalance}
                                            className="py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 text-yellow-400 rounded-lg transition-all duration-200 text-sm font-semibold disabled:opacity-50"
                                        >
                                            {isLoadingBalance ? "Atualizando..." : "Atualizar"}
                                        </button>
                                        <button
                                            onClick={() => setShowBitcoinDeposit(!showBitcoinDeposit)}
                                            className="py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 rounded-lg transition-all duration-200 text-sm font-semibold"
                                        >
                                            Depositar BTC
                                        </button>
                                    </div>
                                </div>

                                {/* Bitcoin Deposit Section */}
                                {showBitcoinDeposit && (
                                    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-5 border border-orange-500/20">
                                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                            <span className="text-orange-400 mr-2">₿</span>
                                            Depósito de Bitcoin
                                        </h3>
                                        
                                        {!bitcoinAddress ? (
                                            <div className="text-center">
                                                <p className="text-white/80 mb-4">
                                                    Gere seu endereço Bitcoin único para depositar
                                                </p>
                                                <button
                                                    onClick={generateBitcoinAddress}
                                                    disabled={isGeneratingAddress}
                                                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 text-white rounded-lg transition-all duration-200 font-semibold disabled:opacity-50 flex items-center justify-center"
                                                >
                                                    {isGeneratingAddress ? (
                                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                                    ) : (
                                                        <span className="mr-2">🔐</span>
                                                    )}
                                                    {isGeneratingAddress ? "Gerando..." : "Gerar Endereço Bitcoin"}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                                    <p className="text-xs text-white/70 mb-2">
                                                        Seu endereço Bitcoin:
                                                    </p>
                                                    <div className="flex items-center justify-between">
                                                        <p className="text-sm text-white font-mono break-all mr-2">
                                                            {bitcoinAddress}
                                                        </p>
                                                        <button
                                                            onClick={() => copyToClipboard(bitcoinAddress)}
                                                            className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 rounded transition-all duration-200 text-xs whitespace-nowrap"
                                                        >
                                                            Copiar
                                                        </button>
                                                    </div>
                                                </div>
                                                
                                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                                    <p className="text-blue-400 text-sm font-semibold mb-2">
                                                        ℹ️ Instruções:
                                                    </p>
                                                    <div className="text-white/80 text-xs space-y-1">
                                                        <p>• Envie Bitcoin para o endereço acima</p>
                                                        <p>• Valor mínimo: 0.001 BTC</p>
                                                        <p>• Após confirmação, você receberá ckBTC</p>
                                                        <p>• Processo pode levar algumas horas</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

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
                            </div>
                        ) : null}
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