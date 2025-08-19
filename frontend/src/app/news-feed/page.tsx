"use client";
import React from "react";
import { Tag, TAGS, TagCarousel } from "@/components/ui/TagCarousel";
import { MiniNewsCard } from "@/components/ui/MiniNewsCard";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { Newspaper } from "lucide-react";
import BigNewsCard, { BigArticle } from "@/components/ui/BigNewsCard";
import { AuthClient } from "@dfinity/auth-client";
import { createSearchNewsActor } from "../utils/canister";

const NEWS: Array<{
  id: number;
  title: string;
  description: string;
  tag: Tag;
  author: string;
  likes: number;
  content?: string;
  url?: string;
}> = [];

export default function NewsFeedPage() {
  const [selectedTag, setSelectedTag] = React.useState<Tag>("Highlights");
  const [likedIds, setLikedIds] = React.useState<number[]>([]);
  const [selected, setSelected] = React.useState<BigArticle | null>(null);
  const [supportingId, setSupportingId] = React.useState<number | null>(null);
  const [newsData, setNewsData] = React.useState<typeof NEWS>([]);

  const handleOpen = (a: BigArticle) => setSelected(a);
  const handleClose = () => setSelected(null);

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("likedIds");
      if (saved) setLikedIds(JSON.parse(saved));
    } catch {}
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem("likedIds", JSON.stringify(likedIds));
    } catch {}
  }, [likedIds]);

  React.useEffect(() => {
    async function fetchNews() {
      const authClient = await AuthClient.create();
      const { postNewsActor } = await createSearchNewsActor(authClient);

      try {
        const posts = await postNewsActor.getAllPosts();
        const formatted = posts.map((post: any, idx: number) => ({
          id: Number(post.id),
          title: post.title,
          description: post.description.slice(0, 100) + "...",
          tag: "Highlights", // valor fixo por enquanto
          author: post.author.toText(),
          likes: post.likes.length,
          content: post.content,
          url: "",
        }));
        setNewsData(formatted);
      } catch (err) {
        console.error("Erro ao buscar posts:", err);
        setNewsData(NEWS); // fallback
      }
    }

    fetchNews();
  }, []);

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

            {/* Tags */}
            <div className="p-3 border-b border-white/10">
              <TagCarousel selectedTag={selectedTag} onTagClick={setSelectedTag} />
            </div>

            {/* News list */}
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
                    })
                  }
                />
              ))}
            </div>

            {/* Modal */}
            {selected && (
              <BigNewsCard
                article={selected}
                liked={likedIds.includes(selected.id)}
                onLike={handleLike}
                onClose={() => setSelected(null)}
                onSave={(id) => console.log("save", id)}
                onSupport={handleSupport}
                supportingId={supportingId}
              />
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}