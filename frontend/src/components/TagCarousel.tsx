"use client";
import React from "react";

export type Tag =
  | "Highlights"
  | "Technology"
  | "Business/Economy"
  | "Politics/Opinion"
  | "Culture/Entertainment"
  | "World/International"
  | "Health/Environment";

export const TAGS: Tag[] = [
  "Highlights",
  "Technology",
  "Business/Economy",
  "Politics/Opinion",
  "Culture/Entertainment",
  "World/International",
  "Health/Environment",
];

/** Pastel palette with transparency */
const COLORS: Record<Tag, { base: string }> = {
  Highlights: { base: "#FF007A" },          // pink
  Technology: { base: "#00FFF5" },          // cyan
  "Business/Economy": { base: "#FF4D00" },  // orange
  "Politics/Opinion": { base: "#7F7EFF" },  // blue
  "Culture/Entertainment": { base: "#FF007A" }, // reuse pink
  "World/International": { base: "#00FFF5" },   // reuse cyan
  "Health/Environment": { base: "#7AC74F" },    // green
};

/** Styles for badges (to be reused in MiniNewsCard) */
export const TAG_BADGE_STYLES: Record<Tag, string> = {
  Highlights: "bg-[#FF007A]/20 text-[#FF007A]",
  Technology: "bg-[#00FFF5]/20 text-[#00FFF5]",
  "Business/Economy": "bg-[#FF4D00]/20 text-[#FF4D00]",
  "Politics/Opinion": "bg-[#7F7EFF]/20 text-[#7F7EFF]",
  "Culture/Entertainment": "bg-[#FF007A]/20 text-[#FF007A]",
  "World/International": "bg-[#00FFF5]/20 text-[#00FFF5]",
  "Health/Environment": "bg-[#7AC74F]/20 text-[#7AC74F]",
};

interface TagCarouselProps {
  selectedTag: Tag;
  onTagClick: (tag: Tag) => void;
}

export const TagCarousel: React.FC<TagCarouselProps> = ({
  selectedTag,
  onTagClick,
}) => {
  return (
    <div className="flex overflow-x-auto scrollbar-hide gap-2 py-2 px-1">
      {TAGS.map((tag) => {
        const isSelected = selectedTag === tag;
        const color = COLORS[tag].base;

        return (
          <button
            key={tag}
            onClick={() => onTagClick(tag)}
            aria-pressed={isSelected}
            className={[
              "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              isSelected ? "scale-105 ring-2 ring-offset-1" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              background: isSelected ? `${color}33` : `${color}20`, // 20–33% opacity
              color,
              boxShadow: isSelected ? `0 0 0 2px ${color}` : undefined,
            }}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
};

export default TagCarousel;
