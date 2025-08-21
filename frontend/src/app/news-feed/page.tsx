"use client";
import React from "react";
import { Tag, TAGS, TagCarousel } from "@/components/ui/TagCarousel";
import { MiniNewsCard } from "@/components/ui/MiniNewsCard";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { Newspaper } from "lucide-react";
import BigNewsCard, { BigArticle, Comment } from "@/components/ui/BigNewsCard";
import { createSearchNewsActor } from "../utils/canister";
import { useAuth } from "../auth/useAuth";

// Você pode ajustar as tags se quiser variedade, mas "Highlights" é 100% seguro com o tipo Tag
const NEWS: Array<{
  id: number;
  title: string;
  description: string;
  tag: Tag;
  author: string;
  likes: number;
  content?: string;
  url?: string;
  comments?: Comment[];
}> = [
  {
    id: 1,
    title: "TaaS lança protótipo com governança no ICP",
    description:
      "O time apresentou um protótipo auditável com governança comunitária usando canisters para plano e busca de notícias...",
    tag: "Highlights",
    author: "dfx-principal-aaabbbccc",
    likes: 42,
    content:
      "O protótipo do TaaS integra os canisters `bot-plan` (planos e billing) e `search-news` (veredito e ranking). A governança do conhecimento é feita pelo `round-table`. Na prática, o usuário assina um plano, consome a cota e recebe um veredito auditável. Este artigo detalha as decisões de arquitetura, os fluxos de consumo e como a comunidade pode propor fontes confiáveis.",
    url: "https://example.com/taas-prototipo",
    comments: [],
  },
  {
    id: 2,
    title: "Integração: AuthClient + Actors sem fricção",
    description:
      "Guia para autenticar usuários e criar actors no front sem dores, incluindo fallback e tratamento de erros...",
    tag: "Highlights",
    author: "kaiane.icp",
    likes: 18,
    content:
      "Para criar uma experiência fluida, o AuthClient é inicializado no client-side e injeta a identidade no HttpAgent. Com isso, os actors `users`, `bot-plan` e `search-news` ficam prontos para chamadas autenticadas. O artigo traz padrões de retry, loading states e persistência de preferências no localStorage.",
    url: "https://example.com/authclient-actors",
    comments: [],
  },
  {
    id: 3,
    title: "UI/UX do feed: MiniNewsCard + BigNewsCard",
    description:
      "Como desenhamos um feed leve, com likes persistentes no localStorage e modal de leitura detalhada...",
    tag: "Highlights",
    author: "marco.ui",
    likes: 27,
    content:
      "A composição usa `MiniNewsCard` para listagem rápida e `BigNewsCard` para leitura focada, com suporte a like, salvar e apoiar. O estado de likes persiste no `localStorage`. Discutimos também acessibilidade, foco do teclado, animações discretas e responsividade.",
    url: "https://example.com/ui-feed-design",
    comments: [],
  },
  {
    id: 4,
    title: "Plans & Quotas: design do consumo por requisição",
    description:
      "Estratégias para controlar cota por plano, exibir mensagens claras e evitar surpresas ao usuário...",
    tag: "Highlights",
    author: "billing.bot",
    likes: 33,
    content:
      "O `bot-plan` valida consumo antes do `search-news` processar a consulta. Em caso de estouro, o front exibe call-to-action para upgrade. Este artigo descreve estados, mensagens, e padrões para manter transparência no uso do produto.",
    url: "https://example.com/plans-quotas",
    comments: [],
  },
  {
    id: 5,
    title: "Guia de fontes confiáveis: curadoria comunitária",
    description:
      "Como a comunidade ajuda a manter a base confiável, evitando viés e incentivando diversidade de fontes...",
    tag: "Highlights",
    author: "round.table",
    likes: 21,
    content:
      "A curadoria considera reputação, histórico e diversidade regional/ideológica. O `round-table` governa a lista de fontes e registra mudanças on-chain para auditoria. Mostramos critérios, processo de proposta e revisão.",
    url: "https://example.com/curadoria-fontes",
    comments: [],
  },
];

// Helper function to safely parse backend data
function parseBackendPost(post: any, index: number): typeof NEWS[0] {
  // Safely extract comments
  let comments: Comment[] = [];
  try {
    if (post.comments && Array.isArray(post.comments)) {
      comments = post.comments.map((comment: any, commentIndex: number) => ({
        id: comment.id || commentIndex + 1,
        author: comment.author?.toText?.() ?? comment.author ?? "anonymous",
        text: comment.text || comment.content || "",
        timestamp: comment.timestamp || Date.now(),
      }));
    }
  } catch (err) {
    console.warn("Error parsing comments for post", post.id, err);
    comments = [];
  }

  // Safely extract other fields
  const id = Number(post.id) || index + 1;
  const title = post.title || "Untitled";
  const description = String(post.description || post.content || "No description available").slice(0, 100) + "...";
  const author = post.author?.toText?.() ?? post.author ?? "anonymous";
  const likes = Array.isArray(post.likes) ? post.likes.length : Number(post.likes) || 0;
  const content = post.content || "Content not available";
  const url = post.url || "";

  return {
    id,
    title,
    description,
    tag: "Highlights" as Tag,
    author,
    likes,
    content,
    url,
    comments,
  };
}

