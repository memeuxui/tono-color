import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Check, Copy, X } from "lucide-react";
import { Tracker } from "./TrackerPin";
import { hexToRgbString, hexToHslString, getColorName, getContrastColor } from "./colorUtils";

interface ColorsSidebarProps {
  trackers: Tracker[];
  /** desktop: vertical stack; mobile: horizontal strip */
  orientation?: "vertical" | "horizontal";
}

export function ColorsSidebar({ trackers, orientation = "vertical" }: ColorsSidebarProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleCopy = async (hex: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(hex.toUpperCase());
    toast.success("Copied!", {
      description: hex.toUpperCase(),
      duration: 1500,
    });
  };

  if (orientation === "horizontal") {
    return (
      <div className="flex h-full">
        {trackers.map((t) => (
          <HorizontalCell
            key={t.id}
            tracker={t}
            isActive={activeId === t.id}
            onOpen={() => setActiveId(activeId === t.id ? null : t.id)}
            onCopy={handleCopy}
            onClose={() => setActiveId(null)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col size-full">
      {trackers.map((t) => (
        <VerticalCell
          key={t.id}
          tracker={t}
          isActive={activeId === t.id}
          onOpen={() => setActiveId(activeId === t.id ? null : t.id)}
          onCopy={handleCopy}
          onClose={() => setActiveId(null)}
        />
      ))}
    </div>
  );
}

// ─── Vertical cell (desktop sidebar) ─────────────────────────────────────────
interface CellProps {
  tracker: Tracker;
  isActive: boolean;
  onOpen: () => void;
  onCopy: (hex: string, e: React.MouseEvent) => void;
  onClose: () => void;
}

function VerticalCell({ tracker, isActive, onOpen, onCopy, onClose }: CellProps) {
  const isLight = getContrastColor(tracker.color) === "#000000";
  const labelColor = isLight ? "rgba(25,24,24,0.6)" : "rgba(252,252,252,0.6)";

  return (
    <motion.div
      className="relative flex-1 flex flex-col cursor-pointer overflow-visible"
      onClick={onOpen}
      whileHover={{ filter: "brightness(1.06)" }}
      transition={{ duration: 0.12 }}
    >
      {/* Color block with label overlay */}
      <div
        className="flex-1 relative"
        style={{ background: tracker.color, transition: "background 0.22s ease" }}
      >
        {/* Label overlay at bottom — always visible */}
        <div
          className="absolute bottom-0 left-0 right-0 flex items-center"
          style={{ height: 36, padding: "0 8px" }}
        >
          <div className="flex-1 min-w-0">
            <div
              className="leading-none truncate font-bold"
              style={{ color: labelColor, fontSize: 8, letterSpacing: "0.04em" }}
            >
              {getColorName(tracker.color).toUpperCase()}
            </div>
            <div
              className="leading-none truncate mt-0.5"
              style={{ color: labelColor, fontSize: 8, fontFamily: "'PT Mono', monospace" }}
            >
              {tracker.color.toUpperCase()}
            </div>
          </div>
          <button
            onClick={(e) => onCopy(tracker.color, e)}
            className="shrink-0 flex items-center justify-center"
          >
            <Copy size={14} color={labelColor} />
          </button>
        </div>
      </div>

      {/* Detail popover */}
      <AnimatePresence>
        {isActive && (
          <ColorPopover tracker={tracker} onCopy={onCopy} onClose={onClose} side="left" />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Horizontal cell (mobile strip) ──────────────────────────────────────────
function HorizontalCell({ tracker, isActive, onOpen, onCopy, onClose }: CellProps) {
  const isLight = getContrastColor(tracker.color) === "#000000";
  const labelColor = isLight ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.65)";

  return (
    <motion.div
      className="relative flex-1 flex flex-col cursor-pointer overflow-visible"
      onClick={onOpen}
      whileHover={{ filter: "brightness(1.06)" }}
    >
      {/* Color block with inline label overlay */}
      <div
        className="flex-1 relative"
        style={{ background: tracker.color, transition: "background 0.22s ease" }}
      >
        <div
          className="absolute bottom-0 left-0 right-0 flex flex-col justify-end px-1.5 pb-1.5"
        >
          <div
            className="font-bold leading-none truncate"
            style={{ fontSize: 7, letterSpacing: "0.04em", color: labelColor }}
          >
            {getColorName(tracker.color).toUpperCase()}
          </div>
          <div
            className="leading-none truncate mt-0.5"
            style={{ fontSize: 7, color: labelColor, fontFamily: "'PT Mono', monospace" }}
          >
            {tracker.color.toUpperCase()}
          </div>
        </div>
        <button
          onClick={(e) => onCopy(tracker.color, e)}
          className="absolute top-1.5 right-1.5 size-5 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
          style={{ background: "rgba(0,0,0,0.25)" }}
        >
          <Copy size={9} color={labelColor} />
        </button>
      </div>

      {/* Detail popover — opens downward from mobile strip */}
      <AnimatePresence>
        {isActive && (
          <ColorPopover tracker={tracker} onCopy={onCopy} onClose={onClose} side="top" />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Detail popover ───────────────────────────────────────────────────────────
type ColorFormat = "hex" | "rgb" | "hsl";

function ColorPopover({
  tracker, onCopy, onClose, side,
}: {
  tracker: Tracker;
  onCopy: (hex: string, e: React.MouseEvent) => void;
  onClose: () => void;
  side: "left" | "top";
}) {
  const [format, setFormat] = useState<ColorFormat>("hex");
  const [justCopied, setJustCopied] = useState(false);

  const getValue = () => {
    if (format === "hex") return tracker.color.toUpperCase();
    if (format === "rgb") return hexToRgbString(tracker.color);
    return hexToHslString(tracker.color);
  };

  const handleCopyValue = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(getValue());
    setJustCopied(true);
    toast.success("Copied!", { description: getValue(), duration: 1400 });
    setTimeout(() => setJustCopied(false), 1600);
  };

  const positionStyle: React.CSSProperties =
    side === "left"
      ? { right: "calc(100% + 8px)", top: "50%", transform: "translateY(-50%)" }
      : { bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onClick={(e) => e.stopPropagation()}
      className="absolute z-50 w-44 rounded-2xl overflow-hidden shadow-2xl"
      style={{
        ...positionStyle,
        background: "rgba(12,12,20,0.96)",
        backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {/* Color preview */}
      <div style={{ height: 56, background: tracker.color, position: "relative" }}>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-1.5 right-1.5 size-5 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,255,255,0.8)" }}
        >
          <X size={10} />
        </button>
        <span
          className="absolute bottom-1.5 left-2.5 font-bold"
          style={{ color: "rgba(255,255,255,0.65)", fontSize: 9, letterSpacing: "0.1em" }}
        >
          {getColorName(tracker.color).toUpperCase()}
        </span>
      </div>

      {/* Format tabs */}
      <div className="p-2 space-y-2">
        <div
          className="flex rounded-lg p-0.5"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          {(["hex", "rgb", "hsl"] as ColorFormat[]).map((f) => (
            <button
              key={f}
              onClick={(e) => { e.stopPropagation(); setFormat(f); }}
              className="flex-1 py-1 rounded-md text-xs font-bold uppercase tracking-wide transition-all"
              style={{
                background: format === f ? "rgba(255,255,255,0.14)" : "transparent",
                color: format === f ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Value + copy */}
        <div className="flex items-center gap-1.5">
          <div
            className="flex-1 px-2 py-1.5 rounded-lg font-mono text-xs truncate"
            style={{
              background: "rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.88)",
            }}
          >
            {getValue()}
          </div>
          <button
            onClick={handleCopyValue}
            className="size-7 rounded-lg flex items-center justify-center transition-all shrink-0"
            style={{
              background: justCopied ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.1)",
              color: justCopied ? "#4ade80" : "rgba(255,255,255,0.7)",
            }}
          >
            <AnimatePresence mode="wait">
              {justCopied ? (
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
    </motion.div>
  );
}
