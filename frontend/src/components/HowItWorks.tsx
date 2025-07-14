import { Search, Filter, CheckCircle, FileSignature } from "lucide-react";

const steps = [
    {
        number: 1,
        icon: Search,
        title: "Query",
        description:
            "Agent makes HTTP request to TaaS canister with verification query.",
    },
    {
        number: 2,
        icon: Filter,
        title: "Search",
        description:
            "TaaS searches external data sources for relevant information.",
    },
    {
        number: 3,
        icon: CheckCircle,
        title: "Trusted-source filter",
        description:
            "Only community-approved sources are used for evidence gathering.",
    },
    {
        number: 4,
        icon: FileSignature,
        title: "Signed verdict",
        description:
            "LLM consolidates evidence and returns cryptographically signed result.",
    },
];

export const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-24 px-6 bg-black">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        How it{" "}
                        <span className="bg-gradient-to-r from-[#FF4D00] to-[#FF007A] bg-clip-text text-transparent">
                            works
                        </span>
                    </h2>
                    <p className="text-lg text-white/70 max-w-2xl mx-auto">
                        A simple four-step process that delivers verifiable
                        truth to your applications.
                    </p>
                </div>

                <div className="grid lg:grid-cols-4 gap-8 lg:gap-4">
                    {steps.map((step, index) => (
                        <div
                            key={step.number}
                            className="group text-center p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:-translate-y-2 transition-all duration-300"
                        >
                            <div className="mx-auto w-14 h-14 mb-5 rounded-full bg-gradient-to-br from-[#FF4D00] to-[#FF007A] flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                                <step.icon className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2 text-white group-hover:text-white/90">
                                {step.title}
                            </h3>
                            <p className="text-sm text-white/70 leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="text-center mt-16">
                    <p className="text-white/60 mb-6">
                        Ready to integrate TaaS into your application?
                    </p>
                    <a
                        href="https://google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white font-medium hover:opacity-90 transition-all duration-200"
                    >
                        View Documentation
                    </a>
                </div>
            </div>
        </section>
    );
};
