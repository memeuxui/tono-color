import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check, ChevronUp, ChevronDown } from "lucide-react";
import { hexToRgbString, hexToHslString, getContrastColor } from "./colorUtils";

type ColorFormat = "hex" | "rgb" | "hsl";

interface SwatchPopoverProps {
  color: string;
  tonalities: string[];
  activeIndex: number;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function SwatchPopover({ color, tonalities, activeIndex, onClose, onIndexChange }: SwatchPopoverProps) {
  const [format, setFormat] = useState<ColorFormat>("hex");
  const [copied, setCopied] = useState(false);

  const displayColor = tonalities[activeIndex] ?? color;

  const getFormatValue = (c: string) => {
    if (format === "hex") return c.toUpperCase();
    if (format === "rgb") return hexToRgbString(c);
    return hexToHslString(c);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(getFormatValue(displayColor));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const contrast = getContrastColor(displayColor);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.88, y: 6 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      className="absolute z-50 w-52 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
      style={{ background: "rgba(15,15,20,0.96)", backdropFilter: "blur(20px)" }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Color preview */}
      <div
        className="relative h-20 flex items-end justify-between p-3"
        style={{ background: displayColor }}
      >
        <span className="text-xs font-bold tracking-widest opacity-70" style={{ color: contrast }}>
          TONO
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onIndexChange(Math.max(0, activeIndex - 1))}
            disabled={activeIndex === 0}
            className="p-1 rounded-full disabled:opacity-30 transition-opacity"
            style={{ background: "rgba(0,0,0,0.25)", color: contrast }}
          >
            <ChevronUp size={12} />
          </button>
          <button
            onClick={() => onIndexChange(Math.min(tonalities.length - 1, activeIndex + 1))}
            disabled={activeIndex === tonalities.length - 1}
            className="p-1 rounded-full disabled:opacity-30 transition-opacity"
            style={{ background: "rgba(0,0,0,0.25)", color: contrast }}
          >
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      {/* Mini shade strip */}
      <div className="flex h-5">
        {tonalities.map((t, i) => (
          <button
            key={i}
            className="flex-1 transition-transform hover:scale-y-110 origin-bottom"
            style={{ background: t, outline: i === activeIndex ? "2px solid white" : "none", outlineOffset: "-1px" }}
            onClick={() => onIndexChange(i)}
          />
        ))}
      </div>

      {/* Format + value */}
      <div className="p-3 space-y-2">
        {/* Format tabs */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {(["hex", "rgb", "hsl"] as ColorFormat[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className="flex-1 py-1 text-xs font-semibold rounded-md transition-all uppercase tracking-wide"
              style={{
                background: format === f ? "rgba(255,255,255,0.12)" : "transparent",
                color: format === f ? "#fff" : "rgba(255,255,255,0.45)",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Value + copy */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-mono truncate"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.9)" }}
          >
            {getFormatValue(displayColor)}
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center size-7 rounded-lg transition-all active:scale-90"
            style={{
              background: copied ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.1)",
              color: copied ? "#4ade80" : "rgba(255,255,255,0.7)",
            }}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Check size={13} />
                </motion.div>
              ) : (
                <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                  <Copy size={13} />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Close tap area */}
      <button
        onClick={onClose}
        className="absolute top-2 right-2 size-5 rounded-full flex items-center justify-center text-xs"
        style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.6)" }}
      >
        ×
      </button>
    </motion.div>
  );
}
