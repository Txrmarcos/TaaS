"use client";
import React, { useEffect, useState } from "react";
import {
    Bot,
    Send,
    RefreshCw,
    User,
    Clock,
    Zap,
    MessageSquare,
    Shield,
    Copy,
    CheckCircle,
    AlertCircle,
    Loader2,
    Sparkles,
} from "lucide-react";

import { botActor } from "../utils/canister";
import { AuthClient } from "@dfinity/auth-client";
import { UserStatus } from "../login/page";

export default function BotTestPage() {
    const [status, setStatus] = useState<UserStatus | null>(null);
    const [prompt, setPrompt] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [principal, setPrincipal] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const fetchStatus = async () => {
        try {
            const res = (await botActor.get_user_status()) as any;
            setStatus(res[0] as UserStatus);
        } catch (err) {
            console.error(err);
        }
    };

    const getPrincipal = async () => {
        try {
            const client = await AuthClient.create();
            const identity = client.getIdentity();
            const p = identity.getPrincipal();
            setPrincipal(p.toText());
        } catch (error) {
            console.error("Erro ao buscar principal:", error);
        }
    };

    useEffect(() => {
        getPrincipal();
        fetchStatus();
    }, []);

    const handleSendPrompt = async () => {
        if (!prompt.trim()) return;

        try {
            setLoading(true);
            setResponse("");
            const res = await botActor.prompt(prompt);
            setResponse(res as string);
            fetchStatus();
        } catch (err) {
            console.error(err);
            setResponse("❌ Erro ao processar prompt. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Erro ao copiar:", err);
        }
    };

    const getPlanColor = (plan: UserStatus["plan"]) => {
        if (plan.Premium) return "from-yellow-400 to-orange-500";
        if (plan.Pro) return "from-blue-400 to-purple-500";
        return "from-green-400 to-emerald-500";
    };

    const getPlanName = (plan: UserStatus["plan"]) => {
        if (plan.Premium) return "Premium";
        if (plan.Pro) return "Pro";
        return "Standard";
    };

    const getPlanIcon = (plan: UserStatus["plan"]) => {
        if (plan.Premium) return "👑";
        if (plan.Pro) return "⚡";
        return "🌟";
    };

    const formatResetTime = (resetAt: bigint) => {
        const date = new Date(Number(resetAt / BigInt(1_000_000)));
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    return (
        <div className="min-h-screen bg-[#0B0E13]">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {principal && (
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-xl flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm text-white/50">
                                        Sua Principal
                                    </p>
                                    <p className="text-white font-mono text-sm break-all">
                                        {principal}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => copyToClipboard(principal)}
                                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200"
                            >
                                {copied ? (
                                    <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                    <Copy className="w-5 h-5 text-white/50" />
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {status ? (
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white">
                                Status da Conta
                            </h2>
                            <div className="flex items-center space-x-2">
                                <Shield className="w-5 h-5 text-green-400" />
                                <span className="text-green-400 text-sm">
                                    Ativo
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div
                                        className={`w-8 h-8 ${getPlanColor(
                                            status.plan
                                        )} rounded-lg flex items-center justify-center text-sm`}
                                    >
                                        {getPlanIcon(status.plan)}
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/50">
                                            Plano Atual
                                        </p>
                                        <p className="text-white font-semibold">
                                            {getPlanName(status.plan)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                                        <Zap className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/50">
                                            Requests Restantes
                                        </p>
                                        <p className="text-white font-semibold text-lg">
                                            {status.requestsLeft}
                                        </p>
                                    </div>
                                </div>
                                <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                                    <div
                                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                                        style={{
                                            width: `${Math.min(
                                                (Number(status.requestsLeft) /
                                                    500) *
                                                    100,
                                                100
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/50">
                                            Reset em
                                        </p>
                                        <p className="text-white font-semibold">
                                            {formatResetTime(status.resetAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-xl mb-8">
                        <div className="flex items-center justify-center space-x-3">
                            <AlertCircle className="w-6 h-6 text-yellow-400" />
                            <p className="text-white/80">
                                Nenhum status carregado. Clique em "Atualizar".
                            </p>
                        </div>
                    </div>
                )}

                <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-white/10">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-xl flex items-center justify-center">
                                <MessageSquare className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Chat com IA
                                </h2>
                                <p className="text-sm text-white/60">
                                    Digite sua pergunta ou prompt
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-white/70 mb-3">
                                Seu Prompt
                            </label>
                            <div className="relative">
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Ex: Explique o que é inteligência artificial de forma simples..."
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF4D00] transition-all duration-200 resize-none min-h-[120px]"
                                />
                                <div className="absolute bottom-3 right-3 text-xs text-white/50">
                                    {prompt.length} caracteres
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSendPrompt}
                            disabled={loading || !prompt.trim()}
                            className="w-full px-6 py-3 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Processando...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    <span>Enviar Prompt</span>
                                </>
                            )}
                        </button>

                        {response && (
                            <div className="mt-8">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-2">
                                        <Sparkles className="w-5 h-5 text-[#FF007A]" />
                                        <h3 className="text-lg font-semibold text-white">
                                            Resposta da IA
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() =>
                                            copyToClipboard(response)
                                        }
                                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200"
                                    >
                                        {copied ? (
                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                        ) : (
                                            <Copy className="w-4 h-4 text-white/50" />
                                        )}
                                    </button>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <p className="text-white/90 whitespace-pre-line leading-relaxed">
                                        {response}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
