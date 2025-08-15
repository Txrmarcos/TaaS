"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
    Plus, ExternalLink, ThumbsUp, ThumbsDown, Globe, Clock, CheckCircle, XCircle, Shield, Link,
    TrendingUp, Calendar, User, GitPullRequest, Award, Search, Eye, ArrowRight, Zap, Target,
} from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { Principal } from "@dfinity/principal"; 
import { createSearchNewsActor } from "../utils/canister";

// Canister data
type RawProposal = {
    id: bigint;
    name: string;
    url: string;
    pr_link: string;
    description: string;
    proposer: Principal;
    created_at: bigint;
    votes_for: bigint;
    votes_against: bigint;
    status: { Pending?: null; Approved?: null; Rejected?: null };
    voters: Principal[];
};

// Data formatted for React state
type FormattedProposal = {
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
    const { principal, isAuthenticated, authClient } = useAuth();
    const [proposals, setProposals] = useState<FormattedProposal[]>([]); 
    const [isLoadingProposals, setIsLoadingProposals] = useState(true);
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [prLink, setPrLink] = useState("");
    const [desc, setDesc] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [isLoadingWhitelist, setIsLoadingWhitelist] = useState(true);
    const [whitelist, setWhitelist] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showFullWhitelist, setShowFullWhitelist] = useState(false);

    const { roundtableActor,searchNewsActor } = createSearchNewsActor(authClient);

    
    const fetchProposals = async () => {
        setIsLoadingProposals(true);
        try {
            const rawList = await roundtableActor.list_proposals() as RawProposal[];
            
            const formattedList = rawList.map(p => ({
                ...p,
                id: Number(p.id),
                proposer: p.proposer.toText(), 
                voters: p.voters.map(voter => voter.toText()), 
                votes_for: Number(p.votes_for),
                votes_against: Number(p.votes_against),
            }));

            setProposals(formattedList);
        } catch (err) {
            console.error("Error fetching proposals:", err);
            setProposals([]);
        } finally {
            setIsLoadingProposals(false);
        }
    };
  
     useEffect(() => {
        const fetchData = async () => {
            await fetchProposals();
            await fetchWhitelist();
        };
        fetchData();
    }, []);


    const fetchWhitelist = async () => {
        setIsLoadingWhitelist(true);
        try {
            const domains = await searchNewsActor.getWhitelist();
            console.log("Whitelist fetched:", domains);
            setWhitelist(domains as string[]);
        } catch (err) {
            console.error("Error fetching whitelist:", err);
            setWhitelist([]);
        } finally {
            setIsLoadingWhitelist(false);
        }
    };



    const submitProposal = async () => {
        if (!name.trim() || !url.trim() || !prLink.trim() || !desc.trim()) {
            setMessage("❌ Please fill in all fields");
            return;
        }

        setIsSubmitting(true);
        try {
            await roundtableActor.propose_source(
                name,
                url,
                prLink,
                desc
            );
            setMessage(`✅ Proposal submitted successfully!`);
            setName("");
            setUrl("");
            setPrLink("");
            setDesc("");
            setShowForm(false);
            fetchProposals();
        } catch (err) {
            console.error(err);
            setMessage("❌ Error submitting proposal");
        } finally {
            setIsSubmitting(false);
        }
    };

    const vote = async (id: number, isFor: boolean) => {
        try {
            const res = await roundtableActor.vote_source(BigInt(id), isFor);
            setMessage(res as string);
            fetchProposals();
        } catch (err) {
            console.error(err);
            setMessage("❌ Error voting");
        }
    };


    const formatDate = (timestamp: bigint) => {
        const date = new Date(Number(timestamp) / 1000000);
        return date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const stats = {
        total: proposals.length,
        approved: proposals.filter(p => 'Approved' in p.status).length,
        pending: proposals.filter(p => 'Pending' in p.status).length,
        rejected: proposals.filter(p => 'Rejected' in p.status).length,
        totalVotes: proposals.reduce((sum, p) => sum + p.votes_for + p.votes_against, 0)
    };

    const filteredProposals = proposals.filter(proposal => {
        const matchesSearch = proposal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            proposal.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || 
                            (statusFilter === "pending" && 'Pending' in proposal.status) ||
                            (statusFilter === "approved" && 'Approved' in proposal.status) ||
                            (statusFilter === "rejected" && 'Rejected' in proposal.status);
        return matchesSearch && matchesStatus;
    });

    const formatStatus = (status: FormattedProposal["status"]) => {
        if ('Approved' in status)
            return { text: "Approved", color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30", icon: CheckCircle };
        if ('Rejected' in status)
            return { text: "Rejected", color: "text-red-400 bg-red-500/20 border-red-500/30", icon: XCircle };
        return { text: "Pending", color: "text-amber-400 bg-amber-500/20 border-amber-500/30", icon: Clock };
    };

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage("");
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    
    return (
        <div className="min-h-screen bg-[#0B0E13] text-white">
            <Sidebar />
            <main className="flex flex-col flex-grow px-4 pt-32 pb-20 max-w mx-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Hero Section */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#FF4D00]/80 to-[#FF007A]/80 px-4 py-2 rounded-full mb-6">
                            <Zap className="w-4 h-4 text-white" />
                            <span className="text-white/80 text-sm font-medium">Decentralized Governance</span>
                        </div>
                        <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
                            Round Table
                        </h1>
                        <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                            Decentralized platform for proposals and voting on trusted data sources.</p>
                        <p className="text-white/50 max-w-3xl mx-auto leading-relaxed">
                        Build the future of verified information through community collaboration.</p>
                    </div>

                    {/* Stats Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <Target className="w-8 h-8 text-blue-400" />
                                <span className="text-2xl font-bold text-white">{stats.total}</span>
                            </div>
                            <p className="text-white/60">Total Proposals</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <CheckCircle className="w-8 h-8 text-emerald-400" />
                                <span className="text-2xl font-bold text-white">{stats.approved}</span>
                            </div>
                            <p className="text-white/60">Approved</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <Clock className="w-8 h-8 text-amber-400" />
                                <span className="text-2xl font-bold text-white">{stats.pending}</span>
                            </div>
                            <p className="text-white/60">Pending</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                            <div className="flex items-center justify-between mb-2">
                                <TrendingUp className="w-8 h-8 text-orange-400" />
                                <span className="text-2xl font-bold text-white">{stats.totalVotes}</span>
                            </div>
                            <p className="text-white/60">Total Votes</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                        {/* Sidebar */}
                        <div className="xl:col-span-1 space-y-6">
                           <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl">
    <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-white">Whitelist</h2>
        </div>
        <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full border border-emerald-500/30">
            {whitelist.length}
        </span>
    </div>
    
    {isLoadingWhitelist ? (
        <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400 mx-auto"></div>
            <p className="mt-2 text-white/60 text-sm">Loading...</p>
        </div>
    ) : whitelist.length === 0 ? (
        <div className="text-center py-8">
            <Globe className="w-8 h-8 text-white/30 mx-auto mb-2" />
            <p className="text-white/60 text-sm">No domains in whitelist</p>
        </div>
    ) : (
        <>
            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {(showFullWhitelist ? whitelist : whitelist.slice(0, 5)).map((domain, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all duration-200">
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse flex-shrink-0"></div>
                        <Link className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-white/80 text-sm truncate" title={domain}>
                            {domain}
                        </span>
                    </div>
                ))}
            </div>
            
            {whitelist.length > 5 && (
                <button 
                    onClick={() => setShowFullWhitelist(!showFullWhitelist)}
                    className="w-full px-4 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all duration-200 text-sm flex items-center justify-center space-x-2"
                >
                    <Eye className="w-4 h-4" />
                    <span>
                        {showFullWhitelist 
                            ? `Show less` 
                            : `View all (${whitelist.length - 5} more)`
                        }
                    </span>
                    <div className={`transform transition-transform duration-200 ${showFullWhitelist ? 'rotate-180' : ''}`}>
                        <ArrowRight className="w-4 h-4 rotate-90" />
                    </div>
                </button>
            )}
        </>
    )}
</div>
                            
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setShowForm(!showForm)}
                                        disabled={!isAuthenticated}
                                        className="w-full px-4 py-3 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white rounded-xl hover:opacity-90 transition-all duration-200 font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>New Proposal</span>
                                    </button>
                                    <button className="w-full px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200 flex items-center justify-center space-x-2">
                                        <Award className="w-4 h-4" />
                                        <span>Ranking</span>
                                    </button>
                                </div>
                            </div>
                        </div> 


                        {/* Main Content */}
                        <div className="xl:col-span-3">
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 mb-8">
                                <div className="flex flex-col lg:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                                        <input
                                            type="text"
                                            placeholder="Search proposals..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                        />
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>

                            {showForm && (
                                <div className="mb-8">
                                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-2xl">
                                        <div className="text-center mb-8">
                                            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#FF4D00]/20 to-[#FF007A]/20 px-4 py-2 rounded-full border border-orange-500/30 mb-4">
                                                <Plus className="w-4 h-4 text-orange-400" />
                                                <span className="text-orange-300 text-sm font-medium">New Proposal</span>
                                            </div>
                                            <h2 className="text-3xl font-bold text-white mb-2">Propose New Source</h2>
                                            <p className="text-white/60">Add a new trusted data source for the community</p>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-white/70 mb-2">Source Name</label>
                                                <input
                                                    type="text" value={name} onChange={(e) => setName(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                    placeholder="Ex: OpenAI GPT-4 API"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-white/70 mb-2">Official URL</label>
                                                <input
                                                    type="url" value={url} onChange={(e) => setUrl(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                    placeholder="https://example.com"
                                                />
                                            </div>
                                            <div className="lg:col-span-2">
                                                <label className="block text-sm font-medium text-white/70 mb-2">Pull Request Link</label>
                                                <input
                                                    type="url" value={prLink} onChange={(e) => setPrLink(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                                    placeholder="https://github.com/org/repo/pull/123"
                                                />
                                            </div>
                                            <div className="lg:col-span-2">
                                                <label className="block text-sm font-medium text-white/70 mb-2">Detailed Description</label>
                                                <textarea
                                                    value={desc} onChange={(e) => setDesc(e.target.value)} rows={4}
                                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                                                    placeholder="Describe the source in detail, its usefulness and why it should be approved..."
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 mt-8">
                                            <button
                                                onClick={submitProposal} disabled={isSubmitting}
                                                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg disabled:opacity-50 font-semibold flex items-center justify-center space-x-2"
                                            >
                                                {isSubmitting ? (
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                ) : (
                                                    <><ArrowRight className="w-4 h-4" /><span>Submit Proposal</span></>
                                                )}
                                            </button>
                                            <button onClick={() => setShowForm(false)}
                                                className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200 border border-white/20"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {message && (
                                <div className="mb-8">
                                    <div className="bg-gradient-to-r from-[#FF4D00]/20 to-[#FF007A]/20 border border-orange-500/30 rounded-xl p-4 text-center backdrop-blur-xl">
                                        <p className="text-orange-300 font-medium">{message}</p>
                                    </div>
                                </div>
                            )}

                            <div className="mb-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-3xl font-bold text-white">Proposals ({filteredProposals.length})</h2>
                                    <div className="text-sm text-white/60">{filteredProposals.length} of {proposals.length} proposals</div>
                                </div>

                                {isLoadingProposals ? (
                                    <div className="text-center py-16">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto"></div>
                                        <p className="mt-4 text-white/60">Loading proposals...</p>
                                    </div>
                                ) : filteredProposals.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-20 h-20 bg-gradient-to-r from-[#FF4D00]/20 to-[#FF007A]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Globe className="w-10 h-10 text-white/40" />
                                        </div>
                                        <p className="text-white/60 text-xl mb-2">
                                            {searchTerm || statusFilter !== "all" ? "No proposals found" : "No proposals yet"}
                                        </p>
                                        <p className="text-white/40 text-sm">
                                            {searchTerm || statusFilter !== "all" ? "Try adjusting the filters" : "Be the first to propose a source!"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {filteredProposals.map((proposal) => {
                                            const status = formatStatus(proposal.status);
                                            const votesFor = proposal.votes_for;
                                            const votesAgainst = proposal.votes_against;
                                            const StatusIcon = status.icon;
                                            const totalVotes = votesFor + votesAgainst;
                                            const approvalRate = totalVotes > 0 ? (votesFor / totalVotes) * 100 : 0;
                                            
                                            const hasVoted = principal && proposal.voters.includes(principal.toText());

                                            return (
                                                <div
                                                    key={String(proposal.id)}
                                                    className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:bg-white/10"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2 mb-3">
                                                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                                                                    <StatusIcon className="w-3 h-3 inline mr-1" />
                                                                    {status.text}
                                                                </span>
                                                                <span className="text-white/40 text-xs">#{String(proposal.id)}</span>
                                                            </div>
                                                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-300 transition-colors">
                                                                {proposal.name}
                                                            </h3>
                                                            <div className="flex items-center space-x-2 text-sm text-white/50 mb-3 truncate">
                                                                <User className="w-4 h-4" />
                                                                <span className="truncate" title={proposal.proposer}>{proposal.proposer}</span>
                                                                <span>•</span>
                                                                <Calendar className="w-4 h-4" /><span>{formatDate(proposal.created_at)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-white/70 mb-6 line-clamp-3 leading-relaxed">{proposal.description}</p>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center space-x-4">
                                                            <a href={proposal.url} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-400 hover:text-blue-300 transition-colors">
                                                                <ExternalLink className="w-4 h-4 mr-1" /><span className="text-sm">Source</span>
                                                            </a>
                                                            <a href={proposal.pr_link} target="_blank" rel="noopener noreferrer" className="flex items-center text-orange-400 hover:text-orange-300 transition-colors">
                                                                <GitPullRequest className="w-4 h-4 mr-1" /><span className="text-sm">PR</span>
                                                            </a>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-sm text-white/60 mb-1">{approvalRate.toFixed(0)}% approval</div>
                                                            <div className="text-xs text-white/40">{totalVotes} votes</div>
                                                        </div>
                                                    </div>
                                                    <div className="mb-6">
                                                        <div className="flex justify-between text-sm text-white/50 mb-2">
                                                            <span>Voting Progress</span><span>{votesFor}/{totalVotes}</span>
                                                        </div>
                                                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                                            <div
                                                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-500 ease-out"
                                                                style={{ width: `${Math.max(approvalRate, 5)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <button 
                                                            onClick={() => vote(proposal.id, true)} 
                                                            disabled={!isAuthenticated || !!hasVoted}
                                                            className="px-4 py-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 rounded-xl hover:from-emerald-500/30 hover:to-teal-500/30 transition-all duration-200 border border-emerald-500/30 flex items-center justify-center space-x-2 group disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition-transform" /><span className="font-medium">Approve</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => vote(proposal.id, false)} 
                                                            disabled={!isAuthenticated || !!hasVoted}
                                                            className="px-4 py-3 bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 rounded-xl hover:from-red-500/30 hover:to-red-600/30 transition-all duration-200 border border-red-500/30 flex items-center justify-center space-x-2 group disabled:opacity-40 disabled:cursor-not-allowed"
                                                        >
                                                            <ThumbsDown className="w-4 h-4 group-hover:scale-110 transition-transform" /><span className="font-medium">Reject</span>
                                                        </button>
                                                    </div>
                                                    {hasVoted && <p className="text-center text-xs text-white/50 mt-3">You have already voted on this proposal.</p>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
