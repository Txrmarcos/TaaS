"use client";
import React from "react";
import { Tag, TAG_BADGE_STYLES } from "./TagCarousel";
import { User2, Heart } from "lucide-react";

interface MiniNewsCardProps {
  title: string;
  description: string;
  tag: Tag;
  liked: boolean;
  onLike: () => void;
  onClick?: () => void;

  /** new props */
  author?: string;
  likes?: number; // base count from data/api
}

export const MiniNewsCard: React.FC<MiniNewsCardProps> = ({
  title,
  description,
  tag,
  liked,
  onLike,
  onClick,
  author,
  likes,
}) => {
  const style = TAG_BADGE_STYLES[tag] || "bg-gray-200 text-gray-800";
  const displayLikes = likes ?? 0;

  return (
    <div
      className={[
        "relative rounded-xl shadow-sm p-4 mb-4 flex flex-col min-h-[112px]",
        "bg-white/5 border border-white/10",
        "transition hover:border-white/20 hover:bg-white/[0.07]",
        "focus-within:ring-2 focus-within:ring-white/20",
        onClick ? "cursor-pointer" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Tag badge */}
      <span
        className={[
          "absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold",
          style,
        ].join(" ")}
      >
        {tag}
      </span>

      {/* Title */}
      <h2 className="text-lg font-bold text-white mb-1 line-clamp-2">
        {title}
      </h2>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-3 line-clamp-3">{description}</p>

      {/* Meta row: author (left) + likes (right) */}
      <div className="mt-auto flex items-center justify-between">
        {/* Author */}
        {author ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
            <User2 className="w-4 h-4" aria-hidden="true" />
            <span className="truncate max-w-[180px]">{author}</span>
          </span>
        ) : (
          <span />
        )}

        {/* Like button with counter */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLike();
          }}
          className={[
            "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs",
            "outline-none focus-visible:ring-2 focus-visible:ring-white/30",
            "transition active:scale-95",
            liked ? "bg-rose-500/15 text-rose-300" : "bg-white/5 text-white/70",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-pressed={liked}
          title={liked ? "Unlike" : "Like"}
        >
          <Heart
            className={`w-4 h-4 ${
              liked ? "fill-rose-500 text-rose-500" : "text-rose-400"
            }`}
          />
          <span className="tabular-nums">{displayLikes}</span>
        </button>
      </div>
    </div>
  );
};

export default MiniNewsCard;
