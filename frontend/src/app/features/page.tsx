"use client";
import React from "react";
import { Newspaper, ShieldCheck, ArrowRight } from "lucide-react";

const FeatureCard = ({ icon, title, description, buttonText, href }: any) => (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl p-8 flex flex-col h-full transform hover:-translate-y-2 transition-transform duration-300">
        <div className="flex-shrink-0 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-2xl flex items-center justify-center shadow-lg">
                {icon}
            </div>
        </div>
        <div className="flex-grow">
            <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
            <p className="text-white/70 leading-relaxed">{description}</p>
        </div>
        <div className="mt-8">
            <a
                href={href}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20 font-semibold"
            >
                <span>{buttonText}</span>
                <ArrowRight className="w-4 h-4" />
            </a>
        </div>
    </div>
);

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-[#0B0E13] text-white font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Our Services
                    </h1>
                    <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
                        Powerful tools to validate information and access news with expert curation.
                    </p>
                </div>


                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    <FeatureCard
                        icon={<Newspaper className="w-8 h-8 text-white" />}
                        title="Roundtable News Search"
                        description="Access a feed of news and articles selected and recommended by our expert panel. Filter by relevance and gain access to trusted curated information for your analysis."
                        buttonText="Explore News"
                        href="/news-search"
                    />

                    <FeatureCard
                        icon={<ShieldCheck className="w-8 h-8 text-white" />}
                        title="Fact & Rating Verdict"
                        description="Submit a claim or question in natural language to receive a detailed verdict. Our system queries reliable data sources to assess the veracity of your input, returning a confidence rating."
                        buttonText="Verify a Fact"
                        href="/fact-check"
                    />
                </div>
            </div>
        </div>
    );
}
