"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { 
    Copy, 
    Check, 
    ChevronDown, 
    Wallet,
    MessageSquare, // Ícone para Chat
    Edit3,         // Ícone para Escrever News
    Users,         // Ícone para Rounded Table
    Banknote,      // Ícone para Finance
    User,          // Ícone para Profile
    Box,           // Ícone para Canister
    Newspaper      // Ícone para Dashboard
} from "lucide-react";
import { useAuth } from "../app/auth/useAuth";
import { useWalletBalance } from "../hooks/useWalletBalance";
import ids from "../../../canister_ids.json";

// Adicionamos um ícone a cada item de navegação
type NavigationItem = {
    name: string;
    href: string;
    icon: React.ElementType;
    external?: boolean;
};

// Lista de itens de navegação com seus ícones
const navigationItems: NavigationItem[] = [
    { name: "News Feed", href: "/news-feed", icon: Newspaper },
    { name: "Publish News", href: "/publish", icon: Edit3 },
    { name: "Rounded Table", href: "/round", icon: Users },
    { name: "Chat", href: "/chat", icon: MessageSquare },
    { name: "Finance", href: "/finance", icon: Banknote },
    { name: "Profile", href: "/profile-area", icon: User },
];

const canisterIds = [
    { name: "Bot-Plan", id: ids["bot-plan"].ic },
    { name: "Round-Table", id: ids["round-table"].ic },
    { name: "Search-News", id: ids["search-news"].ic },
    { name: "Publish-News", id: ids["posts"].ic },
    { name: "Users", id: ids["users"].ic },
];

export const Sidebar = () => {
    const [isCanisterMenuOpen, setIsCanisterMenuOpen] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    
    const router = useRouter();
    const pathname = usePathname(); // Hook para saber a rota atual
    
    const { principal } = useAuth();
    // Você pode remover isLoading se não for exibir um estado de carregamento
    const { icpBalance, ckBalance } = useWalletBalance(principal);

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(text);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error("Error copying:", err);
        }
    };
    
    const openCanisterDashboard = (id: string) => {
        window.open(`https://dashboard.internetcomputer.org/canister/${id}`, "_blank");
    };

    const navigateTo = (href: string) => {
        router.push(href);
    };

    // Componente reutilizável para a lista de canisters
    const CanisterList = () => (
        <div className="py-2 max-h-64 overflow-y-auto space-y-1">
            {canisterIds.map((canister) => (
                <div key={canister.id} className="px-3 py-2.5 hover:bg-white/5 rounded-lg transition-colors group">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openCanisterDashboard(canister.id)}>
                            <p className="text-sm font-medium text-white truncate group-hover:text-[#FF4D00]">
                                {canister.name}
                            </p>
                            <p className="text-xs text-white/60 font-mono truncate mt-0.5">
                                {canister.id}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                            <button
                                onClick={() => copyToClipboard(canister.id)}
                                className="p-1.5 text-white/60 hover:text-white transition-colors rounded-md hover:bg-white/10"
                                title="Copiar ID"
                            >
                                {copiedId === canister.id ? (
                                    <Check className="h-4 w-4 text-green-400" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <>
            {/* ======================= */}
            {/* DESKTOP SIDEBAR      */}
            {/* ======================= */}
            <aside className="hidden lg:flex flex-col w-72 h-screen fixed top-0 left-0 z-40 bg-[#0B0E13] border-r border-white/10 p-6 overflow-y-auto">
                {/* Logo */}
                <div className="flex items-center gap-3 cursor-pointer mb-8" onClick={() => router.push('/')}>
                    <div className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-[#FF4D00] to-[#FF007A] shadow-md">
                        <span className="text-white text-xl font-semibold tracking-wide" style={{ fontFamily: "var(--font-orbitron)" }}>
                            TaaS
                        </span>
                    </div>
                </div>

                {/* Navegação Principal */}
                <nav className="flex-1 space-y-2">
                    {navigationItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <button
                                key={item.name}
                                onClick={() => navigateTo(item.href)}
                                className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                                    isActive
                                        ? 'bg-white/10 text-white'
                                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                                }`}
                            >
                                <item.icon className="h-5 w-5" />
                                <span>{item.name}</span>
                            </button>
                        );
                    })}

                    {/* Menu Canisters Colapsável */}
                    <div>
                        <button
                            onClick={() => setIsCanisterMenuOpen(!isCanisterMenuOpen)}
                            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-base font-medium text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                        >
                            <Box className="h-5 w-5" />
                            <span>Canisters</span>
                            <ChevronDown className={`ml-auto h-4 w-4 transition-transform duration-200 ${isCanisterMenuOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isCanisterMenuOpen && (
                            <div className="ml-4 mt-1 border-l border-white/10 pl-4 animate-fade-in">
                                <CanisterList />
                            </div>
                        )}
                    </div>
                </nav>

                {/* Seção do Usuário/Carteira */}
                <div className="mt-auto">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-3 mb-3">
                            <Wallet className="h-5 w-5 text-[#FF4D00]" />
                            <h3 className="font-semibold text-white">Sua Carteira</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-white/70">ICP:</span>
                                <span className="font-mono text-white">{icpBalance ?? '0.00'}</span>
                            </div>
                             <div className="flex justify-between items-center">
                                <span className="text-white/70">ckBTC:</span>
                                <span className="font-mono text-white">{ckBalance ?? '0.00'}</span>
                            </div>
                        </div>
                        {principal && (
                             <div className="mt-4 pt-3 border-t border-white/10">
                                 <p className="text-xs text-white/60 mb-1">Principal ID:</p>
                                 <div className="flex items-center gap-2">
                                     <p className="text-xs font-mono text-white/70 truncate flex-1">{principal.toText()}</p>
                                      <button
                                        onClick={() => copyToClipboard(principal.toText())}
                                        className="p-1 text-white/60 hover:text-white transition-colors"
                                        title="Copiar Principal ID"
                                    >
                                        {copiedId === principal.toText() ? (
                                            <Check className="h-4 w-4 text-green-400" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </button>
                                 </div>
                             </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* ======================== */}
            {/* MOBILE BOTTOM NAV     */}
            {/* ======================== */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0B0E13]/90 backdrop-blur-md border-t border-white/10 z-50">
                <div className="flex justify-around items-center h-16">
                    {navigationItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <button
                                key={`mobile-${item.name}`}
                                onClick={() => navigateTo(item.href)}
                                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-md transition-colors ${
                                    isActive ? 'text-[#FF4D00]' : 'text-white/60 hover:text-white'
                                }`}
                            >
                                <item.icon className="h-6 w-6" />
                                <span className="text-xs font-medium">{item.name}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>
            
            {/* Adiciona padding ao conteúdo principal para não ser sobreposto pela sidebar/bottom-nav */}
            <main className="lg:ml-72 pb-16 lg:pb-0">
                {/* O conteúdo da sua página (children) virá aqui */}
            </main>
        </>
    );
};