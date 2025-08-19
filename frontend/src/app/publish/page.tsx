"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../auth/useAuth"; // Adjust the path if necessary
import { Sidebar } from "@/components/Sidebar"; // Adjust the path if necessary
import { Footer } from "@/components/Footer"; // Adjust the path if necessary
import { createSearchNewsActor } from "../utils/canister"; // Ajuste o caminho conforme sua estrutura
import {
    FilePlus, Send, History, Image as ImageIcon, Video, FileText, Heading1, Heading2, Trash2, Eye, Loader2, Award, ArrowRight
} from "lucide-react";

// Type for a publication (article)
type Publication = {
    id: number;
    title: string;
    subtitle: string;
    contentSnippet: string;
    publishedAt: Date;
    views: number;
};

// Mock data to simulate past publications
const MOCK_PUBLICATIONS: Publication[] = [
    {
        id: 1,
        title: "The Rise of Generative AI in Investigative Journalism",
        subtitle: "How algorithms are changing the way stories are discovered",
        contentSnippet: "Generative artificial intelligence is becoming an indispensable tool in modern newsrooms. From complex data analysis to...",
        publishedAt: new Date("2025-08-15T10:30:00Z"),
        views: 1250,
    },
    {
        id: 2,
        title: "Web3 and Data Sovereignty: The Future of Privacy",
        subtitle: "Who really controls your information on the new internet?",
        contentSnippet: "With the advancement of decentralized technologies, the promise of full control over one's own data has never been closer. However, the challenges...",
        publishedAt: new Date("2025-08-10T18:00:00Z"),
        views: 3400,
    },
    {
        id: 3,
        title: "Climate Crisis: Field Reports from the Amazon",
        subtitle: "An anonymous look at the impacts of illegal deforestation",
        contentSnippet: "Directly from the front lines, this report exposes the harsh realities faced by local communities and the ecosystem due to exploitation...",
        publishedAt: new Date("2025-07-28T09:15:00Z"),
        views: 890,
    }
];

