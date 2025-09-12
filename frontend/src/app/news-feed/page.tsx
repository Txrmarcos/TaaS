"use client";
import React from "react";
import { Tag, TagCarousel } from "@/components/ui/TagCarousel";
import { MiniNewsCard } from "@/components/ui/MiniNewsCard";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { Newspaper, RefreshCw } from "lucide-react";
import BigNewsCard, { BigArticle, Comment } from "@/components/ui/BigNewsCard";
import { TaaSVerdictEmbed, TaaSVerification, Verdict } from "@/components/ui/TaaSVerdictEmbed";
import { createSearchNewsActor } from "../utils/canister";
import { useAuth } from "@/context/AuthContext";

// Updated NEWS interface to include TaaS fields
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
  taasStatus: TaaSVerification;
  verdict?: Verdict | null;
  subtitle?: string;
}> = [
  {
    "id": 1,
    "title": "TaaS launches prototype with governance on ICP",
    "description":
      "The team presented an auditable prototype with community governance using canisters for planning and news search...",
    "tag": "Technology",
    "author": "dfx-principal-aaabbbccc",
    "likes": 42,
    "content":
      "The TaaS prototype integrates the `bot-plan` canister (plans and billing) and the `search-news` canister (verdict and ranking). Knowledge governance is handled by the `round-table`. In practice, the user subscribes to a plan, consumes the quota, and receives an auditable verdict. This article details the architecture decisions, consumption flows, and how the community can propose reliable sources.",
    "url": "https://example.com/taas-prototipo",
    "comments": [],
    "taasStatus": "True",
    "verdict": {
      "result": "True",
      "source": "ICP Documentation, GitHub",
      "hash": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
      "timestamp": Date.now() * 1000000,
      "llm_message": "✅ Verified information. TaaS is a real project developed on the Internet Computer Protocol with decentralized governance."
    }
  },
  {
    "id": 2,
    "title": "Integration: AuthClient + Actors without friction",
    "description":
      "Guide to authenticate users and create actors on the front end seamlessly, including fallback and error handling...",
    "tag": "Technology",
    "author": "kaiane.icp",
    "likes": 18,
    "content":
      "To create a smooth experience, the AuthClient is initialized on the client side and injects the identity into the HttpAgent. With this, the `users`, `bot-plan`, and `search-news` actors are ready for authenticated calls. The article covers retry patterns, loading states, and preference persistence in localStorage.",
    "url": "https://example.com/authclient-actors",
    "comments": [],
    "taasStatus": "True",
    "verdict": {
      "result": "True",
      "source": "ICP SDK Documentation",
      "hash": "x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4",
      "timestamp": Date.now() * 1000000,
      "llm_message": "✅ Technical information verified. The AuthClient + HttpAgent pattern is officially documented in the ICP SDK."
    }
  },
  {
    "id": 3,
    "title": "Feed UI/UX: MiniNewsCard + BigNewsCard",
    "description":
      "How we designed a lightweight feed, with likes persisted in localStorage and detailed reading modal...",
    "tag": "Technology",
    "author": "marco.ui",
    "likes": 27,
    "content":
      "The composition uses `MiniNewsCard` for quick listing and `BigNewsCard` for focused reading, with support for like, save, and support. Like state persists in `localStorage`. We also discuss accessibility, keyboard focus, subtle animations, and responsiveness.",
    "url": "https://example.com/ui-feed-design",
    "comments": [],
    "taasStatus": "Uncertain",
    "verdict": {
      "result": "Uncertain",
      "source": "UI/UX Best Practices",
      "hash": "m5n6o7p8q9r0s1t2u3v4w5x6y7z8a9b0",
      "timestamp": Date.now() * 1000000,
      "llm_message": "⚠️ Design-related information. UI/UX practices are subjective, but the mentioned patterns are widely accepted."
    }
  },
  {
    "id": 5,
    "title": "Plans & Quotas: per-request consumption design",
    "description":
      "Strategies to control quota per plan, display clear messages, and avoid user surprises...",
    "tag": "Technology",
    "author": "billing.bot",
    "likes": 33,
    "content":
      "The `bot-plan` validates consumption before `search-news` processes the query. In case of overuse, the front end displays a call-to-action for upgrade. This article describes states, messages, and patterns to maintain transparency in product usage.",
    "url": "https://example.com/plans-quotas",
    "comments": [],
    "taasStatus": "Pending",
    "verdict": null
  }
]

