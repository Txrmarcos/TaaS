"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

const navigationItems = [
    { name: "Home", href: "#hero" },
    { name: "Pillars", href: "#pillars" },
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    {
        name: "GitHub",
        href: "https://github.com/Txrmarcos/TaaS",
        external: true,
    },
];

export const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const { isAuthenticated, principal, login, logout, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const scrollToSection = (href: string) => {
        if (href.startsWith("#")) {
            const element = document.querySelector(href);
            if (element) element.scrollIntoView({ behavior: "smooth" });
        } else {
            window.open(href, "_blank");
        }
        setIsMobileMenuOpen(false);
    };

    return (
        <header
            className={`fixed top-4 left-4 right-4 z-50 mx-auto max-w-6xl rounded-xl px-6 py-3 transition-all duration-300 backdrop-blur-md border ${
                isScrolled
                    ? "bg-[#0B0E13]/90 border-white/10 shadow-lg"
                    : "bg-transparent border-transparent shadow-none"
            }`}
        >
            <div className="flex items-center justify-between h-16">
                <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => scrollToSection("#hero")}
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

                <nav className="hidden md:flex items-center space-x-8">
                    {navigationItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => scrollToSection(item.href)}
                            className="text-sm text-white/80 hover:text-white font-medium relative group transition-colors"
                        >
                            {item.name}
                            <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] group-hover:w-full transition-all duration-300"></span>
                        </button>
                    ))}
                    {/* Botão de Login/Logout */}
                    {isAuthenticated && principal ? (
                        <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-white/70 font-mono truncate max-w-[120px]">{principal.toText()}</span>
                            <button
                                onClick={logout}
                                disabled={isLoading}
                                className="px-3 py-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 text-white text-xs font-semibold shadow-md hover:opacity-90 transition-all duration-300"
                            >
                                {isLoading ? "Exiting..." : "Logout"}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={async () => {
                                await login();
                                router.push("/plans");
                            }}
                            disabled={isLoading}
                            className="ml-4 px-4 py-2 rounded-lg bg-gradient-to-br from-[#FF4D00] to-[#FF007A] text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all duration-300 disabled:opacity-60"
                        >
                            {isLoading ? "Entrando..." : "Login"}
                        </button>
                    )}
                </nav>

                <button
                    className="md:hidden p-2 text-white/80 hover:text-white transition-colors"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? (
                        <X className="h-6 w-6" />
                    ) : (
                        <Menu className="h-6 w-6" />
                    )}
                </button>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 right-0 bg-[#0B0E13]/95 backdrop-blur-md border-t border-white/10 rounded-b-xl animate-fade-in overflow-hidden">
                    <nav className="px-6 py-4 space-y-4">
                        {navigationItems.map((item) => (
                            <button
                                key={item.name}
                                onClick={() => scrollToSection(item.href)}
                                className="block w-full text-left text-white/80 hover:text-white text-sm font-medium cursor-pointer "
                            >
                                {item.name}
                            </button>
                        ))}
                        {isAuthenticated && principal ? (
                            <div className="block w-full mt-2 text-center">
                                <span className="block text-xs text-white/70 font-mono truncate max-w-full mb-2">{principal.toText()}</span>
                                <button
                                    onClick={logout}
                                    disabled={isLoading}
                                    className="w-full px-4 py-2 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all duration-300 disabled:opacity-60"
                                >
                                    {isLoading ? "Exiting..." : "Logout"}
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={async () => {
                                    await login();
                                    router.push("/plans");
                                }}
                                disabled={isLoading}
                                className="block w-full mt-2 text-center px-4 py-2 rounded-lg bg-gradient-to-br from-[#FF4D00] to-[#FF007A] text-white text-sm font-semibold shadow-md hover:opacity-90 transition-all duration-300 disabled:opacity-60"
                            >
                                {isLoading ? "Entering..." : "Login"}
                            </button>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
};
