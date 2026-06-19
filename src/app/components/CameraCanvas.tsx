import { useRef, useState, useEffect, useCallback } from "react";
import { AlertTriangle, Camera } from "lucide-react";
import { motion } from "motion/react";

const FALLBACK_CAMERA_URL =
  "https://images.unsplash.com/photo-1490735891913-40897cdaafd1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const FALLBACK_PHOTO_URL =
  "https://images.unsplash.com/photo-1600104197373-c07cc35e4f61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

export type Source = "camera" | "photo";

interface TrackerPosition {
  id: string;
  x: number;
  y: number;
}

interface CameraCanvasProps {
  source: Source;
  imageObjectUrl: string | null;
  trackerPositions: TrackerPosition[];
  onColorsUpdate: (colorMap: Record<string, string>) => void;
  /** Increment this to trigger a new getUserMedia call (0 = never auto-request) */
  cameraRequestTrigger: number;
  onCameraRequest?: () => void;
  children?: React.ReactNode;
}

export function CameraCanvas({
  source,
  imageObjectUrl,
  trackerPositions,
  onColorsUpdate,
  cameraRequestTrigger,
  onCameraRequest,
  children,
}: CameraCanvasProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const offscreenCanvas = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);

  const [cameraState, setCameraState] = useState<"idle" | "requesting" | "active" | "denied">("idle");
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [isImgLoaded, setIsImgLoaded] = useState(false);

  // Stable refs so the sampling loop always has fresh data
  const trackerPositionsRef = useRef(trackerPositions);
  const onColorsUpdateRef = useRef(onColorsUpdate);
  const isVideoReadyRef = useRef(isVideoReady);
  const isImgLoadedRef = useRef(isImgLoaded);
  const sourceRef = useRef(source);

  useEffect(() => {
    trackerPositionsRef.current = trackerPositions;
    // In photo mode, re-sample whenever pins move (drag). Camera mode uses the rAF loop.
    if (source === "photo" && isImgLoadedRef.current) {
      sampleRef.current();
    }
  }, [trackerPositions, source]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onColorsUpdateRef.current = onColorsUpdate; }, [onColorsUpdate]);
  useEffect(() => { isVideoReadyRef.current = isVideoReady; }, [isVideoReady]);
  useEffect(() => { isImgLoadedRef.current = isImgLoaded; }, [isImgLoaded]);
  useEffect(() => { sourceRef.current = source; }, [source]);

  // Ensure offscreen canvas exists
  const getOffscreenCanvas = useCallback(() => {
    if (!offscreenCanvas.current) {
      offscreenCanvas.current = document.createElement("canvas");
    }
    return offscreenCanvas.current;
  }, []);

  // Core pixel-sampling function
  const performSample = useCallback(() => {
    const positions = trackerPositionsRef.current;
    const src = sourceRef.current;
    if (positions.length === 0) return;

    const canvas = getOffscreenCanvas();
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let mediaEl: HTMLVideoElement | HTMLImageElement | null = null;
    // Visible crop of the natural media for object-cover display
    let srcX = 0, srcY = 0, srcW = 0, srcH = 0;

    const coverRegion = (nw: number, nh: number, dw: number, dh: number) => {
      const scale = Math.max(dw / nw, dh / nh);
      const vw = dw / scale, vh = dh / scale;
      return { srcX: (nw - vw) / 2, srcY: (nh - vh) / 2, srcW: vw, srcH: vh };
    };

    if (src === "camera" && isVideoReadyRef.current && videoRef.current) {
      const v = videoRef.current;
      if (v.readyState >= 2 && v.videoWidth > 0) {
        mediaEl = v;
        const dw = v.clientWidth || v.videoWidth, dh = v.clientHeight || v.videoHeight;
        ({ srcX, srcY, srcW, srcH } = coverRegion(v.videoWidth, v.videoHeight, dw, dh));
      }
    } else if (isImgLoadedRef.current && imgRef.current) {
      const img = imgRef.current;
      if (img.naturalWidth > 0) {
        mediaEl = img;
        const dw = img.clientWidth || img.naturalWidth, dh = img.clientHeight || img.naturalHeight;
        ({ srcX, srcY, srcW, srcH } = coverRegion(img.naturalWidth, img.naturalHeight, dw, dh));
      }
    }

    console.log("[tono] performSample", {
      src,
      mediaEl: mediaEl ? mediaEl.tagName : "null",
      srcX: Math.round(srcX), srcY: Math.round(srcY),
      srcW: Math.round(srcW), srcH: Math.round(srcH),
      naturalW: mediaEl instanceof HTMLImageElement ? mediaEl.naturalWidth : (mediaEl as HTMLVideoElement | null)?.videoWidth,
      clientW: mediaEl instanceof HTMLImageElement ? (mediaEl as HTMLImageElement).clientWidth : (mediaEl as HTMLVideoElement | null)?.clientWidth,
      isImgLoaded: isImgLoadedRef.current,
    });

    if (!mediaEl || !srcW || !srcH) { console.warn("[tono] bail: no media or zero src dims"); return; }

    const w = Math.round(srcW), h = Math.round(srcH);

    try {
      canvas.width = w;
      canvas.height = h;
      // Draw only the visible (object-cover) crop — tracker % coords now match display
      ctx.drawImage(mediaEl, srcX, srcY, srcW, srcH, 0, 0, w, h);

      const colorMap: Record<string, string> = {};
      for (const t of positions) {
        const cx = Math.max(0, Math.min(w - 1, Math.floor((t.x / 100) * w)));
        const cy = Math.max(0, Math.min(h - 1, Math.floor((t.y / 100) * h)));
        const r = 5; // sample radius
        const x1 = Math.max(0, cx - r), y1 = Math.max(0, cy - r);
        const x2 = Math.min(w - 1, cx + r), y2 = Math.min(h - 1, cy + r);
        const imgData = ctx.getImageData(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
        let rSum = 0, gSum = 0, bSum = 0;
        const count = imgData.data.length / 4;
        for (let i = 0; i < imgData.data.length; i += 4) {
          rSum += imgData.data[i];
          gSum += imgData.data[i + 1];
          bSum += imgData.data[i + 2];
        }
        const toHex = (n: number) =>
          Math.round(n / count).toString(16).padStart(2, "0");
        colorMap[t.id] = `#${toHex(rSum)}${toHex(gSum)}${toHex(bSum)}`;
      }
      console.log("[tono] colorMap", colorMap);

      onColorsUpdateRef.current(colorMap);
    } catch (err) {
      console.error("[tono] canvas sample error:", err);
    }
  }, [getOffscreenCanvas]);

  // Expose sample trigger for drag events
  // (parent calls onColorsUpdate, so we store sample fn in a ref)
  const sampleRef = useRef(performSample);
  useEffect(() => { sampleRef.current = performSample; }, [performSample]);

  // rAF loop — runs while camera is active (samples ~5fps)
  useEffect(() => {
    if (source !== "camera" || cameraState !== "active") {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    let lastSample = 0;
    const loop = (t: number) => {
      if (t - lastSample > 200) {
        sampleRef.current();
        lastSample = t;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [source, cameraState]);

  // Reset loaded flag whenever the image source changes so the onLoad below
  // always fires a true false→true transition and triggers re-sampling.
  useEffect(() => {
    setIsImgLoaded(false);
  }, [imageObjectUrl]);

  // Sample on photo load
  useEffect(() => {
    if (source === "photo" && isImgLoaded) {
      sampleRef.current();
    }
  }, [source, isImgLoaded, imageObjectUrl]);

  // Stop stream whenever we leave camera mode
  useEffect(() => {
    if (source !== "camera") {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setIsVideoReady(false);
      setCameraState("idle");
    }
  }, [source]);

  // Request camera only when the trigger counter increments (explicit user action)
  useEffect(() => {
    if (source !== "camera" || cameraRequestTrigger === 0) return;

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState("denied");
      return;
    }

    // Stop any previous stream before re-requesting
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsVideoReady(false);
    setCameraState("requesting");

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } },
      })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setCameraState("active");
      })
      .catch(() => {
        setCameraState("denied");
      });

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setIsVideoReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraRequestTrigger]);

  const showVideo = source === "camera" && (cameraState === "active" || cameraState === "requesting");
  const imgSrc =
    source === "camera"
      ? FALLBACK_CAMERA_URL
      : imageObjectUrl ?? FALLBACK_PHOTO_URL;

  return (
    <div className="relative size-full overflow-hidden bg-black">
      {/* Live camera video */}
      <video
        ref={videoRef}
        className="absolute inset-0 size-full object-cover"
        style={{ display: showVideo ? "block" : "none" }}
        autoPlay
        playsInline
        muted
        onCanPlay={() => {
          setIsVideoReady(true);
          // Sample immediately on first ready
          setTimeout(() => sampleRef.current(), 0);
        }}
      />

      {/* Photo / fallback image */}
      <img
        ref={imgRef}
        src={imgSrc}
        alt="Color source"
        // blob: URLs are same-origin and don't support CORS headers; setting
        // crossOrigin on them taints the canvas in Safari causing getImageData
        // to throw. Only set it for remote URLs that actually need CORS.
        crossOrigin={imgSrc.startsWith("blob:") ? undefined : "anonymous"}
        className="absolute inset-0 size-full object-cover"
        style={{ display: showVideo ? "none" : "block" }}
        draggable={false}
        onLoad={() => {
          setIsImgLoaded(true);
          // Sample immediately — mirrors the camera onCanPlay behaviour.
          // rAF ensures the ref update from setIsImgLoaded has been flushed.
          requestAnimationFrame(() => sampleRef.current());
        }}
      />

      {/* Requesting camera overlay */}
      {source === "camera" && cameraState === "requesting" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <div className="text-center space-y-3">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="size-12 rounded-full flex items-center justify-center mx-auto"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <Camera size={24} className="text-white" />
            </motion.div>
            <p className="text-white text-sm font-semibold">Requesting camera…</p>
          </div>
        </motion.div>
      )}

      {/* Camera denied notice */}
      {source === "camera" && cameraState === "denied" && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
          <motion.button
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onCameraRequest}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
            style={{
              background: "rgba(0,0,0,0.72)",
              backdropFilter: "blur(12px)",
              color: "rgba(255,200,80,0.95)",
              border: "1px solid rgba(255,200,80,0.3)",
              cursor: "pointer",
            }}
          >
            <AlertTriangle size={12} />
            Camera blocked — tap to enable
          </motion.button>
        </div>
      )}

      {/* LIVE scanning indicator (subtle animated line) */}
      {source === "camera" && cameraState === "active" && (
        <ScanLine />
      )}

      {/* Overlaid children (tracker reticles, etc.) */}
      {children}
    </div>
  );
}

function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 pointer-events-none"
      animate={{ top: ["0%", "100%"] }}
      transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
    >
      <div
        style={{
          height: 60,
          background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.04), transparent)",
        }}
      />
    </motion.div>
  );
}