// Helper function to safely parse backend data
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

  // Safely extract TaaS fields
  let taasStatus: TaaSVerification = "Pending";
  let verdict: Verdict | null = null;

  try {
    // Parse taasStatus from backend variant
    if (post.taasStatus) {
      const statusKeys = Object.keys(post.taasStatus);
      if (statusKeys.length > 0) {
        taasStatus = statusKeys[0] as TaaSVerification;
      }
    }

    // Parse verdict from backend
    if (post.verdict && post.verdict.length > 0 && post.verdict[0]) {
      const backendVerdict = post.verdict[0];
      
      // Parse result variant
      let result: TaaSVerification = "Pending";
      if (backendVerdict.result) {
        const resultKeys = Object.keys(backendVerdict.result);
        if (resultKeys.length > 0) {
          result = resultKeys[0] as TaaSVerification;
        }
      }

      verdict = {
        result: result,
        source: backendVerdict.source || "",
        hash: backendVerdict.hash || "",
        timestamp: backendVerdict.timestamp || Date.now() * 1000000,
        llm_message: backendVerdict.llm_message || ""
      };
    }
  } catch (err) {
    console.warn("Error parsing TaaS data for post", post.id, err);
    taasStatus = "Error";
    verdict = {
      result: "Error",
      source: "",
      hash: "",
      timestamp: Date.now() * 1000000,
      llm_message: "Erro ao processar dados de verificação"
    };
  }

  // Safely extract other fields
  const id = Number(post.id) || index + 1;
  const title = post.title || "Untitled";
  
  // FIX: Use subtitle for description, fallback to content if subtitle is empty
  const subtitle = post.subtitle || "";
  const content = post.content || "";
  
  // Use subtitle as description, if subtitle is empty, use first 100 chars of content
  const description = subtitle.trim() 
    ? subtitle 
    : (content ? String(content).slice(0, 100) + "..." : "No description available");
  
  const author = post.author?.toText?.() ?? post.author ?? "anonymous";
  const likes = Array.isArray(post.likes) ? post.likes.length : Number(post.likes) || 0;
  const url = post.url || "";
  

  // Motoko variant: {World: null} => "World"
  let tag: Tag = "Other";
  if (typeof post.tag === "string") {
    tag = post.tag as Tag;
  } else if (typeof post.tag === "object" && post.tag !== null) {
    const keys = Object.keys(post.tag);
    if (keys.length > 0) tag = keys[0] as Tag;
  }

  return {
    id,
    title,
    description,
    tag,
    author,
    likes,
    content,
    url,
    comments,
    taasStatus,
    verdict,
    subtitle, // Add subtitle field to the returned object
  };
}

export default function NewsFeedPage() {
  const { authClient, isAuthenticated } = useAuth();
  // selectedTag pode ser null para mostrar todas
  const [selectedTag, setSelectedTag] = React.useState<Tag | null>(null);
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
        console.warn("You must be logged in to like.");
        setError("You must be logged in to like.");
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
      const { postsActor } = await createSearchNewsActor(authClient);
      await postsActor.likePost(id);

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
        console.warn("You must be logged in to comment.");
        setError("You must be logged in to comment.");
        return;
      }

      if (!text.trim()) {
        setError("Comentário não pode estar vazio");
        return;
      }

      setError(null);
      const { postsActor } = await createSearchNewsActor(authClient);
      
      // Call the backend
      await postsActor.addComment(BigInt(id), text.trim());

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
      console.error("Error when commenting:", err);
      setError(`Error when commenting: ${err?.message || 'Unknown error'}`);
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
      
      if (!actors?.postsActor) {
        console.warn("Actors not available, using mock data");
        setNewsData(NEWS);
        return;
      }

      const { postsActor } = actors;
      const posts = await postsActor.getAllPosts();

      if (!posts || posts.length === 0) {
        console.info("No posts returned from API, using mock data");
        setNewsData(NEWS);
        return;
      }

      const formatted = posts.map(parseBackendPost);
      setNewsData(formatted);

    } catch (err: any) {
      console.error("Error when fetching posts:", err);
      setError(`Error when loading news: ${err?.message || 'Unknown error'}`);
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

  React.useEffect(() => {
    try {
      localStorage.setItem("likedIds", JSON.stringify(likedIds));
    } catch (error) {
      console.error("Error saving liked IDs:", error);
    }
  }, [likedIds]);

  React.useEffect(() => {
    async function loadNews() {
      setIsLoading(true);
      await fetchNewsData();
      setIsLoading(false);
    }

    loadNews();
  }, [authClient, isAuthenticated]);

  const filteredNews = React.useMemo(() => {
    if (!selectedTag) {
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
      console.error("Error when supporting:", err);
      setError(`Error when supporting: ${err?.message || 'Unknown error'}`);
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

            {/* Error display */}
            {error && (
              <div className="mx-3 mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
                <button 
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-300 text-xs underline mt-1"
                >
                  Close
                </button>
              </div>
            )}

            {/* Auth status */}
            {!isAuthenticated && (
              <div className="mx-3 mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  You must be logged in to interact with the news.
                </p>
              </div>
            )}

            {/* Tags */}
            <div className="p-3 border-b border-white/10">
              <TagCarousel
                selectedTag={selectedTag}
                onTagClick={(tag) => setSelectedTag(tag)}
                showAllOption
                onAllClick={() => setSelectedTag(null)}
              />
            </div>

            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {filteredNews.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/60">
                  <Newspaper className="w-12 h-12 mb-4 opacity-50" />
                  <p>No news found</p>
                </div>
              ) : (
                filteredNews.map((news) => (
                  <div key={news.id} className="space-y-2">
                    <MiniNewsCard
                      title={news.title}
                      description={news.subtitle!!}
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
                          taasStatus: news.taasStatus,
                          verdict: news.verdict,
                        })
                      }
                    />
                  </div>
                ))
              )}
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
                onComment={handleComment} 
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