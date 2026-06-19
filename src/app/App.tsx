import { useState, useCallback, useRef } from "react";
import { Toaster } from "sonner";
import { LiveEditor, Source } from "./components/LiveEditor";
import { Tracker } from "./components/TrackerPin";
import { sampleColorFromPosition, getColorName } from "./components/colorUtils";

// ─── Default tracker positions ─────────────────────────────────────────────
const CAMERA_POSITIONS = [
  { x: 20, y: 25 }, { x: 76, y: 18 }, { x: 48, y: 50 },
  { x: 82, y: 72 }, { x: 28, y: 78 }, { x: 58, y: 33 },
  { x: 12, y: 60 }, { x: 65, y: 65 }, { x: 40, y: 84 }, { x: 88, y: 42 },
];
const PHOTO_POSITIONS = [
  { x: 18, y: 22 }, { x: 62, y: 15 }, { x: 42, y: 55 },
  { x: 80, y: 48 }, { x: 25, y: 75 }, { x: 55, y: 32 },
  { x: 75, y: 72 }, { x: 10, y: 50 }, { x: 48, y: 84 }, { x: 86, y: 25 },
];

function makeTracker(id: string, x: number, y: number, source: Source): Tracker {
  const color = sampleColorFromPosition(x, y, source);
  return { id, x, y, color, name: getColorName(color) };
}

function initTrackers(count: number, source: Source): Tracker[] {
  const positions = source === "camera" ? CAMERA_POSITIONS : PHOTO_POSITIONS;
  return positions.slice(0, count).map((p, i) =>
    makeTracker(`t-${source}-${i}-${Date.now()}`, p.x, p.y, source)
  );
}

export default function App() {
  const [source, setSource] = useState<Source>("photo");
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);
  const [trackerCount, setTrackerCount] = useState(5);
  const [trackers, setTrackers] = useState<Tracker[]>(() => initTrackers(5, "photo"));
  // Incremented each time the user explicitly requests camera access
  const [cameraRequestTrigger, setCameraRequestTrigger] = useState(0);

  // Keep a ref to previous imageObjectUrl to clean up blob URLs
  const prevImageUrl = useRef<string | null>(null);

  const handleColorsUpdate = useCallback((colorMap: Record<string, string>) => {
    setTrackers((prev) =>
      prev.map((t) =>
        colorMap[t.id] !== undefined
          ? { ...t, color: colorMap[t.id], name: getColorName(colorMap[t.id]) }
          : t
      )
    );
  }, []);

  const handleTrackerDrag = useCallback(
    (id: string, x: number, y: number) => {
      setTrackers((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          // Color will be updated by next canvas sample; keep current for now
          return { ...t, x, y };
        })
      );
    },
    []
  );

  const handleShuffle = useCallback(() => {
    setTrackers(initTrackers(trackerCount, source));
  }, [trackerCount, source]);

  const handleTrackerCountChange = useCallback(
    (delta: number) => {
      const next = Math.max(3, Math.min(10, trackerCount + delta));
      if (next === trackerCount) return;
      setTrackerCount(next);
      if (next > trackerCount) {
        const positions = source === "camera" ? CAMERA_POSITIONS : PHOTO_POSITIONS;
        const extras = positions.slice(trackerCount, next).map((p, i) =>
          makeTracker(`t-extra-${i + trackerCount}-${Date.now()}`, p.x, p.y, source)
        );
        setTrackers((prev) => [...prev, ...extras]);
      } else {
        setTrackers((prev) => prev.slice(0, next));
      }
    },
    [trackerCount, source]
  );

  const handleSourceSwitch = useCallback(
    (newSource: Source) => {
      setSource(newSource);
      setTrackers(initTrackers(trackerCount, newSource));
      if (newSource === "camera") {
        setImageObjectUrl(null);
        // Increment trigger — this is the explicit user action that fires getUserMedia
        setCameraRequestTrigger((n) => n + 1);
      }
    },
    [trackerCount]
  );

  const handleUpload = useCallback(
    (url: string) => {
      // Revoke previous blob URL
      if (prevImageUrl.current) URL.revokeObjectURL(prevImageUrl.current);
      prevImageUrl.current = url;

      setImageObjectUrl(url);
      setSource("photo");
      setTrackers(initTrackers(trackerCount, "photo"));
    },
    [trackerCount]
  );

  return (
    <div
      className="size-full overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
    >
      <LiveEditor
        source={source}
        imageObjectUrl={imageObjectUrl}
        trackers={trackers}
        trackerCount={trackerCount}
        cameraRequestTrigger={cameraRequestTrigger}
        onColorsUpdate={handleColorsUpdate}
        onTrackerDrag={handleTrackerDrag}
        onShuffle={handleShuffle}
        onTrackerCountChange={handleTrackerCountChange}
        onSourceSwitch={handleSourceSwitch}
        onUpload={handleUpload}
      />

      <Toaster
        position="top-center"
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(14,14,24,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff",
            backdropFilter: "blur(16px)",
            borderRadius: 14,
            fontFamily: "'Plus Jakarta Sans', system-ui",
          },
        }}
      />
    </div>
  );
}
