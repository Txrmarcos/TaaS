"use client";
import React from "react";
import { Pencil } from "lucide-react";

export type PostCardProps = {
  id: string | number;
  title: string;
  description?: string;            // mini descrição (subtitle ou content curto)
  likes?: bigint | number;         // pode vir como bigint ou number
  maxDescriptionChars?: number;    // limite de caracteres
  onEdit?: (postId: string | number) => void; // callback ao clicar no lápis
  onClick?: () => void;            // opcional: se quiser abrir ao clicar no card
  className?: string;              // customização externa (tamanho, etc.)
};

function truncate(text: string, max = 140) {
  if (!text) return "";
  return text.length <= max ? text : text.slice(0, max).trimEnd() + "…";
}

export default function PostCard({
  id,
  title,
  description,
  likes,
  maxDescriptionChars = 140,
  onEdit,
  onClick,
  className,
}: PostCardProps) {
  const likesNum =
    typeof likes === "bigint" ? Number(likes) :
    typeof likes === "number" ? likes : 0;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      className={[
        "relative shrink-0 w-40 h-40 aspect-square",
        "bg-white/5 border border-white/10 rounded-xl p-3",
        "flex flex-col cursor-pointer hover:bg-white/10 transition",
        className || ""
      ].join(" ")}
    >
      {/* botão editar no canto superior direito */}
      <button
        aria-label="Edit post"
        className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-white/10 transition"
        onClick={(e) => {
          e.stopPropagation(); // evita abrir ao clicar no card
          onEdit?.(id);
        }}
      >
        <Pencil className="w-3.5 h-3.5 text-white/70" />
      </button>

      {/* título */}
      <h3 className="font-semibold text-sm text-white truncate pr-6">{title}</h3>

      {/* mini descrição */}
      {description && (
        <p className="text-xs text-white/70 mt-1 overflow-hidden leading-snug">
          {truncate(description, maxDescriptionChars)}
        </p>
      )}

      {/* rodapé com total de likes */}
      <div className="mt-auto text-[10px] text-white/40">
        {likesNum} like{likesNum === 1 ? "" : "s"}
      </div>
    </div>
  );
}
