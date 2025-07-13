"use client";
import React, { useState } from "react";
import {
    Bot,
    Menu,
    X,
    LayoutDashboard,
    Star,
    DollarSign,
    Code,
    MessageSquare,
    Wallet,
} from "lucide-react";

const NavItem = ({ href, children }: any) => (
    <a
        href={href}
        className="text-white/70 hover:text-white transition-colors duration-300 text-sm font-medium"
    >
        {children}
    </a>
);

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <nav className="bg-[#0B0E13] sticky top-0 z-50 shadow-lg">
            <div className="bg-black/20 backdrop-blur-xl border-b border-white/10 mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                        <a
                            href="/login"
                            className="flex items-center space-x-3"
                        >
                            <div className="w-12 h-12 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-xl flex items-center justify-center shadow-lg">
                                <Bot className="w-7 h-7 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-white">
                                AI Platform
                            </span>
                        </a>
                    </div>

                    {/* Desktop Nav */}
                    <div className="hidden md:flex md:items-center md:space-x-8">
                        <NavItem href="/wallet">
                            <Wallet className="inline-block w-4 h-4 mr-1 mb-0.5" />
                            Wallet
                        </NavItem>
                        <NavItem href="/features">
                            <Star className="inline-block w-4 h-4 mr-1 mb-0.5" />
                            Features
                        </NavItem>
                        <NavItem href="/pricing">
                            <DollarSign className="inline-block w-4 h-4 mr-1 mb-0.5" />
                            Pricing
                        </NavItem>
                        <NavItem href="/api">
                            <Code className="inline-block w-4 h-4 mr-1 mb-0.5" />
                            API
                        </NavItem>
                        <NavItem href="/chat">
                            <MessageSquare className="inline-block w-4 h-4 mr-1 mb-0.5" />
                            Chat
                        </NavItem>
                    </div>

                    {/* Action + Mobile Toggle */}
                    <div className="flex items-center space-x-4">
                        <a
                            href="#"
                            className="hidden sm:block px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-lg hover:opacity-90 transition-all duration-300 shadow-md"
                        >
                            Get Started
                        </a>
                        <div className="md:hidden">
                            <button
                                onClick={toggleMenu}
                                className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                            >
                                <span className="sr-only">Abrir menu</span>
                                {isOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <Menu className="h-6 w-6" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden absolute w-full bg-[#0B0E13]/95 backdrop-blur-xl border-b border-white/10 pb-4">
                    <div className="px-2 pt-2 pb-3 space-y-2 sm:px-3 flex flex-col items-center">
                        <NavItem href="#">Wallet</NavItem>
                        <NavItem href="#">Features</NavItem>
                        <NavItem href="#">Pricing</NavItem>
                        <NavItem href="#">API</NavItem>
                        <NavItem href="#">Chat</NavItem>
                        <a
                            href="#"
                            className="w-11/12 mt-4 text-center px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-lg hover:opacity-90 transition-all duration-300 shadow-md"
                        >
                            Get Started
                        </a>
                    </div>
                </div>
            )}
        </nav>
    );
}
