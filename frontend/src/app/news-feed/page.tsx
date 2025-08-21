"use client";
import React from "react";
import { Tag, TagCarousel } from "@/components/ui/TagCarousel";
import { MiniNewsCard } from "@/components/ui/MiniNewsCard";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { Newspaper, RefreshCw } from "lucide-react";
import BigNewsCard, { BigArticle } from "@/components/ui/BigNewsCard";
import { createSearchNewsActor } from "../utils/canister";
import { useAuth } from "../auth/useAuth";

const NEWS: Array<{
  id: number;
  title: string;
  description: string;
  tag: Tag;
  author: string;
  likes: number;
  content?: string;
  url?: string;
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
  },
];

export default function NewsFeedPage() {
  const { authClient } = useAuth();
  const [selectedTag, setSelectedTag] = React.useState<Tag>("Highlights");
  const [likedIds, setLikedIds] = React.useState<number[]>([]);
  const [selected, setSelected] = React.useState<BigArticle | null>(null);
  const [supportingId, setSupportingId] = React.useState<number | null>(null);
  const [newsData, setNewsData] = React.useState<typeof NEWS>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const handleOpen = (a: BigArticle) => setSelected(a);
  const handleClose = () => setSelected(null);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("likedIds");
      if (saved) setLikedIds(JSON.parse(saved));
    } catch (error) {
      console.error("Error loading liked IDs:", error);
    }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem("likedIds", JSON.stringify(likedIds));
    } catch (error) {
      console.error("Error saving liked IDs:", error);
    }
  }, [likedIds]);

  React.useEffect(() => {
    async function fetchNews() {
      setIsLoading(true);
      if (process.env.NEXT_PUBLIC_USE_MOCK === "1") {
        setNewsData(NEWS);
        setIsLoading(false);
        return;
      }
      try {
        if (!authClient) {
          setNewsData(NEWS);
          setIsLoading(false);
          return;
        }
        const actors = await createSearchNewsActor(authClient);
        if (!actors || !actors.postNewsActor) {
          console.warn("Actors not available, using mock data");
          setNewsData(NEWS);
          setIsLoading(false);
          return;
        }
        const { postNewsActor } = actors;
        const posts = await postNewsActor.getAllPosts();
        if (!posts || posts.length === 0) {
          console.info("No posts returned from API, using mock data");
          setNewsData(NEWS);
          setIsLoading(false);
          return;
        }
        const formatted = posts.map((post: any, index: number) => ({
          id: Number(post.id) || index + 1,
          title: post.title || "Untitled",
          description: String(post.description || post.content || "No description available").slice(0, 100) + "...",
          tag: "Highlights" as Tag,
          author: post.author?.toText?.() ?? "anonymous",
          likes: Array.isArray(post.likes) ? post.likes.length : Number(post.likes) || 0,
          content: post.content || "Content not available",
          url: post.url || "",
        }));
        setNewsData(formatted);
      } catch (err) {
        console.error("Erro ao buscar posts:", err);
        setNewsData(NEWS);
      } finally {
        setIsLoading(false);
      }
    }
    fetchNews();
  }, [authClient]);

  const filteredNews = React.useMemo(() => {
    if (selectedTag === "Highlights") {
      return newsData;
    }
    return newsData.filter((n) => n.tag === selectedTag);
  }, [selectedTag, newsData]);

  const handleLike = (id: number) => {
    setLikedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  async function handleSupport({ id, amount }: { id: number; amount: number }) {
    try {
      setSupportingId(id);
      await new Promise((r) => setTimeout(r, 800));
    } finally {
      setSupportingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen text-white font-sans">
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
        <div className="flex flex-col flex-1">
          <main className="flex flex-col flex-grow items-center justify-center px-2 py-8">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-[#FF4D00]" />
              <p className="text-lg">Loading News Feed...</p>
            </div>
          </main>
          <Footer />
        </div>

        <style jsx global>{`
          @keyframes grid-pan {
              0% { background-position: 0% 0%; }
              100% { background-position: 100% 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen text-white font-sans">
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
      <div className="flex flex-col flex-1">
        <main className="flex flex-col flex-grow items-center justify-center px-2 py-8">
          <div className="w-full max-w-2xl h-[80vh] bg-white/5 backdrop-blur-xl border-white/10 shadow-xl rounded-xl border flex flex-col min-h-[350px]">
            <div className="p-3 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
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

            <div className="p-3 border-b border-white/10">
              <TagCarousel selectedTag={selectedTag} onTagClick={setSelectedTag} />
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {filteredNews.map((news) => (
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
                      authorPrincipal: news.author,
                      newsId: news.id
                    })
                  }
                />
              ))}
            </div>

            {selected && (
              <BigNewsCard
                article={selected}
                liked={likedIds.includes(selected.id)}
                onLike={handleLike}
                onClose={handleClose}
                onSave={(id) => console.log("save", id)}
                onSupport={handleSupport}
                supportingId={supportingId}
              />
            )}
          </div>
        </main>
        <Footer />
      </div>

      <style jsx global>{`
        @keyframes grid-pan {
            0% { background-position: 0% 0%; }
            100% { background-position: 100% 100%; }
        }
      `}</style>
    </div>
  );
}