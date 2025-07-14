import { ExternalLink, Github } from "lucide-react";

const footerLinks = [
    { name: "Docs", href: "https://google.com", external: true },
    { name: "Governance", href: "https://google.com", external: true },
    { name: "Privacy", href: "https://google.com", external: true },
    {
        name: "GitHub",
        href: "https://github.com/Txrmarcos/TaaS",
        external: true,
        icon: Github,
    },
];

export const Footer = () => {
    return (
        <footer className="bg-[#0B0E13] text-white/80 border-t border-white/10 py-12 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF4D00] to-[#FF007A] flex items-center justify-center shadow-md">
                            <span
                                className="text-white font-bold text-lg"
                                style={{ fontFamily: "var(--font-orbitron)" }}
                            >
                                T
                            </span>
                        </div>
                        <span
                            className="text-xl font-bold tracking-tight text-white"
                            style={{ fontFamily: "var(--font-orbitron)" }}
                        >
                            TaaS
                        </span>
                    </div>

                    {/* Links */}
                    <div className="flex flex-wrap gap-6 md:gap-8 text-sm">
                        {footerLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                target={link.external ? "_blank" : undefined}
                                rel={
                                    link.external
                                        ? "noopener noreferrer"
                                        : undefined
                                }
                                className="flex items-center gap-2 hover:text-white transition-colors"
                            >
                                {link.icon && <link.icon className="h-4 w-4" />}
                                {link.name}
                                {link.external && (
                                    <ExternalLink className="h-3 w-3" />
                                )}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-white/5 mt-10 pt-6 text-center text-xs text-white/50">
                    <p>
                        © 2025{" "}
                        <span
                            className="text-white font-medium"
                            style={{ fontFamily: "var(--font-orbitron)" }}
                        >
                            TaaS
                        </span>
                        . Truth as a Service for the Internet Computer
                        ecosystem.
                    </p>
                </div>
            </div>
        </footer>
    );
};
