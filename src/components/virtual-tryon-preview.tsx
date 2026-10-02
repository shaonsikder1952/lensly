import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "../lib/i18n";
import { useFaceLandmarker } from "../hooks/use-face-landmarker";
import type { FaceDetectionResult } from "../hooks/use-face-landmarker";
import { measureLensGeometry, DEFAULT_LENS_GEOMETRY } from "../lib/lens-geometry";
import type { LensGeometry } from "../lib/lens-geometry";
import { FrameStudioModal } from "./frame-studio-modal";
import {
  Camera,
  Glasses,
  Upload,
  RotateCcw,
  ShieldCheck,
  Check,
  Minus,
  Plus,
  Maximize2,
  Minimize2,
  Download,
  X,
  ChevronRight,
  Image as ImageIcon,
  Video,
  Loader2,
  ScanFace,
  Move,
  Trash2,
  Sparkles,
  Sliders,
  Eraser,
  AlertCircle,
} from "lucide-react";

export interface VirtualTryOnProps {
  onOpenFrameModal?: () => void;
}

export interface FrameModel {
  id: string;
  name: string;
  category: string;
  color: string;
  type: "builtin" | "custom";
  lensWidth: number;
  bridgeWidth: number;
  templeLength: number;
  image?: string;
  thumb?: string;
  customDataUrl?: string;
  rawUploadedUrl?: string;
}

const DEFAULT_FRAMES: FrameModel[] = [
  {
    id: "classic-acetate",
    name: "The Classic Acetate",
    category: "Handcrafted Havana",
    color: "#5A3825",
    type: "builtin",
    lensWidth: 50,
    bridgeWidth: 20,
    templeLength: 142,
    image: "/tryon/classic-acetate.png?v=v2",
    thumb: "/tryon/thumb_classic-acetate.png?v=v2",
  },
  {
    id: "modern-gold",
    name: "The Modern Gold",
    category: "Stainless Steel Wireframe",
    color: "#D4AF37",
    type: "builtin",
    lensWidth: 51,
    bridgeWidth: 19,
    templeLength: 145,
    image: "/tryon/modern-gold.png?v=v2",
    thumb: "/tryon/thumb_modern-gold.png?v=v2",
  },
  {
    id: "bold-black",
    name: "The Bold Black",
    category: "Polished Onyx Wayfarer",
    color: "#18181B",
    type: "builtin",
    lensWidth: 52,
    bridgeWidth: 18,
    templeLength: 145,
    image: "/tryon/bold-black.png?v=v2",
    thumb: "/tryon/thumb_bold-black.png?v=v2",
  },
  {
    id: "crystal-clear",
    name: "The Crystal Clear",
    category: "Transparent TR90",
    color: "#94A3B8",
    type: "builtin",
    lensWidth: 50,
    bridgeWidth: 19,
    templeLength: 140,
    image: "/tryon/crystal-clear.png?v=v2",
    thumb: "/tryon/thumb_crystal-clear.png?v=v2",
  },
  {
    id: "vintage-tortoise",
    name: "The Vintage Tortoise",
    category: "Keyhole Acetate · Amber",
    color: "#B45309",
    type: "builtin",
    lensWidth: 49,
    bridgeWidth: 21,
    templeLength: 145,
    image: "/tryon/vintage-tortoise.png?v=v2",
    thumb: "/tryon/thumb_vintage-tortoise.png?v=v2",
  },
  {
    id: "minimalist-silver",
    name: "The Minimalist Silver",
    category: "Brushed Platinum Steel",
    color: "#94A3B8",
    type: "builtin",
    lensWidth: 48,
    bridgeWidth: 20,
    templeLength: 145,
    image: "/tryon/minimalist-silver.png?v=v2",
    thumb: "/tryon/thumb_minimalist-silver.png?v=v2",
  },
  {
    id: "chic-cateye",
    name: "The Chic Cat-Eye",
    category: "Gloss Acetate Silhouette",
    color: "#0F172A",
    type: "builtin",
    lensWidth: 53,
    bridgeWidth: 17,
    templeLength: 140,
    image: "/tryon/chic-cateye.png?v=v2",
    thumb: "/tryon/thumb_chic-cateye.png?v=v2",
  },
  {
    id: "clear-peach",
    name: "The Clear Peach",
    category: "Crystal TR90 Champagne",
    color: "#FDBA74",
    type: "builtin",
    lensWidth: 50,
    bridgeWidth: 19,
    templeLength: 142,
    image: "/tryon/clear-peach.png?v=v2",
    thumb: "/tryon/thumb_clear-peach.png?v=v2",
  },
  {
    id: "retro-aviator",
    name: "The Retro Aviator",
    category: "Stainless Steel Aviator",
    color: "#64748B",
    type: "builtin",
    lensWidth: 55,
    bridgeWidth: 16,
    templeLength: 145,
    image: "/tryon/retro-aviator.png?v=v2",
    thumb: "/tryon/thumb_retro-aviator.png?v=v2",
  },
  {
    id: "gunmetal-square",
    name: "The Gunmetal Square",
    category: "Gunmetal Titanium Alloy",
    color: "#334155",
    type: "builtin",
    lensWidth: 54,
    bridgeWidth: 18,
    templeLength: 145,
    image: "/tryon/gunmetal-square.png?v=v2",
    thumb: "/tryon/thumb_gunmetal-square.png?v=v2",
  },
];

const PRESET_MODELS = [
  { id: "jonas", label: "Model Jonas", src: "/jonas-schmidt.png" },
  { id: "sarah", label: "Model Sarah", src: "/sarah-lindner.png" },
];

