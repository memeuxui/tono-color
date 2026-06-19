import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Copy, Check, Download, FileCode, Share2, Layers } from "lucide-react";
import { Tracker } from "./TrackerPin";
import { getColorName } from "./colorUtils";
import { AppScreen } from "./LiveEditor";

interface ExportScreenProps {
  trackers: Tracker[];
  onNavigate: (screen: AppScreen) => void;
}

export function ExportScreen({ trackers, onNavigate }: ExportScreenProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [paletteName, setPaletteName] = useState("My Palette");

  const hexValues = trackers.map((t) => t.color.toUpperCase());

  const handleCopy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  const copyAllHex = () => handleCopy(hexValues.join(", "), "hex");

  const copyCssVars = () => {
    const vars = hexValues
      .map((hex, i) => `  --color-${i + 1}: ${hex};`)
      .join("\n");
    handleCopy(`:root {\n${vars}\n}`, "css");
  };

  const shareLink = () => {
    const url = `https://tono.app/palette?colors=${hexValues.map((h) => h.slice(1)).join(",")}`;
    handleCopy(url, "share");
  };

  return (
    <div
      className="size-full flex flex-col"
      style={{ background: "#080810", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* Header */}
      <div
        className="shrink-0 px-5 pt-12 pb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => onNavigate("editor")}
            className="size-9 rounded-full flex items-center justify-center transition-all active:scale-90"
            style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}
          >
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-white font-black" style={{ letterSpacing: "-0.02em" }}>
            Export
          </h1>
        </div>
        <p className="text-sm pl-12" style={{ color: "rgba(255,255,255,0.4)" }}>
          Share your palette with the world
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Palette card preview */}
        <div className="px-5 py-6">
          <p className="text-xs font-bold mb-3 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
            PALETTE PREVIEW
          </p>

          <PaletteCard trackers={trackers} name={paletteName} />

          {/* Name input */}
          <div className="mt-3">
            <input
              value={paletteName}
              onChange={(e) => setPaletteName(e.target.value)}
              placeholder="Palette name…"
              className="w-full px-4 py-2.5 rounded-xl text-sm font-semibold outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.07)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            />
          </div>
        </div>

        {/* Export options */}
        <div className="px-5 pb-8 space-y-3">
          <p className="text-xs font-bold mb-3 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
            EXPORT OPTIONS
          </p>

          <ExportOption
            icon={<Copy size={18} />}
            title="Copy all HEX"
            description={hexValues.slice(0, 3).join(", ") + (hexValues.length > 3 ? "…" : "")}
            isCopied={copied === "hex"}
            gradient="linear-gradient(135deg, #FF6B6B, #FF8E53)"
            onClick={copyAllHex}
          />

          <ExportOption
            icon={<FileCode size={18} />}
            title="Copy as CSS variables"
            description=":root { --color-1: #...; }"
            isCopied={copied === "css"}
            gradient="linear-gradient(135deg, #845EC2, #4B4ACF)"
            onClick={copyCssVars}
          />

          <ExportOption
            icon={<Download size={18} />}
            title="Download PNG card"
            description="High-res 1200×630 palette card"
            isCopied={copied === "png"}
            gradient="linear-gradient(135deg, #00C9FF, #0077CC)"
            onClick={() => handleCopy("Downloading PNG…", "png")}
            comingSoon
          />

          <ExportOption
            icon={<Layers size={18} />}
            title="Export .ASE (Adobe)"
            description="For Photoshop, Illustrator & XD"
            isCopied={copied === "ase"}
            gradient="linear-gradient(135deg, #F7971E, #FFD200)"
            onClick={() => handleCopy("Exporting ASE…", "ase")}
            comingSoon
          />

          <ExportOption
            icon={<Share2 size={18} />}
            title="Share link"
            description="Copy a shareable palette URL"
            isCopied={copied === "share"}
            gradient="linear-gradient(135deg, #11998E, #38EF7D)"
            onClick={shareLink}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Palette Card Preview ──────────────────────────────────────────────────
function PaletteCard({ trackers, name }: { trackers: Tracker[]; name: string }) {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: "linear-gradient(135deg, #0D0D1A 0%, #1A0D2E 100%)" }}
    >
      {/* Color swatches row */}
      <div className="flex h-28">
        {trackers.map((t) => (
          <div
            key={t.id}
            className="flex-1 relative group"
            style={{ background: t.color }}
          />
        ))}
      </div>

      {/* Info bar */}
      <div className="px-4 py-3">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>
              {name}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
              {trackers.length} colors · tono
            </div>
          </div>
          <span className="text-white font-black text-sm tracking-tight opacity-60">tono</span>
        </div>

        {/* Color details */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {trackers.map((t) => (
            <div key={t.id} className="shrink-0 text-center">
              <div
                className="size-6 rounded-lg mx-auto mb-1"
                style={{ background: t.color, boxShadow: `0 2px 8px ${t.color}60` }}
              />
              <div className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.5)", fontSize: 9 }}>
                {t.color.toUpperCase()}
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.3)", fontSize: 8 }}>
                {getColorName(t.color)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Export Option Card ────────────────────────────────────────────────────
interface ExportOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  isCopied: boolean;
  onClick: () => void;
  comingSoon?: boolean;
}

function ExportOption({ icon, title, description, gradient, isCopied, onClick, comingSoon }: ExportOptionProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={comingSoon}
      className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
      style={{
        background: "rgba(255,255,255,0.05)",
        border: isCopied ? "1px solid rgba(74,222,128,0.3)" : "1px solid transparent",
        opacity: comingSoon ? 0.6 : 1,
      }}
    >
      {/* Icon */}
      <div
        className="size-11 rounded-xl flex items-center justify-center shrink-0 text-white"
        style={{ background: gradient }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold text-sm flex items-center gap-2">
          {title}
          {comingSoon && (
            <span
              className="px-1.5 py-0.5 rounded text-xs font-bold"
              style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", fontSize: 10 }}
            >
              SOON
            </span>
          )}
        </div>
        <div className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
          {description}
        </div>
      </div>

      {/* Copy indicator */}
      <AnimatePresence mode="wait">
        {isCopied ? (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            className="size-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(74,222,128,0.2)", color: "#4ade80" }}
          >
            <Check size={14} />
          </motion.div>
        ) : (
          <motion.div
            key="arrow"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="size-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
          >
            <Copy size={13} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
