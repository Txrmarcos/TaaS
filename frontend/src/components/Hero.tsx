"use client";

import { ExternalLink, ArrowRight } from "lucide-react";
import { NetworkGraph } from "./NetworkGraph";
import { Button } from "./ui/Button";
import { useAuth } from "@/app/auth/useAuth";

export const Hero = () => {
     const { isAuthenticated, principal, login, logout, isLoading } = useAuth();
    
    return (
        <section
            id="hero"
            className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black pt-20"
        >
            <div className="absolute inset-0 opacity-50">
                <NetworkGraph />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
                <div className="animate-fade-in">
                    {isAuthenticated && principal && (
                        <span className="text-xs text-white/70 font-mono truncate max-w-[120px]">
                        Logged in as: {principal.toText()}
                        </span>
                    )}
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4D00] to-[#FF007A]">
                         a   On-chain trust
                            <br />
                            starts here.
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-white/80 mb-12 max-w-3xl mx-auto font-normal">
                        TaaS provides a universal truth layer for dApps and
                        agents in the Internet Computer ecosystem, eliminating
                        the need for individual validation implementations.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        {isAuthenticated ? (
                            <button
                                onClick={() => window.location.href = "/news-feed"}
                                className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white hover:opacity-90 transition-all duration-200"
                            >
                                Go to News Feed
                                <ExternalLink className="ml-2 h-5 w-5" />
                            </button>
                            ) : (
                            <button
                                onClick={login}
                                className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white hover:opacity-90 transition-all duration-200"
                            >
                                Start now
                                <ExternalLink className="ml-2 h-5 w-5" />
                            </button>
                            )}
                        <button
                            className="inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium text-white/80 border border-white/20 hover:border-white hover:text-white transition-all duration-200"
                            onClick={() =>
                                document
                                    .getElementById("how-it-works")
                                    ?.scrollIntoView({ behavior: "smooth" })
                            }
                        >
                            See how it works
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="absolute top-20 left-10 animate-float animation-delay-1000">
                    <div className="w-3 h-3 bg-white/20 rounded-full"></div>
                </div>
                <div className="absolute top-40 right-16 animate-float animation-delay-2000">
                    <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                </div>
                <div className="absolute bottom-20 left-20 animate-float animation-delay-3000">
                    <div className="w-4 h-4 bg-white/10 rounded-full"></div>
                </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent"></div>
        </section>
    );
};
