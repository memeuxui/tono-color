import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Copy, Check, FileCode, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Tracker } from "./TrackerPin";
import { getColorName, getContrastColor } from "./colorUtils";

interface ExportSheetProps {
  trackers: Tracker[]; // snapshot — frozen at the moment Export was clicked
  onClose: () => void;
}

export function ExportSheet({ trackers, onClose }: ExportSheetProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const hexValues = trackers.map((t) => t.color.toUpperCase());

  const handleCopy = async (value: string, key: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    toast.success(label, { duration: 1500 });
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAllHex = () => handleCopy(hexValues.join(", "), "hex", "HEX values copied");

  const copyCssVars = () => {
    const vars = hexValues.map((hex, i) => `  --color-${i + 1}: ${hex};`).join("\n");
    handleCopy(`:root {\n${vars}\n}`, "css", "CSS variables copied");
  };

  const shareLink = () => {
    const url = `https://tono.app/p?c=${hexValues.map((h) => h.slice(1)).join(",")}`;
    handleCopy(url, "share", "Share link copied");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-end md:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 48, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 48, opacity: 0, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 360, damping: 34 }}
        className="relative w-full max-w-sm rounded-t-3xl md:rounded-3xl overflow-hidden"
        style={{
          background: "rgba(12,12,22,0.98)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 -4px 48px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-0 md:hidden">
          <div className="w-9 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.18)" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-1">
          <div>
            <h2
              className="text-white font-black"
              style={{ fontSize: 18, letterSpacing: "-0.03em", fontFamily: "'PT Mono', monospace" }}
            >
              Save Palette
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
              {trackers.length} colors · choose a format
            </p>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            <X size={15} />
          </button>
        </div>

        <div className="px-5 pb-6 pt-4 space-y-4">
          {/* Color swatches — large horizontal preview */}
          <div className="rounded-2xl overflow-hidden" style={{ height: 80 }}>
            <div className="flex h-full">
              {trackers.map((t) => {
                const isLight = getContrastColor(t.color) === "#000000";
                const labelColor = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.55)";
                return (
                  <div
                    key={t.id}
                    className="flex-1 relative flex flex-col justify-end"
                    style={{ background: t.color }}
                  >
                    <div className="px-1.5 pb-1.5">
                      <div
                        className="font-bold truncate leading-none"
                        style={{ fontSize: 7, letterSpacing: "0.04em", color: labelColor }}
                      >
                        {getColorName(t.color).toUpperCase()}
                      </div>
                      <div
                        className="truncate leading-none mt-0.5"
                        style={{ fontSize: 7, color: labelColor, fontFamily: "'PT Mono', monospace" }}
                      >
                        {t.color.toUpperCase()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export options */}
          <div className="space-y-2">
            <SaveOption
              icon={<Copy size={16} />}
              title="Copy HEX values"
              value={hexValues.join(", ")}
              accent="#da1230"
              isCopied={copied === "hex"}
              onClick={copyAllHex}
            />
            <SaveOption
              icon={<FileCode size={16} />}
              title="Copy CSS variables"
              value=":root { --color-1: … }"
              accent="#8012da"
              isCopied={copied === "css"}
              onClick={copyCssVars}
            />
            <SaveOption
              icon={<Share2 size={16} />}
              title="Share link"
              value="tono.app/p?c=…"
              accent="#0d8a5e"
              isCopied={copied === "share"}
              onClick={shareLink}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Save option row ──────────────────────────────────────────────────────────
interface SaveOptionProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  accent: string;
  isCopied: boolean;
  onClick: () => void;
}

function SaveOption({ icon, title, value, accent, isCopied, onClick }: SaveOptionProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.015, y: -1 }}
      whileTap={{ scale: 0.975 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left"
      style={{
        background: isCopied ? `${accent}18` : "rgba(255,255,255,0.05)",
        border: isCopied ? `1px solid ${accent}44` : "1px solid rgba(255,255,255,0.06)",
        transition: "background 0.2s ease, border-color 0.2s ease",
      }}
    >
      {/* Icon chip */}
      <div
        className="size-9 rounded-xl flex items-center justify-center shrink-0 text-white"
        style={{ background: accent }}
      >
        {icon}
      </div>

      {/* Label + preview */}
      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold text-sm">{title}</div>
        <div
          className="text-xs truncate mt-0.5"
          style={{ color: "rgba(255,255,255,0.35)", fontFamily: "'PT Mono', monospace" }}
        >
          {value}
        </div>
      </div>

      {/* Copy feedback */}
      <AnimatePresence mode="wait">
        {isCopied ? (
          <motion.div
            key="check"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="size-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: `${accent}28`, color: accent }}
          >
            <Check size={13} />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="size-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.4)" }}
          >
            <Copy size={12} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
