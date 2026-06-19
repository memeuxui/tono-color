import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Copy, Check, Heart, Trash2, Plus } from "lucide-react";
import { Tracker } from "./TrackerPin";
import { getColorName, DEMO_PALETTES } from "./colorUtils";
import { AppScreen } from "./LiveEditor";

interface PaletteScreenProps {
  trackers: Tracker[];
  onNavigate: (screen: AppScreen) => void;
}

export function PaletteScreen({ trackers, onNavigate }: PaletteScreenProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [savedPalettes] = useState(DEMO_PALETTES);
  const [likedColors, setLikedColors] = useState<Set<string>>(new Set());

  const handleCopy = async (value: string, key: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  };

  const toggleLike = (hex: string) => {
    setLikedColors((prev) => {
      const next = new Set(prev);
      if (next.has(hex)) next.delete(hex);
      else next.add(hex);
      return next;
    });
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
            Palette
          </h1>
        </div>
        <p className="text-sm pl-12" style={{ color: "rgba(255,255,255,0.4)" }}>
          {trackers.length} colors from your session
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Current session colors */}
        <div className="px-5 py-5">
          <SectionTitle>Current session</SectionTitle>

          {/* Big color strip */}
          <div className="flex h-16 rounded-2xl overflow-hidden mb-4 shadow-lg">
            {trackers.map((t) => (
              <div key={t.id} className="flex-1" style={{ background: t.color }} />
            ))}
          </div>

          {/* Color cards */}
          <div className="grid grid-cols-2 gap-3">
            {trackers.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <ColorCard
                  color={t.color}
                  tonalities={t.tonalities}
                  name={getColorName(t.color)}
                  isLiked={likedColors.has(t.color)}
                  isCopied={copied === t.id}
                  onCopy={() => handleCopy(t.color.toUpperCase(), t.id)}
                  onLike={() => toggleLike(t.color)}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Saved palettes */}
        <div className="px-5 pb-8">
          <SectionTitle>Saved palettes</SectionTitle>
          <div className="space-y-3">
            {savedPalettes.map((palette, i) => (
              <motion.div
                key={palette.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className="p-4 rounded-2xl"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-white font-semibold text-sm">{palette.name}</div>
                    <div className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
                      {palette.date} · {palette.colors.length} colors
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleCopy(palette.colors.join(", "), palette.id)}
                      className="size-7 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
                    >
                      <AnimatePresence mode="wait">
                        {copied === palette.id ? (
                          <motion.div key="c" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Check size={12} style={{ color: "#4ade80" }} />
                          </motion.div>
                        ) : (
                          <motion.div key="u" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                            <Copy size={12} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                    <button
                      className="size-7 rounded-lg flex items-center justify-center transition-all"
                      style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Swatch row */}
                <div className="flex gap-1.5">
                  {palette.colors.map((c) => (
                    <div
                      key={c}
                      className="flex-1 h-10 rounded-xl shadow-sm"
                      style={{ background: c, boxShadow: `0 2px 6px ${c}50` }}
                    />
                  ))}
                </div>
              </motion.div>
            ))}

            {/* New palette CTA */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate("export")}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-all"
              style={{
                border: "1px dashed rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              <Plus size={16} />
              Save current palette
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold mb-3 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.35)" }}>
      {children}
    </p>
  );
}

interface ColorCardProps {
  color: string;
  tonalities: string[];
  name: string;
  isLiked: boolean;
  isCopied: boolean;
  onCopy: () => void;
  onLike: () => void;
}

function ColorCard({ color, tonalities, name, isLiked, isCopied, onCopy, onLike }: ColorCardProps) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
      {/* Main swatch */}
      <div className="h-24 relative" style={{ background: color }}>
        <button
          onClick={onLike}
          className="absolute top-2 right-2 size-7 rounded-full flex items-center justify-center transition-all"
          style={{ background: "rgba(0,0,0,0.25)" }}
        >
          <Heart
            size={13}
            fill={isLiked ? "#ff4081" : "none"}
            stroke={isLiked ? "#ff4081" : "rgba(255,255,255,0.8)"}
          />
        </button>
      </div>

      {/* Tonality strip */}
      {tonalities.length > 0 && (
        <div className="flex h-4">
          {tonalities.map((t, i) => (
            <div key={i} className="flex-1" style={{ background: t }} />
          ))}
        </div>
      )}

      {/* Info */}
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div>
          <div className="text-white font-semibold text-xs">{name}</div>
          <div className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {color.toUpperCase()}
          </div>
        </div>
        <button
          onClick={onCopy}
          className="size-7 rounded-lg flex items-center justify-center transition-all active:scale-90"
          style={{
            background: isCopied ? "rgba(74,222,128,0.15)" : "rgba(255,255,255,0.08)",
            color: isCopied ? "#4ade80" : "rgba(255,255,255,0.5)",
          }}
        >
          <AnimatePresence mode="wait">
            {isCopied ? (
              <motion.div key="c" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Check size={12} />
              </motion.div>
            ) : (
              <motion.div key="u" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <Copy size={12} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}
