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


// {/* Seção destacada para o Trading */}

// <div className="mt-16 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-3xl border border-purple-500/30 p-8 lg:p-12">

// <div className="grid lg:grid-cols-2 gap-8 items-center">

// <div>

// <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">

// 🚀 Trading Descentralizado

// </h2>

// <p className="text-white/80 text-lg mb-6 leading-relaxed">

// Gerencie seus ativos digitais com total controle e segurança. Nossa plataforma de trading

// oferece conversões instantâneas entre ICP e ckBTC, mantendo suas chaves privadas sempre

// seguras em seu dispositivo.

// </p>

// <div className="grid grid-cols-2 gap-4 mb-6">

// <div className="bg-white/10 rounded-lg p-4">

// <h4 className="font-semibold text-purple-300 mb-2">🔒 Seguro</h4>

// <p className="text-sm text-white/70">Transações na blockchain com total transparência</p>

// </div>

// <div className="bg-white/10 rounded-lg p-4">

// <h4 className="font-semibold text-pink-300 mb-2">⚡ Rápido</h4>

// <p className="text-sm text-white/70">Conversões instantâneas com taxas competitivas</p>

// </div>

// </div>

// <a

// href="/trading"

// className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 font-semibold text-lg shadow-lg"

// >

// <span>Começar Trading</span>

// <ArrowRight className="w-5 h-5" />

// </a>

// </div>

// <div className="lg:pl-8">

// <div className="bg-white/10 rounded-2xl p-6 border border-white/20">

// <h3 className="text-xl font-semibold text-white mb-4">Tokens Suportados</h3>

// <div className="space-y-4">

// <div className="flex items-center justify-between p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">

// <div className="flex items-center gap-3">

// <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">

// <span className="text-white font-bold text-sm">ICP</span>

// </div>

// <div>

// <p className="text-white font-semibold">Internet Computer</p>

// <p className="text-white/60 text-sm">ICP Token</p>

// </div>

// </div>

// <span className="text-blue-400 font-semibold">Disponível</span>

// </div>

// <div className="flex items-center justify-between p-3 bg-orange-500/20 rounded-lg border border-orange-500/30">

// <div className="flex items-center gap-3">

// <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">

// <span className="text-white font-bold text-sm">₿</span>

// </div>

// <div>

// <p className="text-white font-semibold">Chain-key Bitcoin</p>

// <p className="text-white/60 text-sm">ckBTC Token</p>

// </div>

// </div>

// <span className="text-orange-400 font-semibold">Disponível</span>

// </div>

// </div>

// </div>

// </div>

// </div>

// </div>

// {/* Seção de estatísticas */}

// <div className="mt-16 grid md:grid-cols-3 gap-8">

// <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">

// <div className="text-3xl font-bold text-blue-400 mb-2">24/7</div>

// <p className="text-white/70">Disponibilidade</p>

// </div>

// <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">

// <div className="text-3xl font-bold text-green-400 mb-2">0.1%</div>

// <p className="text-white/70">Taxa de Trading</p>

// </div>

// <div className="text-center p-6 bg-white/5 rounded-xl border border-white/10">

// <div className="text-3xl font-bold text-purple-400 mb-2">100%</div>

// <p className="text-white/70">Descentralizado</p>

// </div>

// </div>

// </div>

// </div> 