export default function PublishPage() {
    const { isAuthenticated, authClient, principal } = useAuth();
    const router = useRouter();
    const { usersActor,searchNewsActor } = createSearchNewsActor(authClient);
    
    const [isJournalist, setIsJournalist] = useState(false); 
    const [isLoadingRole, setIsLoadingRole] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkUserRole = async () => {
            if (!isAuthenticated || !authClient || !principal) {
                setIsLoadingRole(false);
                setIsJournalist(false);
                return;
            }

            try {
                console.log("Checking journalist status for:", principal.toText());
                
                // Verifica se está autenticado
                const isAuth = await authClient.isAuthenticated();
                if (!isAuth) {
                    console.log("User not authenticated");
                    setIsJournalist(false);
                    setIsLoadingRole(false);
                    return;
                }

                // Cria a conexão com o canister

                const isJournalist = await usersActor.isJournalist(principal);
                console.log("Journalist status:", isJournalist);
                
                setIsJournalist(isJournalist);
                setError(null);
                
            } catch (err: any) {
                console.error("Error checking journalist status:", err);
                setIsJournalist(false);
            } finally {
                setIsLoadingRole(false);
            }
        };

        if (isAuthenticated) {
            checkUserRole();
        } else {
            setIsLoadingRole(false);
            setIsJournalist(false);
        }
    }, [isAuthenticated, authClient, principal, router]);

    const [title, setTitle] = useState("");
    const [subtitle, setSubtitle] = useState("");
    const [content, setContent] = useState("");
    const [attachment, setAttachment] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLoadingPublications, setIsLoadingPublications] = useState(true);
    const [publications, setPublications] = useState<Publication[]>([]);

    const fetchPastPublications = async () => {
        setIsLoadingPublications(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setPublications(MOCK_PUBLICATIONS);
        setIsLoadingPublications(false);
    };

    useEffect(() => {
        if (isJournalist) {
           fetchPastPublications();
        } else {
            setIsLoadingPublications(false);
        }
    }, [isJournalist]);

    const handlePublish = async () => {
        if (!isJournalist) return;
        if (!title.trim() || !content.trim()) {
            setMessage({ type: 'error', text: "Title and content are required." });
            return;
        }

        setIsPublishing(true);
        setMessage(null);
        
        try {

            // const post = await  postNewsActor.createPost(title, subtitle, content, attachment);
            // await searchNewsActor.searchNews(prompt)
            // logica do taas
            //  post.id
            //chamar canister id do taas, passar o content dps disso chamar o canister
            // postNewsActor.updateTaaSStatus(post.id, ); (Rejected; Verified; Pending)
            await new Promise(resolve => setTimeout(resolve, 2000));
            setMessage({ type: 'success', text: "Your article was successfully published on the network!" });
            setTitle("");
            setSubtitle("");
            setContent("");
            setAttachment(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }

            const newPublication: Publication = {
                id: Date.now(),
                title,
                subtitle,
                contentSnippet: content.substring(0, 150) + "...",
                publishedAt: new Date(),
                views: 0
            };
            setPublications([newPublication, ...publications]);
            
        } catch (err: any) {
            console.error("Error publishing article:", err);
            setMessage({ type: 'error', text: `Error publishing article: ${err.message || "Unknown error"}` });
        } finally {
            setIsPublishing(false);
        }
    };

    // Função para tentar registrar como jornalista
    const handleRegisterAsJournalist = async () => {
        if (!isAuthenticated || !authClient || !principal) {
            setError("You need to be authenticated to register as journalist.");
            return;
        }

        try {
            setIsLoadingRole(true);
            await usersActor.registerAsJournalist();
            setIsJournalist(true);
        } catch (err: any) {
            console.error("Error registering as journalist:", err);
            setError(`Error registering as journalist: ${err.message || "Unknown error"}`);
        } finally {
            setIsLoadingRole(false);
        }
    };

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" });
    };

    if (isLoadingRole) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                 {/* --- CÓDIGO DO FUNDO ADICIONADO AQUI --- */}
                <div className="fixed top-0 left-0 w-full h-full bg-[#0B0E13] -z-10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,77,0,0.1)_0,_transparent_50%)]"></div>
                    <div 
                        className="absolute w-full h-full top-0 left-0 bg-transparent"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                            backgroundSize: '2rem 2rem',
                            animation: 'grid-pan 60s linear infinite',
                        }}
                    ></div>
                </div>
                <div className="text-center">
                    <Loader2 className="animate-spin h-12 w-12 text-orange-400 mx-auto mb-4"/>
                    <p className="text-white/60">Checking your journalist status...</p>
                </div>
            </div>
        );
    }

    return (
        // A classe bg-[#0B0E13] foi removida daqui
        <div className="min-h-screen text-white">
            {/* --- CÓDIGO DO FUNDO ADICIONADO AQUI --- */}
            <div className="fixed top-0 left-0 w-full h-full bg-[#0B0E13] -z-10 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_rgba(255,77,0,0.1)_0,_transparent_50%)]"></div>
                <div 
                    className="absolute w-full h-full top-0 left-0 bg-transparent"
                    style={{
                        backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
                        backgroundSize: '2rem 2rem',
                        animation: 'grid-pan 60s linear infinite',
                    }}
                ></div>
            </div>

            <Sidebar />
            <main className="w-full pt-24 pb-20 md:pl-20 lg:pl-64">
                {/* Mensagem de erro global */}
                {error && (
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6">
                        <div className="rounded-xl p-4 text-center backdrop-blur-xl border bg-red-500/20 border-red-500/30 text-red-300">
                            <p className="font-medium">{error}</p>
                        </div>
                    </div>
                )}

                <div className="relative">
                    <div className={`transition-all duration-500 ${!isJournalist ? 'blur-md pointer-events-none' : 'blur-0'}`}>
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            {/* Hero Section */}
                            <div className="text-center mb-12">
                                <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#FF4D00]/80 to-[#FF007A]/80 px-4 py-2 rounded-full mb-6">
                                    <FilePlus className="w-4 h-4 text-white" />
                                    <span className="text-white/80 text-sm font-medium">Freedom of Speech</span>
                                </div>
                                <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center justify-center gap-3">
                                    Journalist Dashboard
                                </h1>
                                <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
                                    Publish your articles anonymously and securely. Your voice, protected by Web3.
                                </p>
                            </div>

                            {/* Publication Form */}
                            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 border border-white/10 shadow-2xl mb-12">
                                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-8 text-center">Create New Article</h2>
                                <div className="space-y-6">
                                    <div>
                                        <label className="flex items-center text-sm font-medium text-white/70 mb-2"><Heading1 className="w-4 h-4 mr-2" /> Main Title</label>
                                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="The impactful title of your article"/>
                                    </div>
                                    <div>
                                        <label className="flex items-center text-sm font-medium text-white/70 mb-2"><Heading2 className="w-4 h-4 mr-2" /> Subtitle (Optional)</label>
                                        <input type="text" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500" placeholder="A complement to the title"/>
                                    </div>
                                    <div>
                                        <label className="flex items-center text-sm font-medium text-white/70 mb-2"><FileText className="w-4 h-4 mr-2" /> Article Content</label>
                                        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={12} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" placeholder="Write your story here... The content supports Markdown for formatting."></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-white/70 mb-2">Attach Media (Image/Video)</label>
                                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-white/20 border-dashed rounded-xl cursor-pointer hover:border-orange-500 transition-colors" onClick={() => fileInputRef.current?.click()}>
                                            <div className="space-y-1 text-center">
                                                <div className="flex text-sm text-white/60">
                                                    {attachment ? (<p className="font-semibold text-orange-400">{attachment.name}</p>) : (<div className="flex flex-col items-center"><div className="flex gap-4 mb-2"><ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 text-white/30" /><Video className="w-10 h-10 sm:w-12 sm:h-12 text-white/30" /></div><p className="text-sm">Drag and drop or <span className="font-semibold text-orange-400">click to browse</span></p><p className="text-xs text-white/40">PNG, JPG, GIF, MP4 up to 10MB</p></div>)}
                                                </div>
                                                <input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setAttachment(e.target.files?.[0] || null)} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8">
                                    <button onClick={handlePublish} disabled={isPublishing || !isAuthenticated} className="w-full px-6 py-4 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2">
                                        {isPublishing ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
                                        <span>{isPublishing ? "Publishing to the Network..." : "Publish Article"}</span>
                                    </button>
                                    {!isAuthenticated && <p className="text-center text-red-400 text-xs mt-2">You must be logged in to publish.</p>}
                                </div>
                            </div>

                            {message && (<div className="mb-8"><div className={`rounded-xl p-4 text-center backdrop-blur-xl border ${message.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' : 'bg-red-500/20 border-red-500/30 text-red-300'}`}><p className="font-medium">{message.text}</p></div></div>)}

                            <div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3"><History className="w-7 h-7 sm:w-8 sm:h-8"/> Your Publications</h2>
                                    <div className="text-sm text-white/60 whitespace-nowrap">{publications.length} articles found</div>
                                </div>
                                {isLoadingPublications ? (<div className="text-center py-16"><Loader2 className="animate-spin rounded-full h-12 w-12 text-orange-400 mx-auto"/><p className="mt-4 text-white/60">Loading your publications...</p></div>) : publications.length === 0 ? (<div className="text-center py-16 bg-white/5 rounded-2xl border border-white/10"><FileText className="w-16 h-16 text-white/30 mx-auto mb-4" /><p className="text-white/60 text-xl mb-2">No articles published yet</p><p className="text-white/40 text-sm">Use the form above to share your first story.</p></div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{publications.map((pub) => (<div key={pub.id} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 group hover:border-orange-500/50 flex flex-col justify-between"><div><div className="flex justify-between items-start mb-3 gap-3"><h3 className="text-lg font-bold text-white group-hover:text-orange-300 transition-colors">{pub.title}</h3><span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full border border-white/10 whitespace-nowrap">{formatDate(pub.publishedAt)}</span></div><p className="text-sm text-white/80 font-light mb-4">{pub.subtitle}</p><p className="text-sm text-white/60 line-clamp-3 leading-relaxed">{pub.contentSnippet}</p></div><div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between"><div className="flex items-center space-x-2 text-sm text-white/50"><Eye className="w-4 h-4"/><span>{pub.views.toLocaleString('en-US')} views</span></div><button className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full hover:bg-red-500/20"><Trash2 className="w-4 h-4"/></button></div></div>))}</div>)}
                            </div>
                        </div>
                    </div>

                    {!isJournalist && !isLoadingRole && (
                        <div className="absolute inset-0 z-40 flex items-start justify-center p-4 pt-60">
                            <div className="w-full max-w-lg text-center bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-orange-500/30 shadow-2xl">
                                <div className="w-16 h-16 bg-gradient-to-r from-[#FF4D00]/20 to-[#FF007A]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Award className="w-8 h-8 text-orange-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Unlock Journalist Features</h2>
                                <p className="text-white/70 mb-8 leading-relaxed">
                                    You need to be registered as a journalist to publish articles on our decentralized platform.
                                </p>
                                <div className="space-y-4">
                                    <button
                                        onClick={handleRegisterAsJournalist}
                                        disabled={isLoadingRole}
                                        className="w-full max-w-xs mx-auto px-6 py-3 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white rounded-xl hover:opacity-90 transition-all duration-200 shadow-lg font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoadingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />}
                                        <span>{isLoadingRole ? "Registering..." : "Register as Journalist"}</span>
                                    </button>
                                    <button
                                        onClick={() => router.push('/profile-area')}
                                        className="w-full max-w-xs mx-auto px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all duration-200 shadow-lg font-semibold flex items-center justify-center space-x-2 border border-white/20"
                                    >
                                        <span>Go to Profile</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />

            {/* --- CÓDIGO DO CSS ADICIONADO AQUI --- */}
            <style jsx global>{`
                @keyframes grid-pan {
                    0% { background-position: 0% 0%; }
                    100% { background-position: 100% 100%; }
                }
            `}</style>
        </div>
    );
}