import { Eye, History, Puzzle, Brain } from "lucide-react";

const features = [
    {
        icon: Eye,
        title: "Transparent verification",
        description:
            "Every verification process is auditable with complete source tracking and decision logs.",
    },
    {
        icon: History,
        title: "Source-approval history",
        description:
            "Full transparency on how sources are added, removed, and voted on by the community.",
    },
    {
        icon: Puzzle,
        title: "Modular source engine",
        description:
            "Extensible architecture allowing new data sources and verification methods.",
    },
    {
        icon: Brain,
        title: "LLM-powered verdicts",
        description:
            "Native ICP LLM consolidates evidence from approved sources into signed verdicts.",
    },
];

export const KeyFeatures = () => {
    return (
        <section id="features" className="py-24 px-6 bg-black">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Key{" "}
                        <span className="bg-gradient-to-r from-[#FF4D00] to-[#FF007A] bg-clip-text text-transparent">
                            features
                        </span>
                    </h2>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        Advanced capabilities that set TaaS apart in the
                        decentralized truth verification space.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className="group relative animate-fade-in"
                            style={{ animationDelay: `${index * 150}ms` }}
                        >
                            <div className="relative p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:-translate-y-2 transition-all duration-300 h-full">
                                <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-[#FF4D00] to-[#FF007A] mb-6 group-hover:shadow-lg transition-all duration-300">
                                    <feature.icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-xl font-semibold mb-4 text-white group-hover:text-white/90 transition-colors duration-300">
                                    {feature.title}
                                </h3>
                                <p className="text-white/70 leading-relaxed">
                                    {feature.description}
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
