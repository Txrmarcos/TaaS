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
const LikeIcon = ({ filled = false }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 1.79 1.11L15 5.88Z"/>
  </svg>
);
const DislikeIcon = ({ filled = false }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a2 2 0 0 1-1.79-1.11L9 18.12Z"/>
  </svg>
);
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
  </svg>
);

// --- Componente de Comentários ---
const CommentsSection = ({ postId, comments, onAddComment }: { postId: number; comments: any[]; onAddComment: (postId: number, text: string) => Promise<void>; }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPrincipal = (principal:any) => {
    const str = principal.toText();
    return `${str.slice(0, 5)}...${str.slice(-3)}`;
  };

  const formatTimestamp = (timestamp:any) => {
    const date = new Date(Number(timestamp) / 1000000); // Conversão de nanosegundos
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSubmitComment = async (e:any) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(postId, newComment);
      setNewComment('');
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 space-y-3">
      {/* Formulário para novo comentário */}
      <form onSubmit={handleSubmitComment} className="flex space-x-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicionar comentário..."
          className="flex-1 bg-white/5 px-3 py-2 rounded-lg text-white placeholder-white/50 text-sm focus:ring-2 focus:ring-[#FF4D00] focus:border-[#FF4D00] transition-all duration-300"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newComment.trim()}
          className="bg-gradient-to-r from-[#FF4D00] to-[#FF007A] p-2 rounded-lg hover:opacity-90 disabled:opacity-50 transition-all duration-300"
        >
          {isSubmitting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <SendIcon />
          )}
        </button>
      </form>

      {/* Lista de comentários */}
      {comments.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {comments.map((comment) => (
            <div key={Number(comment.id)} className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <div className="w-6 h-6 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-full flex items-center justify-center">
                  <UserIcon />
                </div>
                <span className="text-sm font-semibold text-white">
                  {formatPrincipal(comment.author)}
                </span>
                <span className="text-xs text-white/50">
                  {formatTimestamp(comment.timestamp)}
                </span>
              </div>
              <p className="text-white/80 text-sm pl-8">{comment.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Componente do Cartão de Notícia ---
const PostCard = ({ post, currentUser, onLike, onDislike, onAddComment }: { post: any; currentUser: any; onLike: (postId: number) => Promise<void>; onDislike: (postId: number) => Promise<void>; onAddComment: (postId: number, text: string) => Promise<void>; }) => {
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDisliking, setIsDisliking] = useState(false);

  // Função para formatar o Principal de forma mais curta
  const formatPrincipal = (principal:any) => {
    const str = principal.toText();
    return `${str.slice(0, 5)}...${str.slice(-3)}`;
  };

  const formatTimestamp = (timestamp:any) => {
    const date = new Date(Number(timestamp) / 1000000); // Conversão de nanosegundos
    return date.toLocaleString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Verifica se o usuário atual curtiu ou descurtiu o post
  const userLiked = post.likes.some((like:any) => like.toText() === currentUser?.toText());
  const userDisliked = post.dislikes.some((dislike:any) => dislike.toText() === currentUser?.toText());

  const handleLike = async () => {
    setIsLiking(true);
    try {
      await onLike(Number(post.id));
    } catch (error) {
      console.error('Erro ao curtir post:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDislike = async () => {
    setIsDisliking(true);
    try {
      await onDislike(Number(post.id));
    } catch (error) {
      console.error('Erro ao descurtir post:', error);
    } finally {
      setIsDisliking(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex flex-col space-y-4">
      {/* Cabeçalho do Post */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-[#FF4D00] to-[#FF007A] rounded-full flex items-center justify-center text-white">
            <UserIcon />
          </div>
          <div>
            <p className="font-semibold text-white">{formatPrincipal(post.author)}</p>
            <p className="text-xs text-white/60">{post.location}</p>
          </div>
        </div>
        <div className="text-xs text-white/50">
          {formatTimestamp(post.timestamp)}
        </div>
      </div>

      {/* Status de Verificação */}
      {post.taasStatus && (
        <div className="flex items-center space-x-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            post.taasStatus.Verified ? 'bg-green-500/20 text-green-400' :
            post.taasStatus.Rejected ? 'bg-red-500/20 text-red-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            {post.taasStatus.Verified ? 'Verificado' :
             post.taasStatus.Rejected ? 'Rejeitado' :
             'Pendente'}
          </div>
        </div>
      )}

      {/* Conteúdo do Post */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">{post.title}</h2>
        <p className="text-white/80 leading-relaxed">{post.content}</p>
        {post.imageUrl && (
          <img 
            src={post.imageUrl} 
            alt={post.title} 
            className="rounded-xl w-full object-cover mt-2 border border-white/10" 
          />
        )}
      </div>

      {/* Ações do Post */}
      <div className="flex items-center justify-between text-white/60 pt-4 border-t border-white/10">
        <button 
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 hover:text-[#FF007A] transition-colors duration-300"
        >
          <CommentIcon />
          <span className="text-sm font-medium">{post.comments.length}</span>
        </button>
        
        <button className="flex items-center space-x-2 hover:text-green-400 transition-colors duration-300">
          <RepostIcon />
          <span className="text-sm font-medium">0</span>
        </button>
        
        <button 
          onClick={handleLike}
          disabled={isLiking}
          className={`flex items-center space-x-2 transition-colors duration-300 ${
            userLiked ? 'text-blue-400' : 'hover:text-blue-400'
          } ${isLiking ? 'opacity-50' : ''}`}
        >
          <LikeIcon filled={userLiked} />
          <span className="text-sm font-medium">{post.likes.length}</span>
        </button>
        
        <button 
          onClick={handleDislike}
          disabled={isDisliking}
          className={`flex items-center space-x-2 transition-colors duration-300 ${
            userDisliked ? 'text-red-400' : 'hover:text-red-400'
          } ${isDisliking ? 'opacity-50' : ''}`}
        >
          <DislikeIcon filled={userDisliked} />
          <span className="text-sm font-medium">{post.dislikes.length}</span>
        </button>
      </div>

      {/* Seção de Comentários */}
      {showComments && (
        <CommentsSection 
          postId={Number(post.id)}
          comments={post.comments}
          onAddComment={onAddComment}
        />
      )}
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
  
  type Post = {
    id: number;
    author: any;
    title: string;
    content: string;
    imageUrl?: string;
    location?: string;
    timestamp: any;
    taasStatus?: any;
    likes: any[];
    dislikes: any[];
    comments: any[];
  };

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [postsCanister, setPostsCanister] = useState<any>(null);

  // Inicializa o agente e o canister
  const initializeCanister = async () => {
    try {
      const agent = new HttpAgent({ host: "http://127.0.0.1:4943" });
      await agent.fetchRootKey();
      const canisterId = ids.post.ic;
      const canister = Actor.createActor(postsIdl, { agent, canisterId });
      setPostsCanister(canister as any);
      const principal = await agent.getPrincipal();
      setCurrentUser(principal as any);
      return canister;
    } catch (error) {
      console.error("Falha ao inicializar o canister:", error);
      return null;
    }
  };

  // Função para buscar os posts
  const fetchPosts = async (canister = null) => {
    try {
      const activeCanister = canister || postsCanister;
      if (!activeCanister) return;
      
      const fetchedPosts = await activeCanister.getAllPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Falha ao buscar os posts:", error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Função para curtir um post
  const handleLikePost = async (postId:any) => {
    if (!postsCanister) return;
    
    try {
      await postsCanister.likePost(postId);
      await fetchPosts();
    } catch (error) {
      console.error("Erro ao curtir post:", error);
    }
  };

  // Função para descurtir um post
  const handleDislikePost = async (postId:any) => {
    if (!postsCanister) return;
    
    try {
      await postsCanister.dislikePost(postId);
      await fetchPosts();
    } catch (error) {
      console.error("Erro ao descurtir post:", error);
    }
  };

  // Função para adicionar comentário
  const handleAddComment = async (postId:any, commentText:any) => {
    if (!postsCanister) return;
    
    try {
      await postsCanister.addComment(postId, commentText);
      await fetchPosts();
    } catch (error) {
      console.error("Erro ao adicionar comentário:", error);
      throw error;
    }
  };

  // Inicializa o canister quando o componente é montado
  useEffect(() => {
    const init = async () => {
      const canister = await initializeCanister();
      if (canister) {
        await fetchPosts(canister as any);
      }
    };
    init();
  }, []);

  // Lógica de Submissão de um novo post
  const handleSubmit = async (event:any) => {
    event.preventDefault();
    if (!title || !content) {
      setFeedbackMessage('Erro: Título e conteúdo são obrigatórios.');
      return;
    }
    if (!postsCanister) {
      setFeedbackMessage('Erro: Canister não inicializado.');
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage('');

    try {
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
            posts.map((post) => (
              <PostCard 
                key={Number(post.id)} 
                post={post} 
                currentUser={currentUser}
                onLike={handleLikePost}
                onDislike={handleDislikePost}
                onAddComment={handleAddComment}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}