export default function NewsFeedPage() {
  const { authClient, isAuthenticated } = useAuth();
  const [selectedTag, setSelectedTag] = React.useState<Tag>("Highlights");
  const [likedIds, setLikedIds] = React.useState<number[]>([]);
  const [selected, setSelected] = React.useState<BigArticle | null>(null);
  const [supportingId, setSupportingId] = React.useState<number | null>(null);
  const [newsData, setNewsData] = React.useState<typeof NEWS>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const handleOpen = (a: BigArticle) => setSelected(a);
  const handleClose = () => setSelected(null);

  const handleLike = async (id: number) => {
    try {
      if (!authClient || !isAuthenticated) {
        console.warn("Precisa estar autenticado para dar like");
        setError("Você precisa estar autenticado para dar like");
        return;
      }

      setError(null);
      
      // Update local state immediately for better UX
      setLikedIds((prev) =>
        prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
      );

      // Update likes count in newsData immediately
      const isLiking = !likedIds.includes(id);
      setNewsData(prevNews => 
        prevNews.map(news => 
          news.id === id 
            ? { ...news, likes: news.likes + (isLiking ? 1 : -1) }
            : news
        )
      );

      // Update selected article if it's open
      setSelected(prevSelected => 
        prevSelected && prevSelected.id === id
          ? { ...prevSelected, likes: (prevSelected.likes || 0) + (isLiking ? 1 : -1) }
          : prevSelected
      );

      // Call the backend
      const { postNewsActor } = await createSearchNewsActor(authClient);
      await postNewsActor.likePost(id);

      // Optionally refetch in background to sync with backend
      setTimeout(() => {
        fetchNewsData().catch(console.error);
      }, 2000);

    } catch (err: any) {
      console.error("Erro ao dar like:", err);
      setError(`Erro ao dar like: ${err?.message || 'Erro desconhecido'}`);
      
      // Revert local state on error
      setLikedIds((prev) =>
        prev.includes(id) ? prev : prev.filter((i) => i !== id)
      );
      
      // Revert likes count on error
      const wasLiking = likedIds.includes(id);
      setNewsData(prevNews => 
        prevNews.map(news => 
          news.id === id 
            ? { ...news, likes: news.likes + (wasLiking ? 1 : -1) }
            : news
        )
      );

      // Revert selected article
      setSelected(prevSelected => 
        prevSelected && prevSelected.id === id
          ? { ...prevSelected, likes: (prevSelected.likes || 0) + (wasLiking ? 1 : -1) }
          : prevSelected
      );
    }
  };

  // Helper function to get current user principal
  const getCurrentUserPrincipal = () => {
    try {
      if (!authClient) return "anonymous";
      const identity = authClient.getIdentity();
      const principal = identity.getPrincipal();
      const principalText = principal.toText();
      // Return first 10 chars + "..." for display
      return principalText.length > 13 ? principalText.slice(0, 10) + "..." : principalText;
    } catch (error) {
      console.error("Error getting user principal:", error);
      return "usuário";
    }
  };

  const handleComment = async (id: number, text: string) => {
    try {
      if (!authClient || !isAuthenticated) {
        console.warn("Precisa estar autenticado para comentar");
        setError("Você precisa estar autenticado para comentar");
        return;
      }

      if (!text.trim()) {
        setError("Comentário não pode estar vazio");
        return;
      }

      setError(null);
      const { postNewsActor } = await createSearchNewsActor(authClient);
      
      // Call the backend
      await postNewsActor.addComment(BigInt(id), text.trim());

      // Update local state immediately for better UX
      const newComment: Comment = {
        id: Date.now(), // temporary ID
        author: getCurrentUserPrincipal(),
        text: text.trim(),
        timestamp: Date.now(),
      };

      // Update newsData with new comment
      setNewsData(prevNews => 
        prevNews.map(news => 
          news.id === id 
            ? { ...news, comments: [...(news.comments || []), newComment] }
            : news
        )
      );

      // Update selected article if it's open
      setSelected(prevSelected => 
        prevSelected && prevSelected.id === id
          ? { ...prevSelected, comments: [...(prevSelected.comments || []), newComment] }
          : prevSelected
      );

      // Optionally refetch in background to sync with backend
      setTimeout(() => {
        fetchNewsData().catch(console.error);
      }, 1000);

    } catch (err: any) {
      console.error("Erro ao comentar:", err);
      setError(`Erro ao comentar: ${err?.message || 'Erro desconhecido'}`);
    }
  };

  // Separate function to fetch news data
  const fetchNewsData = async () => {
    try {
      setError(null);
      
      // Use mock data if specified or if no authClient
      if (process.env.NEXT_PUBLIC_USE_MOCK === "1" || !authClient) {
        setNewsData(NEWS);
        return;
      }

      const actors = await createSearchNewsActor(authClient);
      
      if (!actors?.postNewsActor) {
        console.warn("Actors not available, using mock data");
        setNewsData(NEWS);
        return;
      }

      const { postNewsActor } = actors;
      const posts = await postNewsActor.getAllPosts();

      if (!posts || posts.length === 0) {
        console.info("No posts returned from API, using mock data");
        setNewsData(NEWS);
        return;
      }

      const formatted = posts.map(parseBackendPost);
      setNewsData(formatted);

    } catch (err: any) {
      console.error("Erro ao buscar posts:", err);
      setError(`Erro ao carregar notícias: ${err?.message || 'Erro desconhecido'}`);
      setNewsData(NEWS); // fallback to mock data
    }
  };

  // Effect for loading liked IDs from localStorage
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("likedIds");
      if (saved) setLikedIds(JSON.parse(saved));
    } catch (error) {
      console.error("Error loading liked IDs:", error);
    }
  }, []);

  // Effect for saving liked IDs to localStorage
  React.useEffect(() => {
    try {
      localStorage.setItem("likedIds", JSON.stringify(likedIds));
    } catch (error) {
      console.error("Error saving liked IDs:", error);
    }
  }, [likedIds]);

  // Effect for fetching news data
  React.useEffect(() => {
    async function loadNews() {
      setIsLoading(true);
      await fetchNewsData();
      setIsLoading(false);
    }

    loadNews();
  }, [authClient, isAuthenticated]);

  const filteredNews = React.useMemo(() => {
    if (selectedTag === "Highlights") {
      return newsData;
    }
    return newsData.filter((n) => n.tag === selectedTag);
  }, [selectedTag, newsData]);

  async function handleSupport({ id, amount }: { id: number; amount: number }) {
    try {
      setSupportingId(id);
      setError(null);
      
      // Simulate support action - replace with real implementation
      await new Promise((r) => setTimeout(r, 800));
      
      // Here you would add the actual support logic
      console.log(`Supporting post ${id} with amount ${amount}`);
      
    } catch (err: any) {
      console.error("Erro ao apoiar:", err);
      setError(`Erro ao apoiar: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setSupportingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-[#0B0E13] text-white font-sans">
        <Sidebar />
        <div className="flex flex-col flex-1">
          <main className="flex flex-col flex-grow items-center justify-center px-2 py-8">
            <div className="text-center">
              <div className="loader mb-4"></div>
              <h2 className="text-2xl font-bold text-white">Loading News Feed...</h2>
            </div>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0B0E13] text-white font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <main className="flex flex-col flex-grow items-center justify-center px-2 py-8">
          <div className="w-full max-w-2xl h-[80vh] bg-white/5 border-white/10 shadow-xl rounded-xl border flex flex-col min-h-[350px]">
            {/* Header */}
            <div className="p-3 border-b border-white/10 bg-gradient-to-r from-white/5 to-white/10">
              <div className="flex items-center space-x-3">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF007A] to-[#FF4D00] p-[2px]">
                    <div className="w-full h-full rounded-full bg-[#0B0E13] flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-white">News Feed</h2>
              </div>
            </div>

            {/* Error display */}
            {error && (
              <div className="mx-3 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300 text-xs underline mt-1"
                >
                  Fechar
                </button>
              </div>
            )}

            {/* Auth status */}
            {!isAuthenticated && (
              <div className="mx-3 mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  Você precisa estar autenticado para interagir com as notícias.
                </p>
              </div>
            )}

            {/* Tags */}
            <div className="p-3 border-b border-white/10">
              <TagCarousel selectedTag={selectedTag} onTagClick={setSelectedTag} />
            </div>

            {/* News list */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {filteredNews.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/60">
                  <Newspaper className="w-12 h-12 mb-4 opacity-50" />
                  <p>Nenhuma notícia encontrada</p>
                </div>
              ) : (
                filteredNews.map((news) => (
                  <MiniNewsCard
                    key={news.id}
                    title={news.title}
                    description={news.description}
                    tag={news.tag}
                    author={news.author}
                    likes={news.likes}
                    liked={likedIds.includes(news.id)}
                    onLike={() => handleLike(news.id)}
                    onClick={() =>
                      handleOpen({
                        id: news.id,
                        title: news.title,
                        description: news.description,
                        content: news.content,
                        tag: news.tag,
                        author: news.author,
                        likes: news.likes,
                        url: news.url,
                        comments: news.comments || [],
                      })
                    }
                  />
                ))
              )}
            </div>

            {/* Modal */}
            {selected && (
              <BigNewsCard
                article={selected}
                liked={likedIds.includes(selected.id)}
                onLike={handleLike}
                onClose={handleClose}
                onSave={(id) => console.log("save", id)}
                onSupport={handleSupport}
                supportingId={supportingId}
                onComment={handleComment} 
              />
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}