"use client";
import React from "react";
import { Tag, TAG_BADGE_STYLES } from "./TagCarousel";

interface MiniNewsCardProps {
  title: string;
  description: string;
  tag: Tag;
  liked: boolean;
  onLike: () => void;
  onClick?: () => void;
}

export const MiniNewsCard: React.FC<MiniNewsCardProps> = ({
  title,
  description,
  tag,
  liked,
  onLike,
  onClick,
}) => {
  const style = TAG_BADGE_STYLES[tag] || "bg-gray-200 text-gray-800";

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
      <h2 className="text-lg font-bold text-white mb-1 line-clamp-2">{title}</h2>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-2 line-clamp-3">{description}</p>

      {/* Like button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onLike();
        }}
        className="self-end mt-auto inline-flex items-center justify-center rounded-full p-1.5 outline-none focus-visible:ring-2 focus-visible:ring-white/30 active:scale-95 transition"
        aria-pressed={liked}
        title={liked ? "Unlike" : "Like"}
      >
        {liked ? (
          <svg viewBox="0 0 24 24" width={24} height={24} fill="#f43f5e">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            width={24}
            height={24}
            fill="none"
            stroke="#f43f5e"
            strokeWidth={2}
          >
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default MiniNewsCard;
