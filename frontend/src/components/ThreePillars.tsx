import { Shield, Users, Zap } from "lucide-react";

const pillars = [
    {
        icon: Shield,
        title: "ICP-Native",
        description:
            "Code, logs, and LLM execution 100% on-chain for complete transparency.",
    },
    {
        icon: Users,
        title: "Community Governance",
        description:
            "Decentralized voting determines trusted sources with full transparency.",
    },
    {
        icon: Zap,
        title: "Plug-and-Play API",
        description:
            "Single HTTP call integration without mandatory SDK requirements.",
    },
];

export const ThreePillars = () => {
    return (
        <section id="pillars" className="py-24 px-6 bg-black">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Built on three{" "}
                        <span className="bg-gradient-to-r from-[#FF4D00] to-[#FF007A] bg-clip-text text-transparent">
                            pillars
                        </span>
                    </h2>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        Trust, transparency, and simplicity form the foundation
                        of our truth layer.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {pillars.map((pillar, index) => (
                        <div
                            key={pillar.title}
                            className="group relative animate-fade-in"
                            style={{ animationDelay: `${index * 200}ms` }}
                        >
                            <div className="relative p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:-translate-y-2 transition-all duration-300 h-full">
                                <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-[#FF4D00] to-[#FF007A] mb-6 group-hover:shadow-lg transition-all duration-300">
                                    <pillar.icon className="h-8 w-8 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-white/90 transition-colors duration-300">
                                    {pillar.title}
                                </h3>
                                <p className="text-white/70 leading-relaxed">
                                    {pillar.description}
                                </p>
                                <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
