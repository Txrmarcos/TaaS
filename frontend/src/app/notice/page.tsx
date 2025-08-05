"use client"
// pages/index.js (ou a sua página principal)
// Página refatorada para incluir um feed de notícias e um formulário de publicação compacto.

import { useState, useEffect } from 'react';
// Importações necessárias do DFINITY agent e dos ficheiros de declaração
import { Actor, HttpAgent } from '@dfinity/agent';
import { idlFactory as postsIdl } from "../../../../src/declarations/posts/posts.did.js";
import ids from "../../../../canister_ids.json";

// --- Ícones para a UI ---
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const CommentIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const RepostIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>;
const LikeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 1.79 1.11L15 5.88Z"/></svg>;
const DislikeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a2 2 0 0 1-1.79-1.11L9 18.12Z"/></svg>;


// --- Componente do Cartão de Notícia ---
const PostCard = ({ post }: { post: any }) => {
    // Função para formatar o Principal de forma mais curta
    const formatPrincipal = (principal: any) => {
        const str = principal.toText();
        return `${str.slice(0, 5)}...${str.slice(-3)}`;
    };

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col space-y-4">
            {/* Cabeçalho do Post */}
            <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-full flex items-center justify-center text-white">
                    <UserIcon />
                </div>
                <div>
                    <p className="font-semibold text-white">{formatPrincipal(post.author)}</p>
                    <p className="text-xs text-white/60">{post.location}</p>
                </div>
            </div>

            {/* Conteúdo do Post */}
            <div className="space-y-3">
                <h2 className="text-xl font-bold text-white">{post.title}</h2>
                <p className="text-white/80 leading-relaxed">{post.content}</p>
                {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="rounded-xl w-full object-cover mt-2 border border-white/10" />}
            </div>

            {/* Ações do Post */}
            <div className="flex items-center justify-between text-white/60 pt-4 border-t border-white/10">
                <button className="flex items-center space-x-2 hover:text-[#FF007A] transition-colors duration-300">
                    <CommentIcon />
                    <span className="text-sm font-medium">{post.comments.length}</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-green-400 transition-colors duration-300">
                    <RepostIcon />
                    <span className="text-sm font-medium">0</span>
                </button>
                <button className="flex items-center space-x-2 hover:text-blue-400 transition-colors duration-300">
                    <LikeIcon />
                    <span className="text-sm font-medium">{post.likes.length}</span>
                </button>
                 <button className="flex items-center space-x-2 hover:text-red-400 transition-colors duration-300">
                    <DislikeIcon />
                    <span className="text-sm font-medium">{post.dislikes.length}</span>
                </button>
            </div>
        </div>
    );
};


// --- Componente Principal da Página ---
export default function NewsFeedPage() {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [location, setLocation] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    
    const [posts, setPosts] = useState([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);

    // Função para buscar os posts
    const fetchPosts = async () => {
        try {
            const agent = new HttpAgent({ host: "http://127.0.0.1:4943" });
            await agent.fetchRootKey();
            const canisterId = ids.post.ic;
            const postsCanister = Actor.createActor(postsIdl, { agent, canisterId });
            
            const fetchedPosts:any = await postsCanister.getAllPosts();
            setPosts(fetchedPosts);
        } catch (error) {
            console.error("Falha ao buscar os posts:", error);
        } finally {
            setIsLoadingPosts(false);
        }
    };

    // Busca os posts quando o componente é montado
    useEffect(() => {
        fetchPosts();
    }, []);

    // Lógica de Submissão de um novo post
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!title || !content) {
            setFeedbackMessage('Erro: Título e conteúdo são obrigatórios.');
            return;
        }
        setIsSubmitting(true);
        setFeedbackMessage('');

        try {
            const agent = new HttpAgent({ host: "http://127.0.0.1:4943" });
            await agent.fetchRootKey();
            const canisterId = ids.post.ic;
            const postsCanister = Actor.createActor(postsIdl, { agent, canisterId });

            await postsCanister.createPost(title, content, imageUrl, location);
            
            setFeedbackMessage('Notícia publicada com sucesso!');
            setTitle('');
            setContent('');
            setImageUrl('');
            setLocation('');
            
            // Atualiza o feed após a publicação
            await fetchPosts();

        } catch (error) {
            console.error("Falha ao criar o post:", error);
            setFeedbackMessage('Erro: Não foi possível publicar a notícia.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0E13] text-white font-sans">
            <main className="max-w-2xl mx-auto p-4">
                {/* Cabeçalho */}
                <header className="py-6 text-center">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#FF4D00] to-[#FF007A]">
                        Feed de Notícias
                    </h1>
                    <p className="text-white/70 mt-1">Onde a comunidade partilha a verdade.</p>
                </header>

                {/* Formulário de Publicação */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/10">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-white/5 p-3 border border-transparent rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-[#FF4D00] focus:border-[#FF4D00] transition-all duration-300"
                            placeholder="Título da Notícia"
                        />
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full bg-white/5 p-3 border border-transparent rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-[#FF4D00] focus:border-[#FF4D00] transition-all duration-300 resize-none"
                            placeholder="O que está a acontecer?"
                            rows={3}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <input
                                type="text"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                className="w-full bg-white/5 p-3 border border-transparent rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-[#FF4D00] focus:border-[#FF4D00] transition-all duration-300"
                                placeholder="URL da Imagem (opcional)"
                            />
                             <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full bg-white/5 p-3 border border-transparent rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-[#FF4D00] focus:border-[#FF4D00] transition-all duration-300"
                                placeholder="Localização (opcional)"
                            />
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-gradient-to-r from-[#FF4D00] to-[#FF007A] text-white font-bold py-2 px-6 rounded-full hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0E13] focus:ring-[#FF4D00] disabled:opacity-50 transition-all duration-300 ease-in-out flex items-center"
                            >
                                {isSubmitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>}
                                Publicar
                            </button>
                        </div>
                         {feedbackMessage && <p className={`text-center text-sm ${feedbackMessage.includes('Erro') ? 'text-red-400' : 'text-green-400'}`}>{feedbackMessage}</p>}
                    </form>
                </div>

                {/* Feed de Notícias */}
                <div className="space-y-6">
                    {isLoadingPosts ? (
                        <p className="text-center text-white/70">A carregar notícias...</p>
                    ) : (
                        posts.map((post:any) => <PostCard key={Number(post.id)} post={post} />)
                    )}
                </div>
            </main>
        </div>
    );
}
