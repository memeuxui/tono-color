import { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, ImageIcon, Shuffle, Minus, Plus, Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { CameraCanvas, Source } from "./CameraCanvas";
import { TrackerPin, Tracker } from "./TrackerPin";
import { ColorsSidebar } from "./ColorsSidebar";
import { ExportSheet } from "./ExportSheet";
import { getContrastColor } from "./colorUtils";

export type { Source };
export type AppScreen = "editor" | "palette" | "export";

interface LiveEditorProps {
  source: Source;
  imageObjectUrl: string | null;
  trackers: Tracker[];
  trackerCount: number;
  cameraRequestTrigger: number;
  onColorsUpdate: (colorMap: Record<string, string>) => void;
  onTrackerDrag: (id: string, x: number, y: number) => void;
  onShuffle: () => void;
  onTrackerCountChange: (delta: number) => void;
  onSourceSwitch: (source: Source) => void;
  onUpload: (objectUrl: string) => void;
}

const SIDEBAR_WIDTH = 168;
const TASKBAR_BOTTOM = 20;
const TASKBAR_HEIGHT = 56;

export function LiveEditor({
  source,
  imageObjectUrl,
  trackers,
  trackerCount,
  cameraRequestTrigger,
  onColorsUpdate,
  onTrackerDrag,
  onShuffle,
  onTrackerCountChange,
  onSourceSwitch,
  onUpload,
}: LiveEditorProps) {
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const draggingRef = useRef<string | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(true);
  const [exportTrackers, setExportTrackers] = useState<Tracker[]>([]);

  const trackerPositions = trackers.map(({ id, x, y }) => ({ id, x, y }));

  useEffect(() => {
    if (!dragging) return;
    draggingRef.current = dragging;

    const handleMove = (e: PointerEvent) => {
      if (!draggingRef.current || !canvasAreaRef.current) return;
      const rect = canvasAreaRef.current.getBoundingClientRect();
      const x = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.max(2, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));
      onTrackerDrag(draggingRef.current, x, y);
    };

    const handleUp = () => {
      draggingRef.current = null;
      setDragging(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [dragging, onTrackerDrag]);

  const handlePinPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(id);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      onUpload(url);
      e.target.value = "";
    },
    [onUpload]
  );

  const handleOpenExport = useCallback(() => {
    setExportTrackers([...trackers]);
    setShowExport(true);
  }, [trackers]);

  const taskbarProps = {
    trackerCount,
    showPalette: showMobilePalette,
    onPaletteToggle: () => setShowMobilePalette((v) => !v),
    onCameraClick: () => onSourceSwitch("camera"),
    onUploadClick: () => fileInputRef.current?.click(),
    onTrackerCountChange,
    onExport: handleOpenExport,
    onShuffle,
  };

  return (
    <div
      className="size-full flex flex-col md:flex-row overflow-hidden"
      style={{ background: "#080810", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      {/* ─── Canvas area ─── */}
      <div
        ref={canvasAreaRef}
        className="relative flex-1 overflow-hidden"
        style={{ cursor: dragging ? "grabbing" : "default" }}
      >
        <CameraCanvas
          source={source}
          imageObjectUrl={imageObjectUrl}
          trackerPositions={trackerPositions}
          onColorsUpdate={onColorsUpdate}
          cameraRequestTrigger={cameraRequestTrigger}
          onCameraRequest={() => onSourceSwitch("camera")}
        >
          {/* Gradient overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 28%, transparent 60%, rgba(0,0,0,0.5) 100%)",
            }}
          />

          {/* ─── Logo ─── */}
          {/* Desktop: small inline */}
          <div className="hidden md:flex absolute top-4 left-4 z-30 items-center gap-2">
            <span className="text-white font-bold select-none" style={{ fontSize: 20, letterSpacing: "-0.04em", fontFamily: "'PT Mono', monospace" }}>
              tono
            </span>
            <LiveBadge source={source} />
          </div>

          {/* Mobile: big frosted-glass pill */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="md:hidden absolute top-4 left-4 z-30 flex items-center gap-3 select-none"
            style={{
              background: "rgba(255,255,255,0.18)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.28)",
              borderRadius: 20,
              padding: "10px 18px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
            }}
          >
            <span className="text-white font-bold" style={{ fontSize: 32, letterSpacing: "-0.04em", fontFamily: "'PT Mono', monospace", lineHeight: 1 }}>
              tono
            </span>
            <LiveBadge source={source} large />
          </motion.div>

          {/* Tracker reticles */}
          <AnimatePresence>
            {trackers.map((tracker, i) => (
              <TrackerPin
                key={tracker.id}
                tracker={tracker}
                index={i}
                isDragging={dragging === tracker.id}
                onPointerDown={handlePinPointerDown}
              />
            ))}
          </AnimatePresence>

          {/* Mobile floating palette card */}
          <AnimatePresence>
            {showMobilePalette && (
              <motion.div
                key="palette-card"
                initial={{ opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
                className="md:hidden absolute left-4 right-4 z-20"
                style={{ bottom: 16 }}
              >
                <MobilePaletteCard trackers={trackers} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop floating taskbar */}
          <div
            className="hidden md:flex absolute left-0 right-0 justify-center z-30"
            style={{ bottom: TASKBAR_BOTTOM }}
          >
            <DesktopTaskbar {...taskbarProps} />
          </div>
        </CameraCanvas>

        {/* Export overlay */}
        <AnimatePresence>
          {showExport && (
            <ExportSheet trackers={exportTrackers} onClose={() => setShowExport(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* ─── Mobile bottom taskbar ─── */}
      <div
        className="md:hidden shrink-0 flex flex-col gap-2.5 px-4"
        style={{ background: "#080810", paddingTop: 12, paddingBottom: 24 }}
      >
        {/* Row 1: controls pill */}
        <MobileControlsRow {...taskbarProps} />
        {/* Row 2: export button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleOpenExport}
          className="w-full flex items-center justify-center gap-2 rounded-full font-bold text-white"
          style={{
            height: 52,
            background: "#8012da",
            border: "1.5px solid #4c137a",
            fontSize: 15,
            boxShadow: "0 2px 20px rgba(128,18,218,0.45)",
          }}
        >
          <Download size={17} />
          Export Palette
        </motion.button>
      </div>

      {/* ─── Desktop sidebar ─── */}
      <div
        className="hidden md:block shrink-0 relative"
        style={{ width: SIDEBAR_WIDTH, borderLeft: "1px solid rgba(255,255,255,0.06)" }}
      >
        <ColorsSidebar trackers={trackers} orientation="vertical" />
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}

// ─── Live badge ───────────────────────────────────────────────────────────────
function LiveBadge({ source, large = false }: { source: Source; large?: boolean }) {
  return (
    <motion.div
      animate={source === "camera" ? { opacity: [1, 0.55, 1] } : {}}
      transition={{ duration: 1.8, repeat: Infinity }}
      className="flex items-center gap-1.5 rounded-full font-bold text-white"
      style={{
        background: source === "camera" ? "rgba(21,94,7,0.9)" : "rgba(80,80,100,0.85)",
        backdropFilter: "blur(8px)",
        padding: large ? "6px 14px" : "4px 10px",
        fontSize: large ? 13 : 11,
      }}
    >
      {source === "camera" && (
        <motion.div
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="rounded-full bg-white"
          style={{ width: large ? 7 : 5, height: large ? 7 : 5 }}
        />
      )}
      {source === "camera" ? "LIVE" : "PHOTO"}
    </motion.div>
  );
}

// ─── Mobile floating palette card ─────────────────────────────────────────────
function MobilePaletteCard({ trackers }: { trackers: Tracker[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (t: Tracker) => {
    await navigator.clipboard.writeText(t.color.toUpperCase());
    setCopiedId(t.id);
    toast.success("Copied!", { description: t.color.toUpperCase(), duration: 1400 });
    setTimeout(() => setCopiedId(null), 1600);
  };

  return (
    <div
      className="overflow-hidden"
      style={{
        borderRadius: 22,
        background: "rgba(200,200,210,0.22)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
        border: "1.5px solid rgba(255,255,255,0.32)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
        height: 140,
      }}
    >
      <div className="flex h-full">
        {trackers.map((t) => {
          const isLight = getContrastColor(t.color) === "#000000";
          const labelColor = isLight ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.75)";
          const isCopied = copiedId === t.id;

          return (
            <motion.button
              key={t.id}
              className="flex-1 relative flex flex-col items-center justify-end pb-2 gap-1"
              style={{ background: t.color, transition: "background 0.22s ease" }}
              onClick={() => handleCopy(t)}
              whileTap={{ scale: 0.97 }}
            >
              {/* Copy icon */}
              <div
                className="flex items-center justify-center rounded-full"
                style={{ width: 20, height: 20, background: "rgba(0,0,0,0.15)" }}
              >
                <AnimatePresence mode="wait">
                  {isCopied ? (
                    <motion.div key="c" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Check size={10} color={labelColor} />
                    </motion.div>
                  ) : (
                    <motion.div key="u" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                      <Copy size={10} color={labelColor} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Hex code — rotated vertically */}
              <div
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                  fontSize: 8,
                  fontFamily: "'PT Mono', monospace",
                  color: labelColor,
                  letterSpacing: "0.02em",
                  userSelect: "none",
                }}
              >
                {t.color.toUpperCase()}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mobile controls pill (row 1) ────────────────────────────────────────────
interface TaskbarProps {
  trackerCount: number;
  showPalette: boolean;
  onPaletteToggle: () => void;
  onCameraClick: () => void;
  onUploadClick: () => void;
  onTrackerCountChange: (delta: number) => void;
  onExport: () => void;
  onShuffle: () => void;
}

function MobileControlsRow({ trackerCount, showPalette, onPaletteToggle, onCameraClick, onUploadClick, onTrackerCountChange, onShuffle }: TaskbarProps) {
  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.1 }}
      className="flex items-center justify-between"
      style={{
        height: 56,
        borderRadius: 99,
        background: "rgba(252,252,252,0.5)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        padding: "0 14px",
        gap: 6,
      }}
    >
      {/* Palette toggle */}
      <TaskbarBtn
        onClick={onPaletteToggle}
        title="Toggle palette"
        bg={showPalette ? "rgba(128,18,218,0.15)" : "rgba(255,255,255,0.07)"}
        borderColor={showPalette ? "#8012da" : "#4c137a"}
        iconColor="#4c137a"
      >
        <PaletteIcon active={showPalette} />
      </TaskbarBtn>

      {/* Source */}
      <TaskbarBtn onClick={onCameraClick} title="Live camera" bg="#25900f" borderColor="#155e07" iconColor="#fff">
        <Camera size={17} />
      </TaskbarBtn>
      <TaskbarBtn onClick={onUploadClick} title="Upload photo" bg="#8012da" borderColor="#4c137a" iconColor="#fff">
        <ImageIcon size={17} />
      </TaskbarBtn>

      {/* Stepper */}
      <TaskbarBtn onClick={() => onTrackerCountChange(-1)} disabled={trackerCount <= 3} title="Fewer" small bg="rgba(255,255,255,0.07)" borderColor="#4c137a" iconColor="#4c137a">
        <Minus size={13} />
      </TaskbarBtn>
      <span className="font-black tabular-nums text-center select-none" style={{ width: 18, fontSize: 14, color: "#4c137a" }}>
        {trackerCount}
      </span>
      <TaskbarBtn onClick={() => onTrackerCountChange(1)} disabled={trackerCount >= 10} title="More" small bg="rgba(255,255,255,0.07)" borderColor="#4c137a" iconColor="#4c137a">
        <Plus size={13} />
      </TaskbarBtn>

      {/* Shuffle */}
      <TaskbarBtn onClick={onShuffle} title="Shuffle" bg="rgba(255,255,255,0.07)" borderColor="#4c137a" iconColor="#4c137a">
        <Shuffle size={17} />
      </TaskbarBtn>
    </motion.div>
  );
}

// ─── Desktop floating taskbar ─────────────────────────────────────────────────
function DesktopTaskbar({ trackerCount, onCameraClick, onUploadClick, onTrackerCountChange, onExport, onShuffle }: TaskbarProps) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 26, delay: 0.2 }}
      className="flex items-center gap-4"
      style={{
        height: TASKBAR_HEIGHT,
        borderRadius: 99,
        background: "rgba(252,252,252,0.5)",
        backdropFilter: "blur(24px)",
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        padding: "0 17px",
      }}
    >
      <div className="flex items-center gap-1.5">
        <TaskbarBtn onClick={onCameraClick} title="Live camera" bg="#25900f" borderColor="#155e07" iconColor="#fff">
          <Camera size={18} />
        </TaskbarBtn>
        <TaskbarBtn onClick={onUploadClick} title="Upload photo" bg="#8012da" borderColor="#4c137a" iconColor="#fff">
          <ImageIcon size={18} />
        </TaskbarBtn>
      </div>

      <div className="flex items-center gap-1.5">
        <TaskbarBtn onClick={() => onTrackerCountChange(-1)} disabled={trackerCount <= 3} title="Fewer" small bg="rgba(255,255,255,0.07)" borderColor="#4c137a" iconColor="#4c137a">
          <Minus size={14} />
        </TaskbarBtn>
        <span className="font-black tabular-nums text-center select-none" style={{ width: 22, fontSize: 15, color: "#4c137a" }}>
          {trackerCount}
        </span>
        <TaskbarBtn onClick={() => onTrackerCountChange(1)} disabled={trackerCount >= 10} title="More" small bg="rgba(255,255,255,0.07)" borderColor="#4c137a" iconColor="#4c137a">
          <Plus size={14} />
        </TaskbarBtn>
      </div>

      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.94 }}
        onClick={onExport}
        className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-white text-sm"
        style={{ background: "#8012da", border: "1.5px solid #4c137a", boxShadow: "0 2px 12px rgba(128,18,218,0.35)" }}
      >
        <Download size={15} />
        Export Palette
      </motion.button>

      <TaskbarBtn onClick={onShuffle} title="Shuffle" bg="rgba(255,255,255,0.07)" borderColor="#4c137a" iconColor="#4c137a">
        <Shuffle size={18} />
      </TaskbarBtn>
    </motion.div>
  );
}

// ─── Shared icon button ───────────────────────────────────────────────────────
function TaskbarBtn({
  children, onClick, disabled = false, title, small = false,
  bg = "rgba(255,255,255,0.07)", borderColor = "transparent", iconColor = "#fff",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  small?: boolean;
  bg?: string;
  borderColor?: string;
  iconColor?: string;
}) {
  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.1 }}
      whileTap={disabled ? {} : { scale: 0.88 }}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex items-center justify-center rounded-full transition-all disabled:opacity-30 shrink-0"
      style={{
        width: small ? 28 : 36,
        height: small ? 28 : 36,
        background: bg,
        color: iconColor,
        border: `1.5px solid ${borderColor}`,
      }}
    >
      {children}
    </motion.button>
  );
}

// ─── Palette toggle icon (concentric circles) ─────────────────────────────────
function PaletteIcon({ active }: { active: boolean }) {
  const color = active ? "#8012da" : "#4c137a";
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7.5" stroke={color} strokeWidth="1.5" />
      <circle cx="9" cy="9" r="4" stroke={color} strokeWidth="1.5" />
      <circle cx="9" cy="9" r="1.2" fill={color} />
    </svg>
  );
}
