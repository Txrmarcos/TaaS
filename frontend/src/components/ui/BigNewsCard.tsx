"use client";
import React, { useState, useEffect } from "react";
import { Tag, TAG_BADGE_STYLES } from "./TagCarousel";
import { X, User2, Bookmark, HandCoins, Send } from "lucide-react";
import { TaaSVerdictEmbed, TaaSVerification, Verdict } from "./TaaSVerdictEmbed";
import SupportModal from "./SupportModal";

export type Comment = {
  id: number;
  author: string;
  text: string;
  timestamp: number;
};

export type BigArticle = {
  id: number;
  title: string;
  description: string;
  content?: string;
  subtitle?: string;
  tag: Tag;
  author?: string;
  likes?: number;
  url?: string;
  supporters?: number;
  goal?: number;
  comments?: Comment[];
  // TaaS fields
  taasStatus?: TaaSVerification;
  verdict?: Verdict | null;
};

type Props = {
  article: BigArticle;
  liked: boolean;
  onLike: (id: number) => void;
  onClose: () => void;
  onSave?: (id: number) => void;
  onSupport: (opts: { id: number; amount: number }) => Promise<void> | void;
  supportingId?: number | null;
  onComment?: (id: number, text: string) => void;
};

export default function BigNewsCard({
  article,
  liked,
  onLike,
  onClose,
  onSave,
  onSupport,
  supportingId = null,
  onComment,
}: Props) {
  const { 
    id, 
    title, 
    tag, 
    author, 
    likes, 
    description, 
    content, 
    subtitle,
    url, 
    supporters, 
    goal, 
    comments = [],
    taasStatus = "Pending",
    verdict = null
  } = article;
  
  const pill = TAG_BADGE_STYLES[tag] || "bg-white/10 text-white";
  const displayLikes = (likes ?? 0) + (liked ? 1 : 0);

  const [expanded, setExpanded] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // ESC fecha
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const brandGradient = "bg-gradient-to-r from-[#FF007A] to-[#FF4D00] text-white";

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !onComment || isSubmittingComment) return;
    
    try {
      setIsSubmittingComment(true);
      await onComment(id, newComment.trim());
      setNewComment("");
      // O estado será atualizado pelo componente pai
    } catch (error) {
      console.error("Error submitting comment:", error);
      // Pode mostrar uma mensagem de erro específica aqui se necessário
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCommentSubmit();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    try {
      return new Date(timestamp).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Agora";
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-[22px] p-[2px] bg-gradient-to-br from-[#FF007A] to-[#FF4D00] flex-1 flex flex-col">
          <div className="rounded-[20px] bg-[#0B0E13] border border-white/10 shadow-xl flex-1 flex flex-col min-h-0">
            {/* header */}
            <div className="p-4 pb-2 relative flex-shrink-0">
              <h3 className="text-xl font-semibold text-white pr-12">{title}</h3>
              
              {/* ADICIONADO: Exibir subtitle se existir */}
              {subtitle && subtitle.trim() && (
                <p className="text-sm text-white/70 mt-2 pr-12 leading-relaxed">{subtitle}</p>
              )}
              
              <button
                onClick={onClose}
                className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/15 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 mt-3">
                <span className={["inline-flex px-3 py-1 rounded-full text-xs font-medium", pill].join(" ")}>{tag}</span>
              </div>
            </div>

            {/* body - scrollable content */}
            <div className="flex-1 px-4 overflow-y-auto min-h-0">
              {author && (
                <div className="mt-3 mb-2 flex items-center gap-2 text-sm text-white/80">
                  <User2 className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{author}</span>
                </div>
              )}
              
              <div className="text-sm text-white/80 leading-relaxed space-y-3">
                <p>{description}</p>
                {content && (!expanded ? (
                  <button 
                    onClick={() => setExpanded(true)} 
                    className="mt-2 inline-flex items-center gap-1 text-xs text-white/70 underline underline-offset-2 hover:text-white transition"
                  >
                    Ler mais
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="whitespace-pre-line">{content}</p>
                    <button 
                      onClick={() => setExpanded(false)} 
                      className="inline-flex items-center gap-1 text-xs text-white/70 underline underline-offset-2 hover:text-white transition"
                    >
                      Ler menos
                    </button>
                  </div>
                ))}
              </div>

              {/* TaaS Verdict Embed - Positioned after content */}
              <div className="mt-4">
                <TaaSVerdictEmbed
                  verdict={verdict}
                  taasStatus={taasStatus}
                />
              </div>

              {/* Comentários */}
              {onComment && (
                <div className="mt-6 space-y-3">
                  <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                    Comentários
                    <span className="text-white/60 text-xs">({comments.length})</span>
                  </h4>
                  
                  {/* Lista de comentários */}
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-white/5 p-3 rounded-lg text-sm border border-white/10">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-semibold text-white/90 text-xs truncate">
                              {comment.author}
                            </span>
                            <span className="text-white/50 text-xs flex-shrink-0">
                              {formatTimestamp(comment.timestamp)}
                            </span>
                          </div>
                          <p className="text-white/80 break-words">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-white/50 text-sm">Seja o primeiro a comentar!</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Input de comentário */}
                  <div className="space-y-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Escreva um comentário..."
                      className="w-full bg-white/10 border border-white/20 rounded-lg p-3 text-white placeholder-white/50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500/50 transition"
                      rows={2}
                      maxLength={500}
                      disabled={isSubmittingComment}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-white/40 text-xs">
                        {newComment.length}/500 • Enter para enviar
                      </span>
                      <button
                        onClick={handleCommentSubmit}
                        disabled={!newComment.trim() || isSubmittingComment}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-600 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-700 transition active:scale-95"
                      >
                        {isSubmittingComment ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onLike(id)}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs",
                    "outline-none focus-visible:ring-2 focus-visible:ring-white/20 transition active:scale-95",
                    liked ? "bg-rose-500/15 text-rose-300" : "bg-white/5 text-white/80 hover:bg-white/10",
                  ].join(" ")}
                  aria-pressed={liked}
                  title={liked ? "Remover like" : "Dar like"}
                >
                  <svg viewBox="0 0 24 24" className={`w-4 h-4 ${liked ? "fill-rose-500 text-rose-500" : "text-rose-400"}`}>
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  <span className="tabular-nums">{displayLikes}</span>
                </button>

                <button
                  onClick={() => onSave?.(id)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs bg-white/5 text-white/80 hover:bg-white/10 transition active:scale-95"
                  title="Salvar artigo"
                >
                  <Bookmark className="w-4 h-4" />
                  Salvar
                </button>
              </div>

              <button
                onClick={() => setSupportOpen(true)}
                disabled={supportingId === id}
                className={[
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                  brandGradient
                ].join(" ")}
                title="Apoiar este artigo"
              >
                {supportingId === id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Apoiando...
                  </>
                ) : (
                  <>
                    <HandCoins className="w-4 h-4" />
                    Apoiar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

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