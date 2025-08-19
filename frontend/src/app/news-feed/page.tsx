"use client";
import React from "react";
import { Tag, TAGS, TagCarousel } from "@/components/ui/TagCarousel";
import { MiniNewsCard } from "@/components/ui/MiniNewsCard";
import { Sidebar } from "@/components/Sidebar";
import { Footer } from "@/components/Footer";
import { Newspaper } from "lucide-react";
import BigNewsCard, { BigArticle } from "@/components/ui/BigNewsCard";

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
    title: "AI stack speeds up real-time analytics",
    description:
      "Companies adopt streaming + LLM architectures with predictable costs.",
    tag: "Technology",
    author: "Alice Johnson",
    likes: 12,
    content: "In-depth analysis of the latest trends in AI and their impact on various industries. Duis malesuada magna nec neque aliquam, ut pulvinar nulla tempus. Vivamus cursus, odio a finibus aliquam, libero nisl luctus velit, ac tincidunt quam tortor vitae massa. Fusce pulvinar consequat congue. Nam consectetur tortor quis ligula convallis tristique. Duis felis enim, euismod dignissim malesuada at, egestas nec libero. Donec luctus vehicula eros, in imperdiet tortor mollis nec. Sed euismod mi sem, vitae rhoncus metus euismod euismod. Praesent ac diam posuere ligula aliquam sollicitudin. Sed euismod viverra cursus. Fusce rhoncus facilisis magna eu condimentum. Vivamus sodales tortor ac ipsum suscipit, pretium vestibulum erat molestie. Vivamus in malesuada nibh. Donec tincidunt, tellus vitae ultrices fringilla, nibh lectus convallis mi, sit amet interdum nisl purus eu diam. Vivamus viverra leo quis lorem convallis, non pretium nulla ultricies. Sed accumsan facilisis nibh, et tempus eros malesuada eu. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Integer at cursus nibh. Donec at quam nec lectus pharetra pellentesque. Sed pretium nibh at porta accumsan. Maecenas id ligula vitae urna tincidunt bibendum. Sed vel ullamcorper erat. Ut non tincidunt est, et dictum lorem. Vestibulum pulvinar, turpis nec semper vulputate, enim erat aliquam mauris, ac sagittis purus dui eu justo. Nunc feugiat, sem bibendum lobortis rhoncus, urna nibh viverra nisi, eget congue ipsum ex vitae elit. Mauris vitae interdum enim. Ut lacus enim, dapibus eget enim ut, fringilla laoreet risus. Sed venenatis tempus sapien, semper luctus diam facilisis sit amet. Vestibulum turpis turpis, ornare et quam congue, laoreet tempus felis. Nulla convallis volutpat dui vitae euismod. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus pharetra odio massa, quis maximus risus tristique vel. Morbi erat orci, iaculis at dui sit amet, fringilla maximus quam. Aenean in gravida sem. Duis bibendum sem ipsum, vel tempus mauris vestibulum quis. Aliquam dignissim blandit mauris, vel faucibus enim scelerisque non. Donec porta efficitur nisi eu cursus. Phasellus eleifend justo id elementum tincidunt. Sed risus quam, euismod a erat in, fringilla feugiat sapien. Donec semper diam dui, ac maximus felis lobortis ac. Etiam a rhoncus justo, a fringilla lorem. Fusce malesuada gravida ipsum, sed tempor dolor fermentum tristique. Suspendisse nibh enim, interdum rhoncus eros in, ultricies lobortis sapien. Donec iaculis nunc eros, vitae facilisis urna sodales sit amet.",
    url: "https://example.com/article/1",
  },
  {
    id: 2,
    title: "Interest rates and corporate credit",
    description: "How higher rates affect mid-size companies' capex decisions.",
    tag: "Business/Economy",
    author: "Robert Chen",
    likes: 7,
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce elementum facilisis eros, ut iaculis elit bibendum in. Mauris lacinia, libero eu tempus iaculis, sem urna mattis justo, ut egestas sapien lorem pulvinar arcu. Sed at enim suscipit, fermentum neque vitae, lacinia arcu. Suspendisse nibh massa, feugiat vel mi malesuada, fermentum varius libero.",
    url: "https://example.com/article/2",
  },
  {
    id: 3,
    title: "Elections and administrative reform",
    description: "Analysts comment on scenarios and timelines.",
    tag: "Politics/Opinion",
    author: "Maria Silva",
    likes: 15,
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce elementum facilisis eros, ut iaculis elit bibendum in. Mauris lacinia, libero eu tempus iaculis, sem urna mattis justo, ut egestas sapien lorem pulvinar arcu. Sed at enim suscipit, fermentum neque vitae, lacinia arcu. Suspendisse nibh massa, feugiat vel mi malesuada, fermentum varius libero.",
    url: "https://example.com/article/3",
  },
  {
    id: 4,
    title: "Festival premieres boost streaming",
    description: "New launches and record-breaking audience numbers this week.",
    tag: "Culture/Entertainment",
    author: "Lucas Pereira",
    likes: 20,
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce elementum facilisis eros, ut iaculis elit bibendum in. Mauris lacinia, libero eu tempus iaculis, sem urna mattis justo, ut egestas sapien lorem pulvinar arcu. Sed at enim suscipit, fermentum neque vitae, lacinia arcu. Suspendisse nibh massa, feugiat vel mi malesuada, fermentum varius libero.",
    url: "https://example.com/article/4",
  },
  {
    id: 5,
    title: "Trade tensions hit chip supply chains",
    description: "Supply remains under pressure in Asia and Europe.",
    tag: "World/International",
    author: "Sofia Wang",
    likes: 9,
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce elementum facilisis eros, ut iaculis elit bibendum in. Mauris lacinia, libero eu tempus iaculis, sem urna mattis justo, ut egestas sapien lorem pulvinar arcu. Sed at enim suscipit, fermentum neque vitae, lacinia arcu. Suspendisse nibh massa, feugiat vel mi malesuada, fermentum varius libero.",
    url: "https://example.com/article/4",
  },
  {
    id: 6,
    title: "Climate change and public health",
    description: "Study links heat waves with hospital admissions.",
    tag: "Health/Environment",
    author: "Daniel Gomez",
    likes: 11,
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce elementum facilisis eros, ut iaculis elit bibendum in. Mauris lacinia, libero eu tempus iaculis, sem urna mattis justo, ut egestas sapien lorem pulvinar arcu. Sed at enim suscipit, fermentum neque vitae, lacinia arcu. Suspendisse nibh massa, feugiat vel mi malesuada, fermentum varius libero.",
    url: "https://example.com/article/4",
  },
  {
    id: 7,
    title: "This week’s highlights",
    description: "The top stories you shouldn’t miss.",
    tag: "Highlights",
    author: "Editorial Team",
    likes: 25,
    content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce elementum facilisis eros, ut iaculis elit bibendum in. Mauris lacinia, libero eu tempus iaculis, sem urna mattis justo, ut egestas sapien lorem pulvinar arcu. Sed at enim suscipit, fermentum neque vitae, lacinia arcu. Suspendisse nibh massa, feugiat vel mi malesuada, fermentum varius libero.",
    url: "https://example.com/article/4",
  },
];

export default function NewsFeedPage() {
  const [selectedTag, setSelectedTag] = React.useState<Tag>("Highlights");
  const [likedIds, setLikedIds] = React.useState<number[]>([]);
  const [selected, setSelected] = React.useState<BigArticle | null>(null);
  const [supportingId, setSupportingId] = React.useState<number | null>(null);
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

  async function handleSupport({ id, amount }: { id: number; amount: number }) {
    try {
      setSupportingId(id);
      // TODO: chamar sua API
      await new Promise(r => setTimeout(r, 800));
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
                {/* Circle with gradient border */}
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#FF007A] to-[#FF4D00] p-[2px]">
                    <div className="w-full h-full rounded-full bg-[#0B0E13] flex items-center justify-center">
                      <Newspaper className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Title with gradient text */}
                <h2 className="text-2xl font-bold text-white">News Feed</h2>
              </div>
            </div>

            {/* Tags */}
            <div className="p-3 border-b border-white/10">
              <TagCarousel
                selectedTag={selectedTag}
                onTagClick={setSelectedTag}
              />
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

            {/* modal */}
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
