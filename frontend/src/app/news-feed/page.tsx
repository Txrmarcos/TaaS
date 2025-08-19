"use client";
import React from "react";
import { Tag, TAGS, TagCarousel } from "@/components/TagCarousel";
import { MiniNewsCard } from "@/components/MiniNewsCard";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { Newspaper } from "lucide-react"; 

const NEWS: Array<{
  id: number;
  title: string;
  description: string;
  tag: Tag;
}> = [
  {
    id: 1,
    title: "AI stack speeds up real-time analytics",
    description: "Companies adopt streaming + LLM architectures with predictable costs.",
    tag: "Technology",
  },
  {
    id: 2,
    title: "Interest rates and corporate credit",
    description: "How higher rates affect mid-size companies' capex decisions.",
    tag: "Business/Economy",
  },
  {
    id: 3,
    title: "Elections and administrative reform",
    description: "Analysts comment on scenarios and timelines.",
    tag: "Politics/Opinion",
  },
  {
    id: 4,
    title: "Festival premieres boost streaming",
    description: "New launches and record-breaking audience numbers this week.",
    tag: "Culture/Entertainment",
  },
  {
    id: 5,
    title: "Trade tensions hit chip supply chains",
    description: "Supply remains under pressure in Asia and Europe.",
    tag: "World/International",
  },
  {
    id: 6,
    title: "Climate change and public health",
    description: "Study links heat waves with hospital admissions.",
    tag: "Health/Environment",
  },
  {
    id: 7,
    title: "This week’s highlights",
    description: "The top stories you shouldn’t miss.",
    tag: "Highlights",
  },
];

export default function NewsFeedPage() {
  const [selectedTag, setSelectedTag] = React.useState<Tag>("Highlights");
  const [likedIds, setLikedIds] = React.useState<number[]>([]);

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

  const filteredNews = React.useMemo(() => {
    if (selectedTag === "Highlights") {
      return NEWS;
    }
    return NEWS.filter((n) => n.tag === selectedTag);
  }, [selectedTag]);

  const handleLike = (id: number) => {
    setLikedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex min-h-screen bg-[#0B0E13] text-white font-sans">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <main className="flex flex-col flex-grow items-center justify-center px-2 py-8">
          <div className="w-full max-w-2xl h-[80vh] bg-white/5 border-white/10 shadow-xl rounded-xl border flex flex-col min-h-[350px]">
          {/* Header */}
          <div className="p-3 border-b border-white/10 bg-gradient-to-r from-white/5 to-white/10">
            <div className="flex items-center space-x-3">
              {/* Circle with gradient border */}
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF007A] to-[#FF4D00] p-[2px]">
                  <div className="w-full h-full rounded-full bg-[#0B0E13] flex items-center justify-center">
                    <Newspaper className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Title with gradient text */}
              <h2 className="text-2xl font-bold text-white">
                News Feed
              </h2>
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
                  liked={likedIds.includes(news.id)}
                  onLike={() => handleLike(news.id)}
                />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
