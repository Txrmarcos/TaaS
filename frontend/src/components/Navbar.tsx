"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Menu, X, Wallet, ChevronDown, Copy, Check } from "lucide-react";
import { useAuth } from "frontend/src/app/auth/useAuth";
import { useWalletBalance } from "../hooks/useWalletBalance";
import ids from "../../../.dfx/local/canister_ids.json";

type NavigationItem = {
    name: string;
    href: string;
    external?: boolean;
};

const navigationItems: NavigationItem[] = [
    { name: "Chat", href: "/chat" },
    { name: "Rounded Table", href: "/round" },              
    { name: "Finance", href: "/finance" },
    { name: "Profile", href: "/profile-area" },
];

const canisterIds = [
    { name: "Bot-Plan", id: ids["round-table"]?.local },
    { name: "Round-Table", id: ids["bot-plan"]?.local },
    { name: "Search-News", id: ids["search-news"]?.local },
    { name: "Veredict", id: ids["verdict"]?.local },
];

export const Navbar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCanisterDropdownOpen, setIsCanisterDropdownOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Hooks para autenticação e saldo
    const { principal } = useAuth();
    const { icpBalance, ckBalance, isLoading } = useWalletBalance(principal);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Fecha o dropdown quando clica fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsCanisterDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const navigateTo = (href: string, external?: boolean) => {
        if (external) {
            window.open(href, "_blank");
        } else {
            router.push(href);
        }
        setIsMobileMenuOpen(false);
    };

    const copyCanisterId = async (id: string) => {
        try {
            await navigator.clipboard.writeText(id);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error("Erro ao copiar:", err);
        }
    };

    const openCanisterDashboard = (id: string) => {
        window.open(`https://dashboard.internetcomputer.org/canister/${id}`, "_blank");
    };

    return (
        <header
            className={`fixed top-4 left-4 right-4 z-50 mx-auto max-w-6xl rounded-xl px-4 sm:px-6 py-3 transition-all duration-300 backdrop-blur-md border ${
                isScrolled
                    ? "bg-[#0B0E13]/90 border-white/10 shadow-lg"
                    : "bg-transparent border-transparent shadow-none"
            }`}
        >
            <div className="flex items-center justify-between h-16">
                <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => router.push('/')}
                >
                    <div className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-[#FF4D00] to-[#FF007A] shadow-md">
                        <span
                            className="text-white text-lg font-semibold tracking-wide"
                            style={{ fontFamily: "var(--font-orbitron)" }}
                        >
                            TaaS
                        </span>
                    </div>
                </div>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6">
                    
                    {/* Navigation */}
                    <nav className="flex items-center space-x-6">
                        {navigationItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => navigateTo(item.href, item.external)}
                                className="text-sm text-white/80 hover:text-white font-medium relative group transition-colors"
                            >
                                {item.name}
                                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] group-hover:w-full transition-all duration-300"></span>
                            </button>
                        ))}
                        
                        {/* Canister Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsCanisterDropdownOpen(!isCanisterDropdownOpen)}
                                className="text-sm text-white/80 hover:text-white font-medium relative group transition-colors flex items-center gap-1"
                            >
                                Canisters
                                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isCanisterDropdownOpen ? 'rotate-180' : ''}`} />
                                <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] group-hover:w-full transition-all duration-300"></span>
                            </button>

                            {isCanisterDropdownOpen && (
                                <div className="absolute top-full right-0 mt-2 w-80 bg-[#0B0E13]/95 backdrop-blur-md border border-white/10 rounded-xl shadow-lg overflow-hidden animate-fade-in">
                                    <div className="px-4 py-3 border-b border-white/10">
                                        <h3 className="text-sm font-semibold text-white">Canister IDs</h3>
                                        <p className="text-xs text-white/60 mt-1">Clique para copiar ou visualizar</p>
                                    </div>
                                    <div className="py-2 max-h-64 overflow-y-auto">
                                        {canisterIds.map((canister) => (
                                            <div
                                                key={canister.id}
                                                className="px-4 py-3 hover:bg-white/5 transition-colors group"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-white truncate">
                                                            {canister.name}
                                                        </p>
                                                        <p className="text-xs text-white/60 font-mono truncate">
                                                            {canister.id}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-3">
                                                        <button
                                                            onClick={() => copyCanisterId(canister.id)}
                                                            className="p-1.5 text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/10"
                                                            title="Copiar ID"
                                                        >
                                                            {copiedId === canister.id ? (
                                                                <Check className="h-3 w-3 text-green-400" />
                                                            ) : (
                                                                <Copy className="h-3 w-3" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => openCanisterDashboard(canister.id)}
                                                            className="text-xs px-2 py-1 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white rounded-md hover:opacity-80 transition-opacity"
                                                            title="Ver Dashboard"
                                                        >
                                                            Dashboard
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </nav>
                </div>

                <button
                    className="md:hidden p-2 text-white/80 hover:text-white transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-[#0B0E13]/95 backdrop-blur-md border-t border-white/10 rounded-b-xl animate-fade-in overflow-hidden">
                    <nav className="px-6 py-4 space-y-4">
                        {navigationItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => navigateTo(item.href, item.external)}
                                className="block w-full text-left text-white/80 hover:text-white text-sm font-medium cursor-pointer"
                            >
                                {item.name}
                            </button>
                        ))}
                        
                        {/* Mobile Canister Section */}
                        <div className="border-t border-white/10 pt-4">
                            <h3 className="text-sm font-semibold text-white mb-3">Canisters</h3>
                            <div className="space-y-3">
                                {canisterIds.map((canister) => (
                                    <div key={canister.id} className="space-y-2">
                                        <p className="text-sm font-medium text-white">{canister.name}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-xs text-white/60 font-mono flex-1 truncate">
                                                {canister.id}
                                            </p>
                                            <button
                                                onClick={() => copyCanisterId(canister.id)}
                                                className="p-1 text-white/60 hover:text-white transition-colors"
                                            >
                                                {copiedId === canister.id ? (
                                                    <Check className="h-3 w-3 text-green-400" />
                                                ) : (
                                                    <Copy className="h-3 w-3" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
};