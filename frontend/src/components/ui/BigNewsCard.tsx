"use client";
import React from "react";
import { Tag, TAG_BADGE_STYLES } from "./TagCarousel";
import { X, User2, Bookmark, HandCoins} from "lucide-react";
import SupportModal from "./SupportModal";

export type BigArticle = {
  id: number;
  title: string;
  description: string;
  content?: string;
  tag: Tag;
  author?: string;
  likes?: number;
  url?: string;
  supporters?: number;
  goal?: number;
};

type Props = {
  article: BigArticle;
  liked: boolean;
  onLike: (id: number) => void;
  onClose: () => void;
  onSave?: (id: number) => void;

  // suporte (vem do feed)
  onSupport: (opts: { id: number; amount: number }) => Promise<void> | void;
  supportingId?: number | null;
};

export default function BigNewsCard({
  article,
  liked,
  onLike,
  onClose,
  onSave,
  onSupport,
  supportingId = null,
}: Props) {
  const { id, title, tag, author, likes, description, content, url, supporters, goal } = article;
  const pill = TAG_BADGE_STYLES[tag] || "bg-white/10 text-white";
  const displayLikes = (likes ?? 0) + (liked ? 1 : 0);

  const [expanded, setExpanded] = React.useState(false);
  const [supportOpen, setSupportOpen] = React.useState(false);

  // ESC fecha
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const brandGradient = "bg-gradient-to-r from-[#FF007A] to-[#FF4D00] text-white";

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close"/>
      <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-[22px] p-[2px] bg-gradient-to-br from-[#FF007A] to-[#FF4D00]">
          <div className="rounded-[20px] bg-[#0B0E13] border border-white/10 shadow-xl">
            {/* header */}
            <div className="p-4 pb-2 relative">
              <h3 className="text-xl font-semibold text-white pr-12">{title}</h3>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/15 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <span className={["inline-flex mt-3 px-3 py-1 rounded-full text-xs font-medium", pill].join(" ")}>{tag}</span>
            </div>

            {/* body */}
            <div className="px-4 pb-4 max-h-[60vh] overflow-y-auto">
              {author && (
                <div className="mt-3 mb-2 flex items-center gap-2 text-sm text-white/80">
                  <User2 className="w-4 h-4" />
                  <span>{author}</span>
                </div>
              )}
              <div className="text-sm text-white/80 leading-relaxed space-y-3">
                <p>{description}</p>
                {content && (!expanded ? (
                  <button onClick={() => setExpanded(true)} className="mt-2 inline-flex items-center gap-1 text-xs text-white/70 underline underline-offset-2 hover:text-white">
                    Read more
                  </button>
                ) : (
                  <p className="whitespace-pre-line">{content}</p>
                ))}
              </div>
            </div>

            {/* footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onLike(id)}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs",
                    "outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition active:scale-95",
                    liked ? "bg-rose-500/15 text-rose-300" : "bg-white/5 text-white/80",
                  ].join(" ")}
                  aria-pressed={liked}
                  title={liked ? "Unlike" : "Like"}
                >
                  <svg viewBox="0 0 24 24" className={`w-4 h-4 ${liked ? "fill-rose-500 text-rose-500" : "text-rose-400"}`}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  <span className="tabular-nums">{displayLikes}</span>
                </button>

                <button
                  onClick={() => onSave?.(id)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs bg-white/5 text-white/80 hover:bg-white/10 transition"
                  title="Save"
                >
                  <Bookmark className="w-4 h-4" />
                  Save
                </button>
              </div>

              {/* CTA Support abre modal dedicado */}
              <button
                onClick={() => setSupportOpen(true)}
                className={["inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition active:scale-95", brandGradient].join(" ")}
                title="Support this article"
              >
                <HandCoins className="w-4 h-4" />
                Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Support modal */}
      <SupportModal
        open={supportOpen}
        onClose={() => setSupportOpen(false)}
        onConfirm={async (amount) => {
          await onSupport({ id, amount });
          setSupportOpen(false);
        }}
        processing={supportingId === id}
        supporters={supporters}
        goal={goal}
        url={url}
      />
    </div>
  );
}
