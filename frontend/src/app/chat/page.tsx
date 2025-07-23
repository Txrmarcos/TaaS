"use client";
import React, { useEffect, useState } from "react";
import {
    User,
    Shield,
    Copy,
    CheckCircle,
    AlertCircle,
    Zap,
    Clock,
    MessageSquare,
    Send,
    Sparkles,
    Loader2,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { createSearchNewsActor } from "../utils/canister";

type UserStatus = {
    plan: { Premium?: boolean; Pro?: boolean; Standard?: boolean };
    requestsLeft: number;
    resetAt: bigint;
};

export default function BotTestPage() {
    const [status, setStatus] = useState<UserStatus | null>(null);
    const [prompt, setPrompt] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    
    const { principal, isAuthenticated, isLoading,authClient } = useAuth();


    const {botActor, searchNewsActor } = createSearchNewsActor(authClient);

    useEffect(() => {
        if (isAuthenticated && principal) {
            fetchStatus();
        }
    }, [isAuthenticated, principal]);

    const fetchStatus = async () => {
        if (!isAuthenticated || !principal) {
            return;
        }
        
        try {
            const res = (await botActor.get_user_status()) as any;
            setStatus(res[0] as UserStatus);
        } catch (err) {
            console.error("Error fetching status:", err);
        }
    };

    const handleSendPrompt = async () => {
        if (!prompt.trim() || !isAuthenticated) return;
        
        try {
            setLoading(true);
            setResponse("");
            const res = await searchNewsActor.searchNews(prompt);
            setResponse(res as string);
            fetchStatus();
        } catch (err) {
            console.error("Error processing prompt:", err);
            setResponse("❌ Error processing prompt. Please try again.");
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
            console.error("Error copying:", err);
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
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen bg-[#0B0E13] text-white font-sans">
                <Navbar />
                <main className="flex flex-col flex-grow px-4 pt-32 max-w-4xl mx-auto gap-6 items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p>Carregando...</p>
                </main>
                <Footer />
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex flex-col min-h-screen bg-[#0B0E13] text-white font-sans">
                <Navbar />
                <main className="flex flex-col flex-grow px-4 pt-32 max-w-4xl mx-auto gap-6 items-center justify-center">
                    <AlertCircle className="w-12 h-12 text-yellow-400" />
                    <h2 className="text-2xl font-bold">Restricted Access</h2>
                    <p>You need to be logged in to access this page.</p>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#0B0E13] text-white font-sans">
            <Navbar />

            <main className="flex flex-col flex-grow px-4 pt-32 max-w-4xl mx-auto gap-6">
                {/* Chat Section */}
                <div className="flex flex-col w-full">
                    <div className="bg-white/5 border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl border overflow-hidden flex flex-col min-h-[700px] hover:shadow-[#FF4D00]/10 hover:shadow-2xl transition-all duration-300">
                        {/* Chat Header */}
                        <div className="p-4 sm:p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-white/10">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-xl flex items-center justify-center shadow-lg">
                                    <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-3xl font-bold text-white">AI Chat</h2>
                                </div>
                            </div>
                        </div>

                        {/* Chat Content */}
                        <div className="p-4 sm:p-6 flex-1 flex flex-col space-y-6">
                            {/* Welcome Section - Shows First */}
                            {!response && !loading && (
                                <div className="flex flex-col items-center justify-center py-8 space-y-6">
                                    <div className="text-center space-y-2">
                                        <h3 className="text-lg sm:text-xl font-semibold text-white">Ready to Help</h3>
                                        <p className="text-xs sm:text-sm text-white/75 mt-1">Ask anything about markets, news, and financial insights to verify truthfulness.</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
                                        <button 
                                            onClick={() => setPrompt("Can you verify if the recent news about the stock market crash is true?")}
                                            className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200 text-left"
                                        >
                                            <div className="text-sm text-white">🔎 Fact Check</div>
                                            <div className="text-xs text-white/60 mt-1">Verify news accuracy</div>
                                        </button>
                                        <button 
                                            onClick={() => setPrompt("Is the claim about the new tax law affecting all small businesses true?")}
                                            className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200 text-left"
                                        >
                                            <div className="text-sm text-white">🧐 Truth Check</div>
                                            <div className="text-xs text-white/60 mt-1">Assess claim accuracy</div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Input Section */}
                            <div className="space-y-7">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-3 flex items-center space-x-2">
                                        <span>Your Question</span>
                                        <div className="w-2 h-2 bg-[#FF007A] rounded-full animate-pulse"></div>
                                    </label>
                                    <div className="relative group">
                                        <textarea
                                            value={prompt}
                                            onChange={(e) => setPrompt(e.target.value)}
                                            placeholder='Example: "Is it true that the government recently banned cryptocurrency trading?"'
                                            className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#ffffff]/80 focus:border-transparent transition-all duration-300 resize-none min-h-[120px] sm:min-h-[140px] hover:bg-white/15 text-sm sm:text-base group-hover:border-white/30"
                                            rows={4}
                                        />
                                        <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                                            <span className={`text-xs px-2 py-1 rounded-full transition-colors ${
                                                prompt.length > 0 
                                                    ? 'text-[#FF007A] bg-[#FF007A]/10' 
                                                    : 'text-white/50 bg-white/10'
                                            }`}>
                                                {prompt.length} chars
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSendPrompt}
                                    disabled={loading || !prompt.trim() || !isAuthenticated}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white rounded-xl hover:opacity-90 hover:scale-[1.02] transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 font-semibold flex items-center justify-center space-x-3 text-sm sm:text-base"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Analyzing...</span>
                                            <div className="flex space-x-1">
                                                <div className="w-1 h-1 bg-white rounded-full animate-bounce"></div>
                                                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                                <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            <span>Send Message</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Response Section */}
                            {response && (
                                <div className="space-y-4 animate-fadeIn">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-lg flex items-center justify-center">
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>
                                            <h3 className="text-lg sm:text-xl font-semibold text-white">AI Response</h3>
                                        </div>
                                        <button
                                            onClick={() => copyToClipboard(response)}
                                            className="p-2 sm:p-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200 group"
                                            title="Copy response"
                                        >
                                            {copied ? (
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                            ) : (
                                                <Copy className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                                            )}
                                        </button>
                                    </div>
                                    <div className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-4 sm:p-6 border border-white/10 backdrop-blur-sm shadow-inner">
                                        <div className="prose prose-invert prose-sm sm:prose-base max-w-none">
                                            <p className="text-white/90 whitespace-pre-line leading-relaxed text-sm sm:text-base">
                                                {response}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Account Status Section */}
                <div className="flex flex-col">
                    {status ? (
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col mb-8">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Account Status</h2>
                                <div className="flex items-center space-x-2">
                                    <Shield className="w-5 h-5 text-green-400" />
                                    <span className="text-green-400 text-sm">Active</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className={`w-8 h-8 ${getPlanColor(status.plan)} rounded-lg flex items-center justify-center text-sm`}>
                                            {getPlanIcon(status.plan)}
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/50">Current Plan</p>
                                            <p className="text-white font-semibold">{getPlanName(status.plan)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-green-600 rounded-lg flex items-center justify-center">
                                            <Zap className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/50">Requests Left</p>
                                            <p className="text-white font-semibold text-lg">{status.requestsLeft}</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-white/10 rounded-full h-2 mt-2">
                                        <div
                                            className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${Math.min((Number(status.requestsLeft) / 500) * 100, 100)}%`,
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
                                            <p className="text-xs text-white/50">Reset in</p>
                                            <p className="text-white font-semibold">
                                                {formatResetTime(status.resetAt)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl flex flex-col mb-8">
                            <div className="flex items-center justify-center space-x-3">
                                <AlertCircle className="w-6 h-6 text-yellow-400" />
                                <p className="text-white/80">
                                    {isAuthenticated ? "No status loaded. Click \"Refresh\"." : "Faça login para ver seu status."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
}