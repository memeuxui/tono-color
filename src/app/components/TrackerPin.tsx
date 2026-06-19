import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export interface Tracker {
  id: string;
  x: number;
  y: number;
  color: string;
  name: string;
}

interface TrackerPinProps {
  tracker: Tracker;
  index: number;
  isDragging: boolean;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
}

const OUTER = 52;
const INNER = 38;
const RING = 1.5;
const GAP = (OUTER - INNER) / 2; // 7px gap between outer and inner

export function TrackerPin({ tracker, index, isDragging, onPointerDown }: TrackerPinProps) {
  const [hovered, setHovered] = useState(false);

  const showLabel = isDragging || hovered;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 22, delay: index * 0.07 }}
      className="absolute"
      style={{
        left: `${tracker.x}%`,
        top: `${tracker.y}%`,
        transform: "translate(-50%, -50%)",
        zIndex: isDragging ? 100 : 20 + index,
        touchAction: "none",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
      title="Drag to the color you want"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onPointerDown(e, tracker.id);
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hex label pill — above pin */}
      <AnimatePresence>
        {showLabel && (
          <motion.div
            key="label"
            initial={{ opacity: 0, y: 4, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.88 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            style={{
              position: "absolute",
              bottom: OUTER + 6,
              left: "50%",
              transform: "translateX(-50%)",
              whiteSpace: "nowrap",
              background: "rgba(10,10,18,0.88)",
              backdropFilter: "blur(10px)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.06em",
              padding: "3px 8px",
              borderRadius: 99,
              border: "1px solid rgba(255,255,255,0.18)",
              boxShadow: "0 2px 10px rgba(0,0,0,0.35)",
              pointerEvents: "none",
            }}
          >
            {tracker.color.toUpperCase()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Outer ring */}
      <motion.div
        animate={{
          borderColor: isDragging
            ? "rgba(255,255,255,0.95)"
            : hovered
            ? "rgba(255,255,255,0.75)"
            : "rgba(255,255,255,0.5)",
        }}
        transition={{ duration: 0.15 }}
        style={{
          width: OUTER,
          height: OUTER,
          borderRadius: "50%",
          border: `${RING}px solid rgba(255,255,255,0.6)`,
          background: tracker.color,
          boxShadow: isDragging
            ? `0 0 0 3px rgba(255,255,255,0.15), 0 4px 24px rgba(0,0,0,0.55)`
            : `0 2px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.25)`,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "box-shadow 0.2s ease",
        }}
      >
        {/* Inner squircle — white overlay so crosshair reads against any color */}
        <div
          style={{
            width: INNER,
            height: INNER,
            borderRadius: 10,
            background: "rgba(255,255,255,0.22)",
            border: `${RING}px solid rgba(255,255,255,0.9)`,
            transition: "background 0.22s ease",
          }}
        />

        {/* Crosshair lines (very subtle) */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: GAP,
            bottom: GAP,
            width: 0.75,
            background: "rgba(255,255,255,0.35)",
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: GAP,
            right: GAP,
            height: 0.75,
            background: "rgba(255,255,255,0.35)",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />
      </motion.div>

      {/* Drag pulse ring */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            key="pulse"
            className="absolute rounded-full"
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "easeOut" }}
            style={{
              width: OUTER,
              height: OUTER,
              top: 0,
              left: 0,
              background: tracker.color,
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
