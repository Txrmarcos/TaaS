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
                        Nossos Serviços
                    </h1>
                    <p className="text-lg md:text-xl text-white/70 max-w-3xl mx-auto">
                        Ferramentas poderosas para validar informações e acessar
                        notícias com curadoria especializada.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                    <FeatureCard
                        icon={<Newspaper className="w-8 h-8 text-white" />}
                        title="Busca de Notícias da Mesa Redonda"
                        description="Acesse um feed de notícias e artigos selecionados e recomendados por nossa mesa de especialistas. Filtre por relevância e tenha acesso a informações com curadoria de confiança para suas análises."
                        buttonText="Explorar Notícias"
                        href="/news-search"
                    />

                    <FeatureCard
                        icon={<ShieldCheck className="w-8 h-8 text-white" />}
                        title="Veredito de Fatos & Rating"
                        description="Submeta uma afirmação ou pergunta em linguagem natural para receber um veredito detalhado. Nosso sistema consulta fontes de dados confiáveis para avaliar a veracidade do seu input, retornando um rating de confiança."
                        buttonText="Verificar um Fato"
                        href="/fact-check"
                    />
                </div>
            </div>
        </div>
    );
}
