"use client";
import React, { useEffect, useState } from "react";
import {
    Plus,
    ExternalLink,
    ThumbsUp,
    ThumbsDown,
    Users,
    Globe,
    Clock,
    CheckCircle,
    XCircle,
} from "lucide-react";
import { roundtableActor } from "../utils/canister";

type Proposal = {
    id: number;
    name: string;
    url: string;
    pr_link: string;
    description: string;
    proposer: string;
    created_at: bigint;
    votes_for: number;
    votes_against: number;
    status: { Pending?: null; Approved?: null; Rejected?: null };
    voters: string[];
};

export default function RoundtablePage() {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [prLink, setPrLink] = useState("");
    const [desc, setDesc] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const fetchProposals = async () => {
        try {
            const list = await roundtableActor.list_proposals();
            setProposals(list as Proposal[]);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchProposals();
    }, []);

    const submitProposal = async () => {
        if (!name.trim() || !url.trim() || !prLink.trim() || !desc.trim()) {
            setMessage("❌ Preencha todos os campos");
            return;
        }

        setIsSubmitting(true);
        try {
            const id = await roundtableActor.propose_source(
                name,
                url,
                prLink,
                desc
            ); // 🟢 Adiciona prLink
            setMessage(`✅ Proposta enviada com sucesso! ID: ${id}`);
            setName("");
            setUrl("");
            setPrLink("");
            setDesc("");
            setShowForm(false);
            fetchProposals();
        } catch (err) {
            console.error(err);
            setMessage("❌ Erro ao enviar proposta");
        } finally {
            setIsSubmitting(false);
        }
    };

    const vote = async (id: number, isFor: boolean) => {
        try {
            const res = await roundtableActor.vote_source(id, isFor);
            setMessage(res as string);
            fetchProposals();
        } catch (err) {
            console.error(err);
            setMessage("❌ Erro ao votar");
        }
    };

    const formatStatus = (status: Proposal["status"]) => {
        if (status.Approved !== undefined)
            return {
                text: "Aprovada",
                color: "text-green-400",
                icon: CheckCircle,
            };
        if (status.Rejected !== undefined)
            return { text: "Rejeitada", color: "text-red-400", icon: XCircle };
        return { text: "Pendente", color: "text-yellow-400", icon: Clock };
    };

    const formatDate = (timestamp: bigint) => {
        const date = new Date(Number(timestamp) / 1000000);
        return date.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    return (
        <div className="min-h-screen bg-[#0B0E13]">
            {/* Header */}
            <header className="bg-black/20 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-lg flex items-center justify-center">
                                    <Globe className="w-5 h-5 text-white" />
                                </div>
                                <span
                                    className="text-xl font-bold bg-gradient-to-r from-[#FF4D00] to-[#FF007A] bg-clip-text text-transparent"
                                    style={{
                                        fontFamily: "'Orbitron', sans-serif",
                                    }}
                                >
                                    TaaS
                                </span>

                                <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                                    On-Chain
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button className="px-4 py-2 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white rounded-lg hover:opacity-90 transition-all duration-200 shadow-lg">
                                🔎 Verificar
                            </button>
                            <button className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-200 border border-white/20">
                                <Users className="w-4 h-4 inline mr-2" />
                                Mesa Redonda
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] bg-clip-text text-transparent">
                        Mesa Redonda
                    </h1>
                    <p className="text-xl text-white/70 max-w-2xl mx-auto">
                        Plataforma descentralizada para propostas e votações de
                        fontes de dados confiáveis
                    </p>
                </div>

                <div className="flex justify-center mb-8">
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-8 py-3 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg flex items-center space-x-2 group"
                    >
                        <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
                        <span className="font-semibold">Nova Proposta</span>
                    </button>
                </div>

                {showForm && (
                    <div className="max-w-2xl mx-auto mb-12">
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
                            <h2 className="text-2xl font-bold text-white mb-6 text-center">
                                Propor Nova Fonte
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                        Nome da Fonte
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF007A] focus:border-transparent transition-all duration-200"
                                        placeholder="Ex: OpenAI GPT-4"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                        URL Oficial
                                    </label>
                                    <input
                                        type="url"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF007A] focus:border-transparent transition-all duration-200"
                                        placeholder="https://exemplo.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                        Link do Pull Request
                                    </label>
                                    <input
                                        type="url"
                                        value={prLink}
                                        onChange={(e) =>
                                            setPrLink(e.target.value)
                                        }
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF007A] focus:border-transparent transition-all duration-200"
                                        placeholder="https://github.com/org/repo/pull/123"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-white/70 mb-2">
                                        Descrição
                                    </label>
                                    <textarea
                                        value={desc}
                                        onChange={(e) =>
                                            setDesc(e.target.value)
                                        }
                                        rows={4}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#FF007A] focus:border-transparent transition-all duration-200 resize-none"
                                        placeholder="Descreva a fonte e sua utilidade..."
                                    />
                                </div>

                                <div className="flex space-x-4">
                                    <button
                                        onClick={submitProposal}
                                        disabled={isSubmitting}
                                        className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                                    >
                                        {isSubmitting
                                            ? "Enviando..."
                                            : "🚀 Enviar Proposta"}
                                    </button>
                                    <button
                                        onClick={() => setShowForm(false)}
                                        className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {message && (
                    <div className="max-w-2xl mx-auto mb-8">
                        <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 text-center">
                            <p className="text-blue-300">{message}</p>
                        </div>
                    </div>
                )}

                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-white mb-8 text-center">
                        Propostas Existentes
                    </h2>

                    {proposals.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Globe className="w-8 h-8 text-white/40" />
                            </div>
                            <p className="text-white/50 text-lg">
                                Nenhuma proposta ainda
                            </p>
                            <p className="text-white/30 text-sm mt-2">
                                Seja o primeiro a propor uma fonte!
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {proposals.map((proposal) => {
                                const status = formatStatus(proposal.status);
                                const votesFor = Number(proposal.votes_for);
                                const votesAgainst = Number(
                                    proposal.votes_against
                                );
                                const StatusIcon = status.icon;
                                const totalVotes = votesFor + votesAgainst;
                                const approvalRate =
                                    totalVotes > 0
                                        ? (votesFor / totalVotes) * 100
                                        : 0;

                                return (
                                    <div
                                        key={proposal.id}
                                        className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 group"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-[#FF007A] transition-colors">
                                                    {proposal.name}
                                                </h3>
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <StatusIcon
                                                        className={`w-4 h-4 ${status.color}`}
                                                    />
                                                    <span
                                                        className={`text-sm font-medium ${status.color}`}
                                                    >
                                                        {status.text}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right text-sm text-white/50">
                                                {formatDate(
                                                    proposal.created_at
                                                )}
                                            </div>
                                        </div>

                                        <p className="text-white/70 mb-4 line-clamp-3">
                                            {proposal.description}
                                        </p>

                                        <div className="flex items-center justify-between mb-4">
                                            <a
                                                href={proposal.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center text-[#00C8FF] hover:text-cyan-300 transition-colors"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                <span className="text-sm truncate">
                                                    Ver fonte
                                                </span>
                                            </a>
                                            <div className="text-sm text-white/50">
                                                {approvalRate.toFixed(0)}%
                                                aprovação
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <div className="flex justify-between text-sm text-white/50 mb-1">
                                                <span>Votos</span>
                                                <span>{totalVotes} total</span>
                                            </div>
                                            <div className="w-full bg-white/10 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${approvalRate}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="flex items-center space-x-1">
                                                    <ThumbsUp className="w-4 h-4 text-green-400" />
                                                    <span className="text-green-400 font-semibold">
                                                        {proposal.votes_for}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                    <ThumbsDown className="w-4 h-4 text-red-400" />
                                                    <span className="text-red-400 font-semibold">
                                                        {proposal.votes_against}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex space-x-3">
                                            <button
                                                onClick={() =>
                                                    vote(proposal.id, true)
                                                }
                                                className="flex-1 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all duration-200 border border-green-500/30 flex items-center justify-center space-x-2"
                                            >
                                                <ThumbsUp className="w-4 h-4" />
                                                <span>Aprovar</span>
                                            </button>
                                            <button
                                                onClick={() =>
                                                    vote(proposal.id, false)
                                                }
                                                className="flex-1 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200 border border-red-500/30 flex items-center justify-center space-x-2"
                                            >
                                                <ThumbsDown className="w-4 h-4" />
                                                <span>Rejeitar</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