// ============================================================================
// Load high-resolution transparent PNG frame image into HTMLImageElement
// ============================================================================
function loadFrameImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.warn("Failed to load frame image:", src);
      resolve(null);
    };
    img.src = src;
  });
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VirtualTryOnPreview({ onOpenFrameModal }: VirtualTryOnProps) {
  const { t } = useLanguage();
  const faceLandmarker = useFaceLandmarker();

  // Source mode: preset model vs user photo vs live webcam
  const [sourceMode, setSourceMode] = useState<"preset" | "photo" | "camera">("preset");
  const [selectedModel, setSelectedModel] = useState<string>(PRESET_MODELS[0].src);
  const [uploadedUserPhoto, setUploadedUserPhoto] = useState<string | null>(null);

  // Frames state - all 10 signature models from /frames
  const [frames, setFrames] = useState<FrameModel[]>(DEFAULT_FRAMES);
  const [activeFrameId, setActiveFrameId] = useState<string>("classic-acetate");

  // Calibration: Pupillary distance, Scale, Bridge offset, and drag offset
  const [pdMm, setPdMm] = useState<number>(62);
  const [scaleFactor, setScaleFactor] = useState<number>(1.0);
  const [bridgeOffset, setBridgeOffset] = useState<number>(0);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Canvas & render loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number>(0);
  const isDetectingRef = useRef(false);
  const lastResultRef = useRef<FaceDetectionResult | null>(null);
  const lastFaceDetectedRef = useRef<boolean>(false);
  // Ref to track if camera render loop should be running
  const cameraLoopActiveRef = useRef(false);

  // Face detection results
  const [faceDetected, setFaceDetected] = useState(false);
  const [staticDetection, setStaticDetection] = useState<FaceDetectionResult | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // Cached frame images (Map<frameId, HTMLImageElement>)
  const frameImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const [frameImagesReady, setFrameImagesReady] = useState(false);

  // Lens geometry per frame (Map<frameId, LensGeometry>)
  const frameGeoRef = useRef<Map<string, LensGeometry>>(new Map());
  // pdMm ref for camera loop
  const pdMmRef = useRef(pdMm);

  // Fullscreen & snapshot modal
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [uploadSuccessToast, setUploadSuccessToast] = useState<string | null>(null);

  // File input refs
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const frameInputRef = useRef<HTMLInputElement | null>(null);

  // Background image element
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  const [bgLoaded, setBgLoaded] = useState(false);

  // Cached canvas dimensions (updated via ResizeObserver, NOT layout reads per frame)
  const canvasDimsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const activeFrame = frames.find((f) => f.id === activeFrameId) || frames[0];
  useEffect(() => { pdMmRef.current = pdMm; }, [pdMm]);

  // ==========================================================================
  // Refs for values needed inside the camera render loop to avoid stale closures
  // ==========================================================================
  const activeFrameIdRef = useRef(activeFrameId);
  const scaleFactorRef = useRef(scaleFactor);
  const bridgeOffsetRef = useRef(bridgeOffset);
  const dragOffsetRef = useRef(dragOffset);
  const faceLandmarkerRef = useRef(faceLandmarker);

  // Keep refs in sync with state
  useEffect(() => { activeFrameIdRef.current = activeFrameId; }, [activeFrameId]);
  useEffect(() => { scaleFactorRef.current = scaleFactor; }, [scaleFactor]);
  useEffect(() => { bridgeOffsetRef.current = bridgeOffset; }, [bridgeOffset]);
  useEffect(() => { dragOffsetRef.current = dragOffset; }, [dragOffset]);
  useEffect(() => { faceLandmarkerRef.current = faceLandmarker; }, [faceLandmarker]);

  // =========================================================================
  // Initialize MediaPipe Face Landmarker
  // =========================================================================
  useEffect(() => {
    faceLandmarker.initialize();
  }, []);

  // =========================================================================
  // Pre-load built-in transparent photorealistic frame PNGs into cache
  // =========================================================================
  useEffect(() => {
    let cancelled = false;
    const cache = frameImagesRef.current;

    async function loadAllFrames() {
      for (const f of DEFAULT_FRAMES) {
        if (cache.has(f.id)) continue;
        const img = await loadFrameImage(f.image || `/tryon/${f.id}.png`);
        if (img && !cancelled) {
          cache.set(f.id, img);
          // Measure lens holes once on load — used by placeGlasses()
          frameGeoRef.current.set(f.id, measureLensGeometry(img));
        }
      }
      if (!cancelled) {
        setFrameImagesReady(true);
      }
    }

    loadAllFrames();
    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================================
  // Load background image (preset model photo or user uploaded selfie)
  // =========================================================================
  useEffect(() => {
    if (sourceMode === "camera") return;

    const src = sourceMode === "photo" && uploadedUserPhoto ? uploadedUserPhoto : selectedModel;
    setBgLoaded(false);
    setStaticDetection(null);
    setFaceDetected(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      bgImageRef.current = img;
      setBgLoaded(true);
    };
    img.onerror = () => {
      console.warn(`[VirtualTryOn] Failed to load background image: ${src}`);
      // Fallback: draw clean neutral portrait silhouette canvas so canvas is never blank
      const fallbackCanvas = document.createElement("canvas");
      fallbackCanvas.width = 800;
      fallbackCanvas.height = 1000;
      const fCtx = fallbackCanvas.getContext("2d");
      if (fCtx) {
        const grad = fCtx.createLinearGradient(0, 0, 0, 1000);
        grad.addColorStop(0, "#1e293b");
        grad.addColorStop(1, "#0f172a");
        fCtx.fillStyle = grad;
        fCtx.fillRect(0, 0, 800, 1000);
        fCtx.fillStyle = "#334155";
        fCtx.beginPath();
        fCtx.arc(400, 420, 175, 0, Math.PI * 2);
        fCtx.fill();
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          bgImageRef.current = fallbackImg;
          setBgLoaded(true);
        };
        fallbackImg.src = fallbackCanvas.toDataURL();
      }
    };
    img.src = src;
  }, [sourceMode, selectedModel, uploadedUserPhoto]);

  // =========================================================================
  // Run Face Detection on static photo once image & model are ready
  // =========================================================================
  useEffect(() => {
    if (sourceMode === "camera" || !bgImageRef.current || !bgLoaded) return;

    if (faceLandmarker.isReady) {
      setIsProcessingPhoto(true);
      faceLandmarker
        .detectImage(bgImageRef.current, 1.0)
        .then((result) => {
          setStaticDetection(result);
          setFaceDetected(!!result);
        })
        .finally(() => {
          setIsProcessingPhoto(false);
        });
    }
  }, [bgLoaded, faceLandmarker.isReady, sourceMode, selectedModel, uploadedUserPhoto]);

  // =========================================================================
  // Retrieve the active frame HTMLImageElement
  // =========================================================================
  const getFrameImage = useCallback((): HTMLImageElement | null => {
    const cached = frameImagesRef.current.get(activeFrame.id);
    return cached && cached.complete ? cached : null;
  }, [activeFrame.id]);

  // Get frame image by ID (for camera loop which reads from ref)
  const getFrameImageById = useCallback((frameId: string): HTMLImageElement | null => {
    const cached = frameImagesRef.current.get(frameId);
    return cached && cached.complete ? cached : null;
  }, []);

  // =========================================================================
  // Place glasses helper — computes frame rect from lens geometry + detection
  // =========================================================================
  function placeGlasses(a: {
    g: FaceDetectionResult["glasses"]; geo: LensGeometry; imgAspect: number;
    centerDistMm: number; pdMmVal: number; scaleF: number;
    scaleX: number; scaleY: number; cropX: number; cropY: number;
    canvasW: number; mirror: boolean; offX: number; offY: number;
  }) {
    // screen px per real mm = (detected IPD in px, scaled to canvas) / user's PD in mm
    const pxPerMm = (a.g.width * a.scaleX) / a.pdMmVal;
    const w = ((pxPerMm * a.centerDistMm) / a.geo.distRatio) * a.scaleF;
    const h = w * a.imgAspect;
    const px = (a.g.centerX - a.cropX) * a.scaleX;
    return {
      cx: (a.mirror ? a.canvasW - px : px) + a.offX,
      cy: (a.g.centerY - a.cropY) * a.scaleY + a.offY,
      angle: a.mirror ? -a.g.angle : a.g.angle,
      w, h, dx: -w * a.geo.midX, dy: -h * a.geo.midY,
    };
  }

  // =========================================================================
  // Authentic Frame Material Styling (Exact RGB matches to Signature Models)
  // =========================================================================
  interface FrameMaterialStyle {
    type: "metal-wire" | "acetate" | "crystal" | "tortoise";
    armColor: string;
    highlightColor: string;
    baseWidth: number; // Arm thickness in pixels (relative to frame scale)
    isTranslucent?: boolean;
    wireCoreColor?: string;
  }

  const FRAME_MATERIALS: Record<string, FrameMaterialStyle> = {
    "classic-acetate": {
      type: "acetate",
      armColor: "#965631",
      highlightColor: "rgba(255, 235, 215, 0.45)",
      baseWidth: 3.6,
    },
    "modern-gold": {
      type: "metal-wire",
      armColor: "#ccb597",
      highlightColor: "rgba(255, 250, 240, 0.65)",
      baseWidth: 2.2,
    },
    "bold-black": {
      type: "acetate",
      armColor: "#2d2e2e",
      highlightColor: "rgba(255, 255, 255, 0.35)",
      baseWidth: 4.2,
    },
    "crystal-clear": {
      type: "crystal",
      armColor: "rgba(146, 140, 134, 0.50)",
      highlightColor: "rgba(255, 255, 255, 0.75)",
      baseWidth: 3.4,
      isTranslucent: true,
      wireCoreColor: "#b8b6b0",
    },
    "vintage-tortoise": {
      type: "tortoise",
      armColor: "#bf752d",
      highlightColor: "rgba(255, 230, 190, 0.50)",
      baseWidth: 3.8,
    },
    "minimalist-silver": {
      type: "metal-wire",
      armColor: "#b8b6b0",
      highlightColor: "rgba(255, 255, 255, 0.75)",
      baseWidth: 2.0,
    },
    "chic-cateye": {
      type: "acetate",
      armColor: "#2b2b2a",
      highlightColor: "rgba(255, 255, 255, 0.40)",
      baseWidth: 3.2,
    },
    "clear-peach": {
      type: "crystal",
      armColor: "rgba(200, 173, 151, 0.50)",
      highlightColor: "rgba(255, 245, 235, 0.75)",
      baseWidth: 3.4,
      isTranslucent: true,
      wireCoreColor: "#ccb597",
    },
    "retro-aviator": {
      type: "metal-wire",
      armColor: "#9f9d99",
      highlightColor: "rgba(255, 255, 255, 0.65)",
      baseWidth: 2.2,
    },
    "gunmetal-square": {
      type: "metal-wire",
      armColor: "#787775",
      highlightColor: "rgba(255, 255, 255, 0.50)",
      baseWidth: 2.4,
    },
  };

  const DEFAULT_FRAME_MATERIAL: FrameMaterialStyle = {
    type: "acetate",
    armColor: "#475569",
    highlightColor: "rgba(255, 255, 255, 0.40)",
    baseWidth: 3.2,
  };

  /**
   * Draw a realistic, delicate curved temple arm connecting frame hinge to ear
   */
  function drawTempleArm(
    ctx: CanvasRenderingContext2D,
    hinge: { x: number; y: number },
    ear: { x: number; y: number },
    temple: { x: number; y: number } | null,
    frameId: string,
    side: "left" | "right",
    frameScale: number,
    opacity: number,
    enableShadow: boolean
  ) {
    if (opacity <= 0.02) return;
    const mat = FRAME_MATERIALS[frameId] || DEFAULT_FRAME_MATERIAL;
    const armW = Math.max(1.5, mat.baseWidth * frameScale);
    const hookDir = side === "left" ? -1 : 1;

    // Eyeglasses rest at the superior auricular sulcus (ear root) ~8-12px above tragus
    const earY = ear.y - 8 * frameScale;
    const earX = ear.x;

    // Natural temple curve control point along the side of the head:
    let midX: number;
    let midY: number;
    if (temple) {
      midX = hinge.x * 0.35 + temple.x * 0.35 + earX * 0.3;
      midY = hinge.y * 0.35 + (temple.y - 4 * frameScale) * 0.35 + earY * 0.3;
    } else {
      midX = (hinge.x + earX) / 2;
      midY = Math.min(hinge.y, earY) - 4 * frameScale;
    }

    // Gentle short ear hook behind top curve of the ear
    const hookCtrlX = earX + hookDir * 4 * frameScale;
    const hookCtrlY = earY + 6 * frameScale;
    const hookEndX = earX + hookDir * 8 * frameScale;
    const hookEndY = earY + 14 * frameScale;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

    // 1. Soft skin ambient shadow (subtle drop shadow on side of head)
    if (enableShadow) {
      ctx.save();
      ctx.strokeStyle = "rgba(0, 0, 0, 0.14)";
      ctx.lineWidth = armW + 1.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.shadowColor = "rgba(0, 0, 0, 0.20)";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetY = 1.5;
      ctx.beginPath();
      ctx.moveTo(hinge.x, hinge.y);
      ctx.quadraticCurveTo(midX, midY + 1, earX, earY + 1);
      ctx.quadraticCurveTo(hookCtrlX, hookCtrlY + 1, hookEndX, hookEndY + 1);
      ctx.stroke();
      ctx.restore();
    }

    // 2. Main Arm Body (authentic material color matching frame)
    ctx.save();
    ctx.lineWidth = armW;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = mat.armColor;
    ctx.beginPath();
    ctx.moveTo(hinge.x, hinge.y);
    ctx.quadraticCurveTo(midX, midY, earX, earY);
    ctx.quadraticCurveTo(hookCtrlX, hookCtrlY, hookEndX, hookEndY);
    ctx.stroke();
    ctx.restore();

    // 3. Inner metal core wire (for crystal / transparent models)
    if (mat.isTranslucent && mat.wireCoreColor) {
      ctx.save();
      ctx.lineWidth = Math.max(0.9, armW * 0.40);
      ctx.strokeStyle = mat.wireCoreColor;
      ctx.beginPath();
      ctx.moveTo(hinge.x, hinge.y);
      ctx.quadraticCurveTo(midX, midY, earX, earY);
      ctx.quadraticCurveTo(hookCtrlX, hookCtrlY, hookEndX - hookDir * 2 * frameScale, hookEndY - 3 * frameScale);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Subtle top reflection highlight
    ctx.save();
    ctx.lineWidth = Math.max(0.6, armW * 0.35);
    ctx.strokeStyle = mat.highlightColor;
    ctx.beginPath();
    ctx.moveTo(hinge.x, hinge.y - 0.5);
    ctx.quadraticCurveTo(midX, midY - 0.8, earX, earY - 0.6);
    ctx.stroke();
    ctx.restore();

    // 5. Delicate hinge joint at connection
    ctx.save();
    ctx.fillStyle = mat.armColor;
    ctx.beginPath();
    ctx.arc(hinge.x, hinge.y, Math.max(1.4, armW * 0.65), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  /**
   * Unified 3D Glasses Renderer with Clean Perspective & Temple Arms
   */
  function renderGlassesUnified({
    ctx,
    detection,
    frameImg,
    frameId,
    geo,
    frameAspect,
    centerDistMm,
    pdMmVal,
    scaleF,
    scaleX,
    scaleY,
    cropX,
    cropY,
    canvasW,
    canvasH,
    mirror,
    effectiveDragX,
    effectiveBridgeY,
    effectiveDragY,
    enableShadow = true,
  }: {
    ctx: CanvasRenderingContext2D;
    detection: FaceDetectionResult | null;
    frameImg: HTMLImageElement;
    frameId: string;
    geo: LensGeometry;
    frameAspect: number;
    centerDistMm: number;
    pdMmVal: number;
    scaleF: number;
    scaleX: number;
    scaleY: number;
    cropX: number;
    cropY: number;
    canvasW: number;
    canvasH: number;
    mirror: boolean;
    effectiveDragX: number;
    effectiveBridgeY: number;
    effectiveDragY: number;
    enableShadow?: boolean;
  }) {
    if (!detection) {
      // Fallback manual positioning if no face detected
      const w = canvasW * 0.44 * scaleF;
      const h = w * frameAspect;
      const cx = canvasW / 2 + effectiveDragX;
      const cy = canvasH * 0.38 + effectiveBridgeY + effectiveDragY;
      ctx.save();
      ctx.translate(cx, cy);
      if (enableShadow) {
        ctx.shadowColor = "rgba(0,0,0,0.30)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 4;
      }
      ctx.drawImage(frameImg, -w / 2, -h / 2, w, h);
      ctx.restore();
      return;
    }

    // 1. Compute frame position and base dimensions from 3D invariant width
    const placed = placeGlasses({
      g: detection.glasses,
      geo,
      imgAspect: frameAspect,
      centerDistMm,
      pdMmVal,
      scaleF,
      scaleX,
      scaleY,
      cropX,
      cropY,
      canvasW,
      mirror,
      offX: effectiveDragX,
      offY: effectiveBridgeY + effectiveDragY,
    });

    const rawYaw = detection.glasses.yaw || 0;
    // In mirrored webcam view, the apparent turn direction on canvas is flipped
    const effectiveYaw = mirror ? -rawYaw : rawYaw;
    const angle = placed.angle;
    const frameScale = placed.w / 280;

    // Very subtle vertical skew for 3D realism — the near-side lens appears
    // slightly taller than the far-side lens. No horizontal scaling needed
    // because the 2D IPD already naturally foreshortens with head rotation.
    const skewY = Math.sin(effectiveYaw) * 0.06;

    // 2. Map Ears and Temples to canvas coordinates
    const toCanvas = (pt: { x: number; y: number }) => {
      const px = (pt.x - cropX) * scaleX;
      const cx = (mirror ? canvasW - px : px) + effectiveDragX;
      const cy = (pt.y - cropY) * scaleY + effectiveBridgeY + effectiveDragY;
      return { x: cx, y: cy };
    };

    // Landmark 234 is user's anatomical right (image-left). When mirrored, it appears on canvas-RIGHT.
    // Landmark 454 is user's anatomical left (image-right). When mirrored, it appears on canvas-LEFT.
    const earLeft = mirror ? toCanvas(detection.glasses.rightEar) : toCanvas(detection.glasses.leftEar);
    const earRight = mirror ? toCanvas(detection.glasses.leftEar) : toCanvas(detection.glasses.rightEar);
    const templeLeft = mirror ? toCanvas(detection.glasses.rightTemple) : toCanvas(detection.glasses.leftTemple);
    const templeRight = mirror ? toCanvas(detection.glasses.leftTemple) : toCanvas(detection.glasses.rightTemple);

    // 3. Compute Hinge canvas coordinates at the outer edges of the placed frame
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    // Hinge sits at ~48.5% of the frame width from center, at ~20% down from top
    const locLeftX = -placed.w * 0.485;
    const locLeftY = placed.dy + placed.h * 0.20;
    const hingeLeft = {
      x: placed.cx + (locLeftX * cosA - locLeftY * sinA),
      y: placed.cy + (locLeftX * sinA + locLeftY * cosA),
    };

    const locRightX = placed.w * 0.485;
    const locRightY = placed.dy + placed.h * 0.20;
    const hingeRight = {
      x: placed.cx + (locRightX * cosA - locRightY * sinA),
      y: placed.cy + (locRightX * sinA + locRightY * cosA),
    };

    // 4. Temple Arm Visibility & Occlusion
    // effectiveYaw < -0.04: head turned left -> right ear is facing camera (near), left ear is far
    // effectiveYaw > 0.04: head turned right -> left ear is facing camera (near), right ear is far
    let opacityLeft = 0.85;
    let opacityRight = 0.85;
    if (effectiveYaw < -0.04) {
      opacityRight = 1.0;
      opacityLeft = Math.max(0, 1 - (-effectiveYaw - 0.04) / 0.25);
    } else if (effectiveYaw > 0.04) {
      opacityLeft = 1.0;
      opacityRight = Math.max(0, 1 - (effectiveYaw - 0.04) / 0.25);
    }

    // 5. Draw Depth Order:
    // Step A: Far temple arm first (gets occluded by front frame)
    if (effectiveYaw < -0.04) {
      drawTempleArm(ctx, hingeLeft, earLeft, templeLeft, frameId, "left", frameScale, opacityLeft, enableShadow);
      drawTempleArm(ctx, hingeRight, earRight, templeRight, frameId, "right", frameScale, opacityRight, enableShadow);
    } else {
      drawTempleArm(ctx, hingeRight, earRight, templeRight, frameId, "right", frameScale, opacityRight, enableShadow);
      drawTempleArm(ctx, hingeLeft, earLeft, templeLeft, frameId, "left", frameScale, opacityLeft, enableShadow);
    }

    // Step B: Front Frame — draw at placed size with only subtle vertical skew
    ctx.save();
    ctx.translate(placed.cx, placed.cy);
    ctx.rotate(angle);
    // Apply very subtle skew only (no horizontal scale — IPD handles that)
    if (Math.abs(skewY) > 0.005) {
      ctx.transform(1, skewY, 0, 1, 0, 0);
    }

    if (enableShadow) {
      ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
    }

    ctx.drawImage(frameImg, placed.dx, placed.dy, placed.w, placed.h);
    ctx.restore();
  }

  // =========================================================================
  // Draw Glasses on Canvas with Optical Alignment & Manual Tuning
  // =========================================================================
  const drawGlasses = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvasW: number,
      canvasH: number,
      detection: FaceDetectionResult | null,
      srcW: number,
      srcH: number,
      cropX: number,
      cropY: number,
      cropW: number,
      cropH: number,
      mirror: boolean = false
    ) => {
      const frameImg = getFrameImage();
      if (!frameImg) return;

      const geo = frameGeoRef.current.get(activeFrame.id) || DEFAULT_LENS_GEOMETRY;
      const frameAspect = frameImg.naturalHeight / frameImg.naturalWidth;
      const centerDistMm = activeFrame.lensWidth + activeFrame.bridgeWidth;
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const effectiveDragX = dragOffset.x * dpr;
      const effectiveDragY = dragOffset.y * dpr;
      const effectiveBridgeY = bridgeOffset * dpr;
      const scaleX = canvasW / cropW;
      const scaleY = canvasH / cropH;

      renderGlassesUnified({
        ctx,
        detection,
        frameImg,
        frameId: activeFrame.id,
        geo,
        frameAspect,
        centerDistMm,
        pdMmVal: pdMm,
        scaleF: scaleFactor,
        scaleX,
        scaleY,
        cropX,
        cropY,
        canvasW,
        canvasH,
        mirror,
        effectiveDragX,
        effectiveBridgeY,
        effectiveDragY,
        enableShadow: true,
      });
    },
    [getFrameImage, activeFrame, pdMm, scaleFactor, bridgeOffset, dragOffset]
  );

  // =========================================================================
  // Draw Glasses using refs (for camera render loop - avoids stale closures)
  // =========================================================================
  const drawGlassesFromRefs = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      canvasW: number,
      canvasH: number,
      detection: FaceDetectionResult | null,
      srcW: number,
      srcH: number,
      cropX: number,
      cropY: number,
      cropW: number,
      cropH: number,
      mirror: boolean = false
    ) => {
      // In live camera mode, skip drawing when no face is detected
      if (!detection) return;

      const curFrameId = activeFrameIdRef.current;
      const frameImg = getFrameImageById(curFrameId);
      if (!frameImg) return;

      const geo = frameGeoRef.current.get(curFrameId) || DEFAULT_LENS_GEOMETRY;
      const frameAspect = frameImg.naturalHeight / frameImg.naturalWidth;
      const curFrame = frames.find(f => f.id === curFrameId) || frames[0];
      const centerDistMm = curFrame.lensWidth + curFrame.bridgeWidth;

      const currentScaleFactor = scaleFactorRef.current;
      const currentBridgeOffset = bridgeOffsetRef.current;
      const currentDragOffset = dragOffsetRef.current;
      const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
      const effectiveDragX = currentDragOffset.x * dpr;
      const effectiveDragY = currentDragOffset.y * dpr;
      const effectiveBridgeY = currentBridgeOffset * dpr;
      const scaleX = canvasW / cropW;
      const scaleY = canvasH / cropH;

      renderGlassesUnified({
        ctx,
        detection,
        frameImg,
        frameId: curFrameId,
        geo,
        frameAspect,
        centerDistMm,
        pdMmVal: pdMmRef.current,
        scaleF: currentScaleFactor,
        scaleX,
        scaleY,
        cropX,
        cropY,
        canvasW,
        canvasH,
        mirror,
        effectiveDragX,
        effectiveBridgeY,
        effectiveDragY,
        enableShadow: true,
      });
    },
    [getFrameImageById, frames]
  );

  // =========================================================================
  // Draw static frame (photo or preset model with SMART FACE-CENTRIC FRAMING)
  // =========================================================================
  const drawStaticFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !bgImageRef.current) return;

    const bg = bgImageRef.current;

    const container = canvas.parentElement;
    if (container) {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = container.clientWidth * dpr;
      canvas.height = container.clientHeight * dpr;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
    }

    const cw = canvas.width;
    const ch = canvas.height;
    const imgAspect = bg.naturalWidth / bg.naturalHeight;
    const canvasAspect = cw / ch;

    let sx = 0,
      sy = 0,
      sw = bg.naturalWidth,
      sh = bg.naturalHeight;

    // SMART CROP: cover-fill the canvas while keeping the face visible
    if (staticDetection) {
      const g = staticDetection.glasses;

      if (imgAspect < canvasAspect) {
        // Image is taller than canvas aspect (portrait photo)
        // Full width, crop height to match canvas aspect
        sw = bg.naturalWidth;
        sh = sw / canvasAspect;

        // Place eyes at ~38% from top of canvas so face and glasses are centered
        sy = g.centerY - sh * 0.38;

        // Ensure we don't crop beyond image bounds
        sy = Math.max(0, Math.min(bg.naturalHeight - sh, sy));
      } else {
        // Image is wider than canvas aspect (landscape photo)
        // Full height, crop width to match canvas aspect
        sh = bg.naturalHeight;
        sw = sh * canvasAspect;

        // Center horizontally around the eyes
        sx = g.centerX - sw * 0.5;

        // Ensure we don't crop beyond image bounds
        sx = Math.max(0, Math.min(bg.naturalWidth - sw, sx));
      }
    } else {
      // Fallback when no face detected:
      // Use cover-fill strategy that preserves the center of the image
      if (imgAspect < canvasAspect) {
        // Portrait image: full width, crop height from top (keep head visible)
        sw = bg.naturalWidth;
        sh = sw / canvasAspect;
        // Anchor to top so the head is always visible (most selfies have face at top)
        sy = 0;
      } else {
        // Landscape image: full height, crop width from center
        sh = bg.naturalHeight;
        sw = sh * canvasAspect;
        sx = (bg.naturalWidth - sw) / 2;
      }
    }

    ctx.drawImage(bg, sx, sy, sw, sh, 0, 0, cw, ch);

    drawGlasses(ctx, cw, ch, staticDetection, bg.naturalWidth, bg.naturalHeight, sx, sy, sw, sh);
  }, [staticDetection, drawGlasses]);

  // Redraw static frame whenever adjustments change
  useEffect(() => {
    if (sourceMode !== "camera" && bgLoaded && frameImagesReady) {
      drawStaticFrame();
    }
  }, [
    sourceMode,
    bgLoaded,
    frameImagesReady,
    staticDetection,
    activeFrameId,
    drawStaticFrame,
    pdMm,
    scaleFactor,
    bridgeOffset,
    dragOffset,
  ]);

  // =========================================================================
  // Silky-Smooth 60 FPS Live Camera Loop
  // Uses refs for all mutable state to avoid stale closures.
  // Canvas dimensions are updated via ResizeObserver (zero layout reads per frame).
  // =========================================================================
  const startRenderLoop = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    // Mark the loop as active
    cameraLoopActiveRef.current = true;

    // Initial canvas sizing
    const container = canvas.parentElement;
    if (container) {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.round(container.clientWidth * dpr);
      const h = Math.round(container.clientHeight * dpr);
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      canvasDimsRef.current = { w, h };
    }

    // Use ResizeObserver to update canvas dimensions only when container actually resizes
    // This eliminates the #1 performance killer: layout reflow reads every frame
    let resizeObserver: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const cr = entry.contentRect;
          const dpr = window.devicePixelRatio || 1;
          const w = Math.round(cr.width * dpr);
          const h = Math.round(cr.height * dpr);
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
            canvas.style.width = `${cr.width}px`;
            canvas.style.height = `${cr.height}px`;
            canvasDimsRef.current = { w, h };
          }
        }
      });
      resizeObserver.observe(container);
    }

    let lastDetectTime = 0;
    // Check stream health every 60 frames instead of every frame
    let frameCount = 0;

    const render = () => {
      // Exit condition: loop was stopped externally
      if (!cameraLoopActiveRef.current) {
        resizeObserver?.disconnect();
        return;
      }

      const video = videoRef.current;

      // If video isn't available yet, keep retrying
      if (!video) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // If video isn't ready yet (still loading), keep the loop alive
      if (video.videoWidth === 0 || video.videoHeight === 0 || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Check stream health periodically (every ~1 second), not every frame
      frameCount++;
      if (frameCount % 60 === 0) {
        const stream = streamRef.current;
        if (!stream || stream.getVideoTracks().length === 0 || stream.getVideoTracks()[0].readyState === "ended") {
          cameraLoopActiveRef.current = false;
          resizeObserver?.disconnect();
          return;
        }
      }

      // Use cached dimensions (updated by ResizeObserver)
      const cw = canvasDimsRef.current.w || canvas.width;
      const ch = canvasDimsRef.current.h || canvas.height;
      const vw = video.videoWidth;
      const vh = video.videoHeight;

      // Draw mirrored video stream
      ctx.save();
      ctx.translate(cw, 0);
      ctx.scale(-1, 1);

      const videoAspect = vw / vh;
      const canvasAspect = cw / ch;
      let sx = 0,
        sy = 0,
        sw = vw,
        sh = vh;
      if (videoAspect > canvasAspect) {
        sw = vh * canvasAspect;
        sx = (vw - sw) / 2;
      } else {
        sh = vw / canvasAspect;
        sy = (vh - sh) / 2;
      }
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch);
      ctx.restore();

      // Face detection at ~20 FPS (50ms interval) — WASM is heavy, 20 FPS with EMA smoothing looks perfectly smooth
      const fl = faceLandmarkerRef.current;
      if (fl.isReady && video.readyState >= 2 && !isDetectingRef.current) {
        const now = performance.now();
        if (now - lastDetectTime > 50) {
          lastDetectTime = now;
          isDetectingRef.current = true;
          fl.detectVideo(video, now, 1.0)
            .then((result) => {
              lastResultRef.current = result;
              const hasFace = !!result;
              if (hasFace !== lastFaceDetectedRef.current) {
                lastFaceDetectedRef.current = hasFace;
                setFaceDetected(hasFace);
              }
            })
            .catch(() => {})
            .finally(() => {
              isDetectingRef.current = false;
            });
        }
      }

      // Draw glasses overlay using latest smoothed tracked coordinates
      drawGlassesFromRefs(ctx, cw, ch, lastResultRef.current, vw, vh, sx, sy, sw, sh, true);

      animFrameRef.current = requestAnimationFrame(render);
    };

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(render);
  }, [drawGlassesFromRefs]);

  // =========================================================================
  // Camera controls
  // =========================================================================
  const { resetSmoothing } = faceLandmarker;

  const stopCameraStream = useCallback(() => {
    // Stop the render loop
    cameraLoopActiveRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    // Stop all media tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    // Reset video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsStartingCamera(false);
    resetSmoothing();
    lastResultRef.current = null;
    lastFaceDetectedRef.current = false;
  }, [resetSmoothing]);

  // Keep a ref to the latest stopCameraStream to ensure unmount cleanup only runs on actual component unmount
  const stopCameraRef = useRef(stopCameraStream);
  useEffect(() => {
    stopCameraRef.current = stopCameraStream;
  }, [stopCameraStream]);

  // Component unmount cleanup - only runs ONCE when the component unmounts
  useEffect(() => {
    return () => {
      stopCameraRef.current();
    };
  }, []);

  const startCamera = async () => {
    setCameraError("");
    setIsStartingCamera(true);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
        const isLocal =
          typeof window !== "undefined" &&
          (window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1" ||
            window.location.hostname === "[::1]");
        if (!isHttps && !isLocal) {
          setCameraError(
            t("Camera access requires HTTPS or localhost. Please open the site over a secure HTTPS connection.")
          );
        } else {
          setCameraError(t("Camera access is not supported by your browser."));
        }
        setIsStartingCamera(false);
        return;
      }

      // Pre-initialize face landmarker if not yet ready
      if (!faceLandmarker.isReady && !faceLandmarker.isLoading) {
        faceLandmarker.initialize();
      }

      // Request camera with ideal constraints (no min constraints to avoid OverconstrainedError on older devices/webcams)
      let stream: MediaStream;
      try {
        const streamPromise = navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        // Race against a 15-second timeout
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Camera request timed out")), 15000)
        );

        stream = await Promise.race([streamPromise, timeoutPromise]);
      } catch (firstErr: any) {
        // Fallback for devices that don't support width/height constraints
        if (
          firstErr?.name === "OverconstrainedError" ||
          firstErr?.name === "ConstraintNotSatisfiedError"
        ) {
          console.warn("[Camera] Ideal resolution constrained, trying basic facingMode...");
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "user" },
          });
        } else {
          throw firstErr;
        }
      }

      // Check if user navigated away or stopped before stream was ready
      if (!videoRef.current) {
        stream.getTracks().forEach(t => t.stop());
        setIsStartingCamera(false);
        return;
      }

      streamRef.current = stream;
      const video = videoRef.current;

      // Listen for track ending unexpectedly (e.g., user revokes permission, device disconnects)
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          console.warn("[Camera] Video track ended unexpectedly");
          stopCameraStream();
          setSourceMode(uploadedUserPhoto ? "photo" : "preset");
          setCameraError(t("Camera connection lost. Please try again."));
        });
      });

      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      video.muted = true;

      // Wait for video to start playing
      try {
        await video.play();
      } catch (playErr: any) {
        // AbortError is common if play() is interrupted by a quick pause/src change - retry once
        if (playErr?.name === "AbortError") {
          console.warn("[Camera] play() aborted, retrying...");
          await new Promise(r => setTimeout(r, 100));
          try {
            await video.play();
          } catch (retryErr) {
            console.warn("[Camera] play() retry failed:", retryErr);
          }
        } else {
          console.warn("[Camera] Video play error:", playErr);
        }
      }

      const onStreamReady = () => {
        // Double-check stream is still alive
        if (!streamRef.current || streamRef.current.getVideoTracks().every(t => t.readyState === "ended")) {
          console.warn("[Camera] Stream ended before render could start");
          stopCameraStream();
          setCameraError(t("Camera stream ended unexpectedly. Please try again."));
          return;
        }

        setCameraActive(true);
        setSourceMode("camera");
        setDragOffset({ x: 0, y: 0 });
        setBridgeOffset(0);
        setIsStartingCamera(false);
        startRenderLoop();
      };

      // Wait for actual video data
      if (video.readyState >= 2 && video.videoWidth > 0) {
        onStreamReady();
      } else {
        // Use both event listener and polling for maximum reliability
        let resolved = false;
        const resolve = () => {
          if (resolved) return;
          resolved = true;
          video.removeEventListener("loadeddata", resolve);
          onStreamReady();
        };

        video.addEventListener("loadeddata", resolve);

        // Polling fallback with timeout
        let pollCount = 0;
        const maxPolls = 150; // ~5 seconds at 30ms interval
        const pollCheck = () => {
          if (resolved) return;
          pollCount++;
          if (video.readyState >= 2 && video.videoWidth > 0) {
            resolve();
          } else if (pollCount < maxPolls && streamRef.current) {
            requestAnimationFrame(pollCheck);
          } else if (!resolved) {
            // Timeout - stream never became ready
            resolved = true;
            video.removeEventListener("loadeddata", resolve);
            stopCameraStream();
            setCameraError(t("Camera failed to initialize. Please check your camera and try again."));
          }
        };
        requestAnimationFrame(pollCheck);
      }
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setIsStartingCamera(false);

      if (err?.message === "Camera request timed out") {
        setCameraError(
          t("Camera request timed out. Please check your browser permissions and try again.")
        );
      } else {
        const isDenied = err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError";
        setCameraError(
          isDenied
            ? t("Camera permission was denied. Please allow camera access in your browser settings to use live try-on.")
            : t("Camera access was denied or not available. You can continue using our model photos or upload your own photo.")
        );
      }
    }
  };

  const toggleCamera = () => {
    if (cameraActive || isStartingCamera) {
      stopCameraStream();
      setSourceMode(uploadedUserPhoto ? "photo" : "preset");
    } else {
      startCamera();
    }
  };

  // No need to restart render loop on dependency changes since we use refs now!
  // The render loop reads from refs directly, so it always has the latest values.

  // =========================================================================
  // Interactive Drag on Canvas (Fine-tuning Placement)
  // =========================================================================
  const handlePointerDown = (e: React.PointerEvent) => {
    // If clicking on button or interactive control, do not initiate drag or capture pointer
    if ((e.target as HTMLElement).closest("button, a, input, select, textarea")) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragOffset({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // =========================================================================
  // Upload User Portrait / Selfie Photo (Auto-Normalizing for 100% Reliability)
  // =========================================================================
  const handleUserPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawData = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Downscale large smartphone photos (12MP+) to max 1600px
        // This keeps enough resolution for crisp display while being fast for face detection
        const maxDim = 1600;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const normCanvas = document.createElement("canvas");
        normCanvas.width = w;
        normCanvas.height = h;
        const normCtx = normCanvas.getContext("2d");
        normCtx?.drawImage(img, 0, 0, w, h);
        const normalizedDataUrl = normCanvas.toDataURL("image/jpeg", 0.92);

        setUploadedUserPhoto(normalizedDataUrl);
        stopCameraStream();
        setSourceMode("photo");
        setDragOffset({ x: 0, y: 0 });
        setBridgeOffset(0);
        setUploadSuccessToast(t("Photo uploaded! Running face detection..."));
        setTimeout(() => setUploadSuccessToast(null), 3500);
      };
      img.src = rawData;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // =========================================================================
  // Frame Alignment Studio & Custom Glasses Upload Flow
  // Auto-straightens tilt, trims away rear temple arms, and cuts out clear lenses
  // =========================================================================
  const [isFrameStudioOpen, setIsFrameStudioOpen] = useState(false);
  const [studioRawImage, setStudioRawImage] = useState<string | null>(null);
  const [studioFileName, setStudioFileName] = useState<string>("Custom Frame");
  const [editingCustomFrameId, setEditingCustomFrameId] = useState<string | null>(null);

  const handleCustomFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const rawData = ev.target?.result as string;
      setStudioRawImage(rawData);
      setStudioFileName(file.name);
      setEditingCustomFrameId(null);
      setIsFrameStudioOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleApplyStudioFrame = (processedDataUrl: string, name: string) => {
    const frameId = editingCustomFrameId || `custom-${Date.now()}`;
    const customFrame: FrameModel = {
      id: frameId,
      name,
      category: t("Custom Upload"),
      color: "#0F766E",
      type: "custom",
      lensWidth: 52,
      bridgeWidth: 19,
      templeLength: 145,
      customDataUrl: processedDataUrl,
      rawUploadedUrl: studioRawImage || processedDataUrl,
    };

    const frameImg = new Image();
    frameImg.onload = () => {
      frameImagesRef.current.set(frameId, frameImg);
      setFrames((prev) => {
        const filtered = prev.filter((f) => f.id !== frameId);
        return [customFrame, ...filtered];
      });
      setActiveFrameId(frameId);
      setUploadSuccessToast(`${t("Custom frame ready & aligned!")} "${name}"`);
      setTimeout(() => setUploadSuccessToast(null), 4000);
    };
    frameImg.src = processedDataUrl;
  };

  const handleEditCustomFrame = (frame: FrameModel, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!frame.rawUploadedUrl && !frame.customDataUrl) return;
    setStudioRawImage(frame.rawUploadedUrl || frame.customDataUrl || null);
    setStudioFileName(frame.name);
    setEditingCustomFrameId(frame.id);
    setIsFrameStudioOpen(true);
  };

  const removeCustomFrame = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFrames((prev) => prev.filter((f) => f.id !== id));
    frameImagesRef.current.delete(id);
    if (activeFrameId === id) {
      setActiveFrameId("oakley-meta-hstn");
    }
  };


  // =========================================================================
  // Reset Calibration to default
  // =========================================================================
  const resetCalibration = () => {
    setPdMm(62);
    setScaleFactor(1.0);
    setBridgeOffset(0);
    setDragOffset({ x: 0, y: 0 });
  };

  // =========================================================================
  // Capture Snapshot
  // =========================================================================
  const captureSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Draw temporary watermark banner on snapshot
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const cw = canvas.width;
      const ch = canvas.height;
      ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
      const barH = 38;
      ctx.beginPath();
      ctx.roundRect(20, ch - barH - 20, 360, barH, 8);
      ctx.fill();
      ctx.font = "bold 13px sans-serif";
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(`Lensly · ${activeFrame.name} · PD ${pdMm} mm`, 34, ch - 20 - barH / 2 + 5);
    }

    const dataUrl = canvas.toDataURL("image/jpeg", 0.94);
    setSnapshotUrl(dataUrl);
    setIsSnapshotModalOpen(true);

    if (sourceMode !== "camera") drawStaticFrame();
  };

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (sourceMode !== "camera" && bgLoaded) drawStaticFrame();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sourceMode, bgLoaded, drawStaticFrame]);

  // =========================================================================
  // RENDER UI
  // =========================================================================
  return (
    <section id="try-on" className="py-16 md:py-24 border-b border-border/60 bg-muted/10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-primary/10 text-primary font-semibold mb-2.5">
            <Glasses className="w-4 h-4" />
            <span>{t("Virtual Try-On & Digital Measurement")}</span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("Interactive 3D Fit Preview")}
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {t(
              "Test real-time fit with your webcam or upload a photo. Adjust pupillary distance (PD) to match your facial anatomy before lab machining."
            )}
          </p>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUserPhotoUpload}
        />
        <input
          ref={frameInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleCustomFrameUpload}
        />

        {/* Main Grid: Left Canvas Viewport, Right Fit Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ============================================================== */}
          {/* LEFT: Live Viewport & Controls                                  */}
          {/* ============================================================== */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            {/* Source Mode Tabs (Live Camera, Upload Photo, Preset Models) */}
            <div className="flex items-center justify-between flex-wrap gap-2 p-1.5 rounded-xl border border-border bg-card shadow-xs">
              <div className="flex items-center gap-1.5">
                {/* Live Camera Button */}
                <button
                  type="button"
                  onClick={toggleCamera}
                  disabled={isStartingCamera}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    cameraActive
                      ? "bg-rose-500 text-white shadow-xs"
                      : isStartingCamera
                      ? "bg-primary/80 text-primary-foreground opacity-90 cursor-wait"
                      : "bg-muted/70 text-foreground hover:bg-muted"
                  }`}
                >
                  {isStartingCamera ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Video className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {cameraActive
                      ? t("Stop Camera")
                      : isStartingCamera
                      ? t("Starting Camera...")
                      : t("Live Camera")}
                  </span>
                  {cameraActive && (
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  )}
                </button>

                {/* Upload Your Photo Button */}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    sourceMode === "photo"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/70 text-foreground hover:bg-muted"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{uploadedUserPhoto ? t("My Photo") : t("Upload Photo")}</span>
                </button>
              </div>

              {/* Preset Models Switcher */}
              <div className="flex items-center gap-1">
                <span className="text-[10.5px] uppercase font-mono text-muted-foreground mr-1">
                  {t("Model:")}
                </span>
                {PRESET_MODELS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (cameraActive) stopCameraStream();
                      setSelectedModel(m.src);
                      setSourceMode("preset");
                      setDragOffset({ x: 0, y: 0 });
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                      sourceMode === "preset" && selectedModel === m.src
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-muted/50 text-foreground hover:bg-muted"
                    }`}
                  >
                    {m.id === "jonas" ? "Jonas" : "Sarah"}
                  </button>
                ))}
              </div>
            </div>

            {/* Viewport Canvas Container */}
            <div
              className={`relative rounded-2xl border border-border bg-slate-950 overflow-hidden shadow-xl aspect-[4/3] select-none ${
                isFullscreen
                  ? "fixed inset-4 z-50 aspect-auto shadow-2xl max-w-6xl mx-auto"
                  : ""
              }`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              style={{
                touchAction: "none",
                cursor: isDragging ? "grabbing" : "grab",
              }}
            >
              <canvas ref={canvasRef} className="w-full h-full block" />
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                  pointerEvents: "none",
                  zIndex: -1,
                }}
              />

              {/* Toast Notification for Frame or Photo Upload */}
              {uploadSuccessToast && (
                <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{uploadSuccessToast}</span>
                </div>
              )}

              {/* Loading Overlay */}
              {(faceLandmarker.isLoading || isProcessingPhoto) && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
                  <span className="text-white text-sm font-medium">
                    {isProcessingPhoto ? t("Analyzing face landmarks...") : t("Loading face detection...")}
                  </span>
                  <span className="text-white/60 text-xs mt-1">
                    {t("One-time model download (~4 MB)")}
                  </span>
                </div>
              )}

              {/* Status Badge (Top-Left) */}
              <div className="absolute top-3 left-3 z-30 flex items-center gap-2" onPointerDown={(e) => e.stopPropagation()}>
                <div
                  className={`backdrop-blur-md px-3 py-1 rounded-full text-[10.5px] font-mono flex items-center gap-1.5 shadow-sm border ${
                    faceDetected
                      ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                      : faceLandmarker.error
                      ? "bg-rose-500/20 border-rose-400/30 text-rose-300"
                      : faceLandmarker.isReady
                      ? "bg-amber-500/20 border-amber-400/30 text-amber-300"
                      : "bg-black/70 border-white/10 text-white"
                  }`}
                >
                  {faceDetected ? (
                    <>
                      <ScanFace className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-bold uppercase tracking-wider">
                        {t("Face Tracked")}
                      </span>
                      <span className="text-white/40">|</span>
                      <span className="font-semibold text-emerald-300">{pdMm} mm</span>
                    </>
                  ) : faceLandmarker.error ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span className="font-bold uppercase tracking-wider text-rose-300">
                        {t("AI Offline")}
                      </span>
                      <span className="text-white/40">|</span>
                      <span className="font-semibold text-rose-200">{t("Fallback Mode")}</span>
                    </>
                  ) : (
                    <>
                      <Glasses className="w-3.5 h-3.5" />
                      <span className="font-bold uppercase tracking-wider">{t("Frame Fit")}</span>
                      <span className="text-white/40">|</span>
                      <span className="font-semibold">{pdMm} mm</span>
                    </>
                  )}
                </div>

                {isDragging && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                    <Move className="w-3 h-3" />
                    <span>{t("Moving")}</span>
                  </span>
                )}
              </div>

              {/* Fullscreen Toggle (Top-Right) */}
              <div className="absolute top-3 right-3 z-30" onPointerDown={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg bg-black/60 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/80 transition cursor-pointer border border-white/10"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Floating Bottom Toolbar */}
              <div
                className="absolute bottom-4 inset-x-0 z-30 flex items-center justify-center gap-3 pointer-events-auto"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 flex items-center gap-3 shadow-2xl">
                  {/* Upload Photo Button */}
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    title={t("Upload My Photo")}
                    className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>

                  {/* Shutter Camera Button */}
                  <button
                    type="button"
                    onClick={captureSnapshot}
                    title={t("Take Snapshot")}
                    className="w-11 h-11 rounded-full bg-white text-slate-900 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition cursor-pointer border-2 border-white/40"
                  >
                    <Camera className="w-5 h-5 text-slate-900" />
                  </button>

                  {/* Toggle Webcam */}
                  <button
                    type="button"
                    onClick={toggleCamera}
                    title={cameraActive ? t("Stop Camera") : t("Live Camera Try-On")}
                    className={`p-2 rounded-full transition cursor-pointer ${
                      cameraActive
                        ? "bg-rose-500 text-white shadow-md hover:bg-rose-600"
                        : "text-white/80 hover:text-white hover:bg-white/15"
                    }`}
                  >
                    <Video className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {(cameraError || faceLandmarker.error) && (
              <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 text-center font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500" />
                <span>{cameraError || faceLandmarker.error}</span>
              </div>
            )}

            {/* Hint bar */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
              <span className="flex items-center gap-1.5">
                <Move className="w-3.5 h-3.5 text-primary" />
                <span>{t("Click & drag glasses on the face to adjust alignment.")}</span>
              </span>
              <button
                type="button"
                onClick={resetCalibration}
                className="hover:text-foreground underline transition cursor-pointer"
              >
                {t("Reset Position")}
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* RIGHT: Frame Selection & Fit Tuning Panel                       */}
          {/* ============================================================== */}
          <div className="lg:col-span-5 space-y-5 text-left">
            <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-6">
              {/* Header */}
              <div className="border-b border-border/60 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Glasses className="w-5 h-5 text-primary" />
                    <h3 className="font-display text-lg font-bold text-foreground">
                      {t("Frame Fit")}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={resetCalibration}
                    className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 cursor-pointer font-medium"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t("Reset Fit")}</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  {t(
                    "Enter your Pupillary Distance (PD) for a more accurate fit. Be sure to double check your frame's dimensions before ordering your glasses."
                  )}
                </p>
              </div>

              {/* 1. Pupillary Distance (PD) Stepper & Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <span>{t("Pupillary Distance (PD):")}</span>
                    <span className="text-muted-foreground font-normal text-[11px]">ⓘ</span>
                  </label>
                  <span className="text-[10.5px] font-mono text-muted-foreground">
                    {t("Standard: 62 mm")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-border rounded-xl overflow-hidden bg-background shadow-xs">
                    <button
                      type="button"
                      onClick={() => setPdMm((p) => Math.max(52, p - 1))}
                      disabled={pdMm <= 52}
                      className="px-3.5 py-2 hover:bg-muted text-foreground transition cursor-pointer border-r border-border disabled:opacity-40"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-20 text-center font-mono font-bold text-sm text-foreground">
                      {pdMm} mm
                    </span>
                    <button
                      type="button"
                      onClick={() => setPdMm((p) => Math.min(74, p + 1))}
                      disabled={pdMm >= 74}
                      className="px-3.5 py-2 hover:bg-muted text-foreground transition cursor-pointer border-l border-border disabled:opacity-40"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <input
                    type="range"
                    min={52}
                    max={74}
                    value={pdMm}
                    onChange={(e) => setPdMm(Number(e.target.value))}
                    className="flex-1 accent-primary cursor-pointer h-1.5 bg-muted rounded-lg"
                  />
                </div>
              </div>

              {/* 2. Interactive Fit Tuning: Bridge Height & Frame Scale */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40 text-xs">
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">
                    {t("Bridge Height")}
                  </span>
                  <div className="flex items-center gap-1 border border-border rounded-lg bg-background p-1">
                    <button
                      type="button"
                      onClick={() => setBridgeOffset((p) => p - 3)}
                      className="flex-1 py-1 text-center font-bold text-xs hover:bg-muted rounded text-foreground cursor-pointer"
                    >
                      ↑
                    </button>
                    <span className="text-[10px] font-mono w-10 text-center text-muted-foreground">
                      {Math.round(bridgeOffset)}px
                    </span>
                    <button
                      type="button"
                      onClick={() => setBridgeOffset((p) => p + 3)}
                      className="flex-1 py-1 text-center font-bold text-xs hover:bg-muted rounded text-foreground cursor-pointer"
                    >
                      ↓
                    </button>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">
                    {t("Frame Scale")}
                  </span>
                  <div className="flex items-center gap-1 border border-border rounded-lg bg-background p-1">
                    <button
                      type="button"
                      onClick={() => setScaleFactor((p) => Math.max(0.75, p - 0.05))}
                      className="flex-1 py-1 text-center font-bold text-xs hover:bg-muted rounded text-foreground cursor-pointer"
                    >
                      -
                    </button>
                    <span className="text-[10px] font-mono w-12 text-center text-muted-foreground">
                      {Math.round(scaleFactor * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => setScaleFactor((p) => Math.min(1.35, p + 0.05))}
                      className="flex-1 py-1 text-center font-bold text-xs hover:bg-muted rounded text-foreground cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. Frame Selection Grid & "+ Upload Your Frame" */}
              <div className="space-y-2.5 pt-2 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {t("Select Frame to Preview")}
                  </span>
                  <div className="flex items-center gap-2">
                    {activeFrame.type === "custom" && (
                      <button
                        type="button"
                        onClick={(e) => handleEditCustomFrame(activeFrame, e)}
                        className="text-[11px] text-teal-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                        title={t("Open Alignment & Eraser Studio")}
                      >
                        <Eraser className="w-3 h-3" />
                        <span>{t("Adjust / Eraser")}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Grid of frames */}
                <div className="grid grid-cols-2 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {/* Dedicated Upload Frame Button Card */}
                  <button
                    type="button"
                    onClick={() => frameInputRef.current?.click()}
                    className="p-2.5 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition cursor-pointer flex flex-col items-center justify-center text-center gap-1 min-h-[64px]"
                  >
                    <Upload className="w-4 h-4 text-primary" />
                    <span className="text-[11px] font-bold text-primary">
                      {t("Upload Any Frame")}
                    </span>
                    <span className="text-[9.5px] text-muted-foreground">
                      {t("PNG, JPG with glasses")}
                    </span>
                  </button>

                  {/* Frame cards */}
                  {frames.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => setActiveFrameId(f.id)}
                      className={`relative p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center gap-2.5 group ${
                        activeFrame.id === f.id
                          ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/40"
                          : "border-border bg-card hover:bg-muted/40"
                      }`}
                    >
                      <div className="w-12 h-10 rounded-lg bg-muted/40 p-1 flex items-center justify-center shrink-0 border border-border/60 overflow-hidden">
                        {f.type === "custom" && f.customDataUrl ? (
                          <img
                            src={f.customDataUrl}
                            alt={f.name}
                            className="w-full h-full object-contain"
                          />
                        ) : f.thumb || f.image ? (
                          <img
                            src={f.thumb || f.image}
                            alt={f.name}
                            className="w-full h-full object-contain drop-shadow-xs"
                          />
                        ) : (
                          <div
                            className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                            style={{ backgroundColor: f.color }}
                          />
                        )}
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {f.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {f.category}
                        </p>
                      </div>

                      {/* Action buttons for custom uploaded frames */}
                      {f.type === "custom" && (
                        <div className="flex items-center gap-1 opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={(e) => handleEditCustomFrame(f, e)}
                            title={t("Re-align / Trim Temples / Use Eraser")}
                            className="p-1 text-muted-foreground hover:text-teal-400 rounded transition cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => removeCustomFrame(f.id, e)}
                            title={t("Delete uploaded frame")}
                            className="p-1 text-muted-foreground hover:text-rose-500 rounded transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Active Frame Specs */}
              <div className="pt-2 border-t border-border/40 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {t("Lens Width:")}{" "}
                    <strong className="text-foreground">{activeFrame.lensWidth} mm</strong>
                  </span>
                  <span>
                    {t("Bridge:")}{" "}
                    <strong className="text-foreground">{activeFrame.bridgeWidth} mm</strong>
                  </span>
                  <span>
                    {t("Temple:")}{" "}
                    <strong className="text-foreground">{activeFrame.templeLength} mm</strong>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10.5px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {t("Compatible with European standard & high diopter surfacing")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Snapshot Modal */}
      {isSnapshotModalOpen && snapshotUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="fixed inset-0" onClick={() => setIsSnapshotModalOpen(false)} />
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl z-10 text-center space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-primary" />
                <h4 className="font-display font-bold text-sm text-foreground">
                  {t("Your Try-On Fit Snapshot")}
                </h4>
              </div>
              <button
                onClick={() => setIsSnapshotModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-border bg-black aspect-[4/3]">
              <img src={snapshotUrl} alt="Fit snapshot" className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>{activeFrame.name}</span>
              <span className="font-mono text-foreground font-semibold">PD: {pdMm} mm</span>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={snapshotUrl}
                download={`lensly-tryon-${activeFrame.id}-${pdMm}mm.jpg`}
                className="flex-1 py-2.5 rounded-xl border border-border bg-background text-foreground font-semibold text-xs hover:bg-muted transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t("Download Snapshot")}</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  setIsSnapshotModalOpen(false);
                  onOpenFrameModal?.();
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-xs shadow-sm hover:bg-primary/95 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{t("Proceed with this Frame")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Frame Studio / Alignment & Temple Trimming Modal */}
      <FrameStudioModal
        isOpen={isFrameStudioOpen}
        onClose={() => setIsFrameStudioOpen(false)}
        rawImageSrc={studioRawImage}
        fileName={studioFileName}
        onApplyFrame={handleApplyStudioFrame}
        previewModelSrc={selectedModel}
      />
    </section>
  );
}
