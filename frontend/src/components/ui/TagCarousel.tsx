"use client";
import React from "react";


export type Tag =
  | "Politics"
  | "Health"
  | "Environment"
  | "Technology"
  | "Sports"
  | "Entertainment"
  | "Business"
  | "Science"
  | "World"
  | "Other";

export const TAGS: Tag[] = [
  "Politics",
  "Health",
  "Environment",
  "Technology",
  "Sports",
  "Entertainment",
  "Business",
  "Science",
  "World",
  "Other",
];


/** Pastel palette for post tags */
const COLORS: Record<Tag, { base: string }> = {
  Politics: { base: "#7F7EFF" },        // blue
  Health: { base: "#7AC74F" },          // green
  Environment: { base: "#00C896" },    // teal
  Technology: { base: "#00FFF5" },     // cyan
  Sports: { base: "#FFB300" },         // yellow
  Entertainment: { base: "#FF007A" },  // pink
  Business: { base: "#FF4D00" },       // orange
  Science: { base: "#00B2FF" },        // light blue
  World: { base: "#A259FF" },          // purple
  Other: { base: "#B0B0B0" },          // gray
};


/** Styles for badges (to be reused in MiniNewsCard) */
export const TAG_BADGE_STYLES: Record<Tag, string> = {
  Politics: "bg-[#7F7EFF]/20 text-[#7F7EFF]",
  Health: "bg-[#7AC74F]/20 text-[#7AC74F]",
  Environment: "bg-[#00C896]/20 text-[#00C896]",
  Technology: "bg-[#00FFF5]/20 text-[#00FFF5]",
  Sports: "bg-[#FFB300]/20 text-[#FFB300]",
  Entertainment: "bg-[#FF007A]/20 text-[#FF007A]",
  Business: "bg-[#FF4D00]/20 text-[#FF4D00]",
  Science: "bg-[#00B2FF]/20 text-[#00B2FF]",
  World: "bg-[#A259FF]/20 text-[#A259FF]",
  Other: "bg-[#B0B0B0]/20 text-[#B0B0B0]",
};

interface TagCarouselProps {
  selectedTag: Tag | null;
  onTagClick: (tag: Tag) => void;
  showAllOption?: boolean;
  onAllClick?: () => void;
}

export const TagCarousel: React.FC<TagCarouselProps> = ({
  selectedTag,
  onTagClick,
  showAllOption = false,
  onAllClick,
}) => {
  return (
    <div className="flex overflow-x-auto scrollbar-hide gap-2 py-2 px-1">
      {showAllOption && (
        <button
          onClick={onAllClick}
          aria-pressed={selectedTag === null}
          className={[
            "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition",
            "focus:outline-none focus:ring-2 focus:ring-offset-2",
            selectedTag === null ? "scale-105 ring-2 ring-offset-1" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{
            background: selectedTag === null ? `#B0B0B033` : `#B0B0B020`,
            color: '#B0B0B0',
            boxShadow: selectedTag === null ? `0 0 0 2px #B0B0B0` : undefined,
          }}
        >
          All
        </button>
      )}
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
              background: isSelected ? `${color}33` : `${color}20`,
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
