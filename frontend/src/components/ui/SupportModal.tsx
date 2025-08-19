"use client";
import React from "react";
import { X, HandCoins, ExternalLink } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => Promise<void> | void;

  // UI/behavior
  quickAmounts?: number[];       // ex.: [2,5,10]
  defaultAmount?: number;        // ex.: 5
  processing?: boolean;          // loading state

  // Info (opcional)
  supporters?: number;           // total backers
  goal?: number;                 // target (progresso)
  url?: string;                  // link original (opcional)
};

export default function SupportModal({
  open,
  onClose,
  onConfirm,
  quickAmounts = [2, 5, 10],
  defaultAmount = 5,
  processing = false,
  supporters = 0,
  goal = 0,
  url,
}: Props) {
  const [amount, setAmount] = React.useState<number>(defaultAmount);
  const [custom, setCustom] = React.useState<string>("");

  React.useEffect(() => {
    if (!open) {
      setAmount(defaultAmount);
      setCustom("");
    }
  }, [open, defaultAmount]);

  // ESC fecha
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const chosen =
    custom.trim() !== "" ? Math.max(1, Number(custom.trim())) : amount;

  const progress =
    goal > 0 ? Math.min(100, Math.round(((supporters ?? 0) / goal) * 100)) : 0;

  const brandGradient = "bg-gradient-to-r from-[#FF007A] to-[#FF4D00] text-white";

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* overlay */}
      <button
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />

      {/* container */}
      <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="rounded-[22px] p-[2px] bg-gradient-to-br from-[#FF007A] to-[#FF4D00]">
          <div className="rounded-[20px] bg-[#0B0E13] border border-white/10 shadow-2xl">
            {/* header */}
            <div className="p-4 pb-3 relative">
              <h3 className="text-lg font-semibold text-white pr-10">Support this article</h3>
              <button
                onClick={onClose}
                className="absolute top-3 right-3 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white hover:bg-white/15 transition"
                aria-label="Close"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* body */}
            <div className="px-4 pb-4 space-y-4">
              {/* progress (opcional) */}
              {goal > 0 && (
                <div>
                  <div className="flex items-center justify-between text-xs text-white/60 mb-1">
                    <span>{supporters ?? 0} supporters</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#FF007A] to-[#FF4D00]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="text-sm text-white/80">
                Choose an amount or enter a custom value:
              </div>

              {/* quick amounts */}
              <div className="flex items-center gap-2 flex-wrap">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      setAmount(q);
                      setCustom("");
                    }}
                    className={[
                      "px-3 py-1.5 rounded-full text-xs font-medium transition",
                      amount === q && custom === ""
                        ? brandGradient
                        : "bg-white/10 text-white/80 hover:bg-white/15",
                    ].join(" ")}
                  >
                    ${q}
                  </button>
                ))}

                {/* custom */}
                <div className="flex items-center gap-1 bg-white/10 rounded-full px-2 py-1.5">
                  <span className="text-xs text-white/60">$</span>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Custom"
                    value={custom}
                    onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, ""))}
                    className="w-20 bg-transparent outline-none text-xs text-white placeholder-white/40"
                  />
                </div>
              </div>

              {/* footer */}
              <div className="flex items-center justify-between">
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white underline underline-offset-2"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Read original
                  </a>
                ) : <span />}

                <button
                  onClick={() => onConfirm(chosen)}
                  disabled={processing}
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition active:scale-95",
                    brandGradient,
                    processing ? "opacity-70 cursor-wait" : "",
                  ].join(" ")}
                >
                  <HandCoins className="w-4 h-4" />
                  {processing ? "Processing…" : `Support $${chosen}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
