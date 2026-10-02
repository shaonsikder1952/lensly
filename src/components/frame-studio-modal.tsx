import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "../lib/i18n";
import {
  X,
  RotateCw,
  RotateCcw,
  Wand2,
  Crop,
  Check,
  Sparkles,
  Sliders,
  Eye,
  Glasses,
  Scissors,
  Eraser,
  Undo2,
  CheckCircle2,
  Loader2,
  Compass,
  Layers,
  Sparkle,
  RotateCcw as ResetIcon,
  ZoomIn,
} from "lucide-react";
import {
  analyzeFrameImage,
  renderProcessedFrame,
  type FrameAnalysisResult,
} from "../lib/frame-processor";

export interface FrameStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawImageSrc: string | null;
  fileName: string;
  onApplyFrame: (processedDataUrl: string, frameName: string) => void;
  previewModelSrc?: string;
}

export function FrameStudioModal({
  isOpen,
  onClose,
  rawImageSrc,
  fileName,
  onApplyFrame,
  previewModelSrc = "/jonas-schmidt.png",
}: FrameStudioModalProps) {
  const { t } = useLanguage();

  const [frameName, setFrameName] = useState(fileName);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [perspectiveSkew, setPerspectiveSkew] = useState<number>(0);
  const [crop, setCrop] = useState({
    leftPercent: 0,
    rightPercent: 0,
    topPercent: 0,
    bottomPercent: 0,
  });
  const [cutoutLenses, setCutoutLenses] = useState<boolean>(true);
  const [clearInnerTemples, setClearInnerTemples] = useState<boolean>(true);
  const [bgSensitivity, setBgSensitivity] = useState<number>(45);

  // Interactive Eraser State
  const [isEraserActive, setIsEraserActive] = useState<boolean>(false);
  const [brushSize, setBrushSize] = useState<number>(18);
  const [canUndo, setCanUndo] = useState<boolean>(false);
  const [hasErased, setHasErased] = useState<boolean>(false);

  const [analysis, setAnalysis] = useState<FrameAnalysisResult | null>(null);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadedImgRef = useRef<HTMLImageElement | null>(null);

  // Frame Layer Canvases
  const frameCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseProcessedCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameBoundsRef = useRef<{
    dx: number;
    dy: number;
    dw: number;
    dh: number;
    fw: number;
    fh: number;
  } | null>(null);

  // Drawing & Undo history
  const isDrawingRef = useRef(false);
  const lastFramePointRef = useRef<{ fx: number; fy: number } | null>(null);
  const undoStackRef = useRef<ImageData[]>([]);
  const cursorPointRef = useRef<{ x: number; y: number } | null>(null);

  // Initialize and analyze image when modal opens
  useEffect(() => {
    if (!isOpen || !rawImageSrc) return;

    setFrameName(fileName.replace(/\.[^/.]+$/, "").slice(0, 20) || t("Custom Frame"));
    setIsAnalyzing(true);
    setIsEraserActive(false);
    setHasErased(false);
    undoStackRef.current = [];
    setCanUndo(false);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      loadedImgRef.current = img;

      // Computer Vision analysis
      const res = analyzeFrameImage(img);
      setAnalysis(res);

      const autoAngle = -res.estimatedAngle;
      const autoSkew = -res.suggestedPerspective;

      setRotationDeg(autoAngle);
      setPerspectiveSkew(autoSkew);
      setCrop(res.suggestedCrop);
      setIsAnalyzing(false);

      // Render initial result
      const initialUrl = renderProcessedFrame({
        img,
        rotationDeg: autoAngle,
        perspectiveSkew: autoSkew,
        crop: res.suggestedCrop,
        cutoutLenses: true,
        clearInnerTemples: true,
        bgSensitivity: 45,
      });

      setProcessedUrl(initialUrl);
      loadProcessedIntoFrameCanvas(initialUrl);
    };
    img.src = rawImageSrc;
  }, [isOpen, rawImageSrc, fileName]);

  // Load a processed transparent PNG into the frame layer canvas
  const loadProcessedIntoFrameCanvas = (dataUrl: string) => {
    const fImg = new Image();
    fImg.onload = () => {
      const fw = fImg.naturalWidth;
      const fh = fImg.naturalHeight;

      // 1. Working Frame Canvas
      let fc = frameCanvasRef.current;
      if (!fc) {
        fc = document.createElement("canvas");
        frameCanvasRef.current = fc;
      }
      fc.width = fw;
      fc.height = fh;
      const fCtx = fc.getContext("2d", { willReadFrequently: true });
      if (fCtx) {
        fCtx.clearRect(0, 0, fw, fh);
        fCtx.drawImage(fImg, 0, 0);
      }

      // 2. Base Pristine Canvas (for "Reset Eraser" functionality)
      let bc = baseProcessedCanvasRef.current;
      if (!bc) {
        bc = document.createElement("canvas");
        baseProcessedCanvasRef.current = bc;
      }
      bc.width = fw;
      bc.height = fh;
      const bCtx = bc.getContext("2d");
      if (bCtx) {
        bCtx.clearRect(0, 0, fw, fh);
        bCtx.drawImage(fImg, 0, 0);
      }

      undoStackRef.current = [];
      setCanUndo(false);
      setHasErased(false);
      drawCanvas();
    };
    fImg.src = dataUrl;
  };

  // Redraw the visible master canvas: Checkerboard + Guides + Frame Layer + Brush Ring
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cw = canvas.width;
    const ch = canvas.height;

    ctx.clearRect(0, 0, cw, ch);

    // 1. Draw Checkerboard Transparency Pattern
    const tileSize = 16;
    for (let y = 0; y < ch; y += tileSize) {
      for (let x = 0; x < cw; x += tileSize) {
        ctx.fillStyle = (x / tileSize + y / tileSize) % 2 === 0 ? "#090d16" : "#0f172a";
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }

    // 2. Cyan Horizontal Level Guideline (Bridge Line)
    ctx.save();
    ctx.strokeStyle = "rgba(45, 212, 191, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(0, ch / 2);
    ctx.lineTo(cw, ch / 2);
    ctx.stroke();

    // Vertical Center Line
    ctx.beginPath();
    ctx.moveTo(cw / 2, 0);
    ctx.lineTo(cw / 2, ch);
    ctx.stroke();
    ctx.restore();

    // 3. Draw the active Frame from the dedicated Frame Canvas Layer
    const fc = frameCanvasRef.current;
    if (fc && fc.width > 0 && fc.height > 0) {
      const maxW = cw * 0.85;
      const maxH = ch * 0.78;
      const scale = Math.min(maxW / fc.width, maxH / fc.height, 1.25);
      const dw = Math.round(fc.width * scale);
      const dh = Math.round(fc.height * scale);
      const dx = Math.round((cw - dw) / 2);
      const dy = Math.round((ch - dh) / 2);

      // Cache bounds for mouse interaction
      frameBoundsRef.current = { dx, dy, dw, dh, fw: fc.width, fh: fc.height };

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.65)";
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(fc, dx, dy, dw, dh);
      ctx.restore();
    }

    // 4. Draw Eraser Cursor Ring if active and cursor is hovering
    if (isEraserActive && cursorPointRef.current) {
      const { x, y } = cursorPointRef.current;
      ctx.save();
      // Inner fill
      ctx.fillStyle = "rgba(244, 63, 94, 0.22)";
      ctx.beginPath();
      ctx.arc(x, y, brushSize, 0, Math.PI * 2);
      ctx.fill();

      // Outer stroke ring
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center pinpoint dot
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [isEraserActive, brushSize]);

  // Re-render processed frame from sliders
  const reprocess = useCallback(
    (
      newRot: number,
      newSkew: number,
      newCrop: typeof crop,
      newCutout: boolean,
      newClearTemples: boolean,
      newSens: number
    ) => {
      if (!loadedImgRef.current) return;
      const result = renderProcessedFrame({
        img: loadedImgRef.current,
        rotationDeg: newRot,
        perspectiveSkew: newSkew,
        crop: newCrop,
        cutoutLenses: newCutout,
        clearInnerTemples: newClearTemples,
        bgSensitivity: newSens,
      });
      setProcessedUrl(result);
      loadProcessedIntoFrameCanvas(result);
    },
    [crop]
  );

  const handleRotationChange = (val: number) => {
    setRotationDeg(val);
    reprocess(val, perspectiveSkew, crop, cutoutLenses, clearInnerTemples, bgSensitivity);
  };

  const handlePerspectiveChange = (val: number) => {
    setPerspectiveSkew(val);
    reprocess(rotationDeg, val, crop, cutoutLenses, clearInnerTemples, bgSensitivity);
  };

  const handleCropChange = (key: keyof typeof crop, val: number) => {
    const updated = { ...crop, [key]: val };
    setCrop(updated);
    reprocess(rotationDeg, perspectiveSkew, updated, cutoutLenses, clearInnerTemples, bgSensitivity);
  };

  const handleCutoutToggle = (val: boolean) => {
    setCutoutLenses(val);
    reprocess(rotationDeg, perspectiveSkew, crop, val, clearInnerTemples, bgSensitivity);
  };

  const handleClearInnerTemplesToggle = (val: boolean) => {
    setClearInnerTemples(val);
    reprocess(rotationDeg, perspectiveSkew, crop, cutoutLenses, val, bgSensitivity);
  };

  const handleSensitivityChange = (val: number) => {
    setBgSensitivity(val);
    reprocess(rotationDeg, perspectiveSkew, crop, cutoutLenses, clearInnerTemples, val);
  };

  const handleAutoStraighten = () => {
    if (!analysis) return;
    const autoAngle = -analysis.estimatedAngle;
    setRotationDeg(autoAngle);
    reprocess(autoAngle, perspectiveSkew, crop, cutoutLenses, clearInnerTemples, bgSensitivity);
  };

  const handleAutoTrimTemples = () => {
    if (!analysis) return;
    setCrop(analysis.suggestedCrop);
    reprocess(rotationDeg, perspectiveSkew, analysis.suggestedCrop, cutoutLenses, clearInnerTemples, bgSensitivity);
  };

  const handleResetAll = () => {
    setRotationDeg(0);
    setPerspectiveSkew(0);
    const zeroCrop = { leftPercent: 0, rightPercent: 0, topPercent: 0, bottomPercent: 0 };
    setCrop(zeroCrop);
    setBgSensitivity(45);
    setCutoutLenses(true);
    setClearInnerTemples(true);
    undoStackRef.current = [];
    setCanUndo(false);
    setHasErased(false);
    reprocess(0, 0, zeroCrop, true, true, 45);
  };

  // =========================================================================
  // High-Precision Pixel Eraser Engine (Erases directly on Frame Layer)
  // =========================================================================
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const eraseOnFrame = (canvasX: number, canvasY: number, isContinuing: boolean) => {
    const fc = frameCanvasRef.current;
    if (!fc) return;
    const fCtx = fc.getContext("2d", { willReadFrequently: true });
    if (!fCtx) return;

    const bounds = frameBoundsRef.current;
    if (!bounds || bounds.dw === 0 || bounds.dh === 0) return;

    // Convert display canvas coords to frame layer coords
    const fx = ((canvasX - bounds.dx) / bounds.dw) * bounds.fw;
    const fy = ((canvasY - bounds.dy) / bounds.dh) * bounds.fh;
    const frameBrushR = (brushSize / bounds.dw) * bounds.fw;

    fCtx.save();
    fCtx.globalCompositeOperation = "destination-out";

    if (isContinuing && lastFramePointRef.current) {
      // Draw smooth line between consecutive pointer movements to eliminate gaps
      fCtx.lineWidth = frameBrushR * 2;
      fCtx.lineCap = "round";
      fCtx.lineJoin = "round";
      fCtx.beginPath();
      fCtx.moveTo(lastFramePointRef.current.fx, lastFramePointRef.current.fy);
      fCtx.lineTo(fx, fy);
      fCtx.stroke();
    }

    // Stamp circle at current point
    fCtx.beginPath();
    fCtx.arc(fx, fy, frameBrushR, 0, Math.PI * 2);
    fCtx.fill();
    fCtx.restore();

    lastFramePointRef.current = { fx, fy };
    setHasErased(true);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isEraserActive) return;
    const { x, y } = getCanvasCoords(e);
    cursorPointRef.current = { x, y };

    // Save state for Undo BEFORE modifying the frame
    const fc = frameCanvasRef.current;
    if (fc) {
      const fCtx = fc.getContext("2d", { willReadFrequently: true });
      if (fCtx) {
        undoStackRef.current.push(fCtx.getImageData(0, 0, fc.width, fc.height));
        if (undoStackRef.current.length > 25) undoStackRef.current.shift();
        setCanUndo(true);
      }
    }

    isDrawingRef.current = true;
    lastFramePointRef.current = null;
    eraseOnFrame(x, y, false);
    drawCanvas();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoords(e);
    cursorPointRef.current = { x, y };

    if (isDrawingRef.current && isEraserActive) {
      eraseOnFrame(x, y, true);
    }
    drawCanvas();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastFramePointRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}

      // Immediately export transparent PNG to update Try-On Model Preview!
      const fc = frameCanvasRef.current;
      if (fc) {
        const dataUrl = fc.toDataURL("image/png");
        setProcessedUrl(dataUrl);
      }
      drawCanvas();
    }
  };

  const handleUndo = () => {
    const fc = frameCanvasRef.current;
    if (!fc || undoStackRef.current.length === 0) return;
    const fCtx = fc.getContext("2d", { willReadFrequently: true });
    if (!fCtx) return;

    const prevState = undoStackRef.current.pop();
    if (prevState) {
      fCtx.putImageData(prevState, 0, 0);
      setCanUndo(undoStackRef.current.length > 0);
      const dataUrl = fc.toDataURL("image/png");
      setProcessedUrl(dataUrl);
      drawCanvas();
    }
  };

  // Reverts all eraser strokes back to the un-erased frame without resetting rotation or crop
  const handleResetEraser = () => {
    const fc = frameCanvasRef.current;
    const bc = baseProcessedCanvasRef.current;
    if (!fc || !bc) return;
    const fCtx = fc.getContext("2d", { willReadFrequently: true });
    if (!fCtx) return;

    // Save to undo in case user wants to restore
    undoStackRef.current.push(fCtx.getImageData(0, 0, fc.width, fc.height));
    setCanUndo(true);

    fCtx.clearRect(0, 0, fc.width, fc.height);
    fCtx.drawImage(bc, 0, 0);

    const dataUrl = fc.toDataURL("image/png");
    setProcessedUrl(dataUrl);
    setHasErased(false);
    drawCanvas();
  };

  // Keyboard shortcut: Ctrl+Z for Undo
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        handleUndo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleApply = () => {
    const fc = frameCanvasRef.current;
    if (!fc) return;
    const finalUrl = fc.toDataURL("image/png");
    onApplyFrame(finalUrl, frameName.trim() || t("Custom Frame"));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <Glasses className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">
                  {t("Frame Alignment & Straightening Studio")}
                </h3>
                <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {t("AI Alignment & Eraser")}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {t(
                  "Straighten frame, erase rear temple arms or blemishes, and see live preview."
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Visual Canvas, Right Controls */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Left Column: Interactive Visual Canvas */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="relative rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden aspect-[16/11] flex items-center justify-center select-none shadow-inner">
              {/* Master Interactive Canvas */}
              <canvas
                ref={canvasRef}
                width={800}
                height={550}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={() => {
                  cursorPointRef.current = null;
                  drawCanvas();
                }}
                className={`w-full h-full block ${isEraserActive ? "cursor-crosshair" : "cursor-default"}`}
              />

              {/* Loading Indicator */}
              {isAnalyzing && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                  <Loader2 className="w-8 h-8 text-teal-400 animate-spin mb-2" />
                  <span className="text-xs text-slate-200 font-medium">
                    {t("Analyzing browline slope & stripping watermarks...")}
                  </span>
                </div>
              )}

              {/* Status Badges on Canvas */}
              <div className="absolute top-3 left-3 z-30 flex items-center gap-2">
                {analysis?.watermarkDetected && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                    {t("✓ Watermark Stripped")}
                  </span>
                )}
                {analysis && analysis.estimatedAngle !== 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-teal-500/20 border border-teal-500/30 text-[10px] font-mono text-teal-300">
                    {t("Auto-Leveled:")}{" "}
                    {-analysis.estimatedAngle > 0
                      ? `+${(-analysis.estimatedAngle).toFixed(1)}°`
                      : `${(-analysis.estimatedAngle).toFixed(1)}°`}
                  </span>
                )}
              </div>

              {/* Active Eraser Banner */}
              {isEraserActive && (
                <div className="absolute top-3 right-3 z-30 px-3 py-1.5 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center gap-2 shadow-xl animate-in fade-in">
                  <Eraser className="w-3.5 h-3.5" />
                  <span>{t("Eraser Active: Paint over rear arm")}</span>
                  {canUndo && (
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="ml-2 px-1.5 py-0.5 bg-black/30 rounded hover:bg-black/50 transition cursor-pointer flex items-center gap-1"
                    >
                      <Undo2 className="w-3 h-3" />
                      <span>{t("Undo")}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Bottom Angle & Skew Badge */}
              <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2 pointer-events-none">
                <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shadow-sm">
                  <Compass className="w-3.5 h-3.5 text-teal-400" />
                  <span>{t("Tilt:")}</span>
                  <span className="font-bold text-teal-400">
                    {rotationDeg > 0 ? `+${rotationDeg.toFixed(1)}°` : `${rotationDeg.toFixed(1)}°`}
                  </span>
                </div>
                {perspectiveSkew !== 0 && (
                  <div className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-1.5 shadow-sm">
                    <span>{t("Perspective:")}</span>
                    <span className="font-bold text-teal-400">{perspectiveSkew}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Model Try-On Card */}
            <div className="p-3 rounded-2xl border border-slate-800 bg-slate-950/60 flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 relative flex items-center justify-center">
                <img
                  src={previewModelSrc}
                  alt="Model Preview"
                  className="w-full h-full object-cover"
                />
                {processedUrl && (
                  <img
                    src={processedUrl}
                    alt="Wearing Frame"
                    className="absolute inset-x-2 top-4 w-12 object-contain drop-shadow"
                  />
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>{t("Real-Time Face Fit Preview")}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {t(
                    "Fits straight and balanced. Erasing arms updates this preview instantly."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Controls & Fine Tuning */}
          <div className="lg:col-span-5 flex flex-col gap-3.5 text-left">
            {/* Frame Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase font-mono text-slate-400">
                {t("Frame Name")}
              </label>
              <input
                type="text"
                value={frameName}
                onChange={(e) => setFrameName(e.target.value)}
                placeholder={t("e.g. My Custom Frame")}
                className="w-full px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
              />
            </div>

            {/* Quick 1-Click Fix Buttons */}
            <div className="p-3 rounded-2xl border border-slate-800 bg-slate-950/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Wand2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>{t("Instant 1-Click Tools")}</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="text-[10px] text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1"
                >
                  <ResetIcon className="w-3 h-3" />
                  <span>{t("Reset All")}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleAutoStraighten}
                  disabled={!analysis}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700/60"
                >
                  <RotateCw className="w-3.5 h-3.5 text-teal-400" />
                  <span>{t("Auto-Straighten")}</span>
                </button>

                <button
                  type="button"
                  onClick={handleAutoTrimTemples}
                  disabled={!analysis}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-700/60"
                >
                  <Scissors className="w-3.5 h-3.5 text-teal-400" />
                  <span>{t("Trim Arms")}</span>
                </button>
              </div>
            </div>

            {/* Calibration Sliders & Magic Eraser Brush */}
            <div className="space-y-3 p-3 rounded-2xl border border-slate-800 bg-slate-950/40 text-xs">
              {/* 1. Straighten Angle Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {t("Straighten Level Angle:")}
                  </label>
                  <span className="font-mono text-teal-400 font-bold">
                    {rotationDeg > 0 ? `+${rotationDeg.toFixed(1)}°` : `${rotationDeg.toFixed(1)}°`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRotationChange(Math.max(-40, rotationDeg - 1))}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title="-1°"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <input
                    type="range"
                    min={-40}
                    max={40}
                    step={0.5}
                    value={rotationDeg}
                    onChange={(e) => handleRotationChange(parseFloat(e.target.value))}
                    className="flex-1 accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => handleRotationChange(Math.min(40, rotationDeg + 1))}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                    title="+1°"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* 2. 3D Perspective Skew Slider */}
              <div className="space-y-1 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Layers className="w-3 h-3 text-teal-400" />
                    <span>{t("3D Perspective Balance:")}</span>
                  </label>
                  <span className="font-mono text-teal-400 font-bold">
                    {perspectiveSkew}
                  </span>
                </div>
                <input
                  type="range"
                  min={-35}
                  max={35}
                  value={perspectiveSkew}
                  onChange={(e) => handlePerspectiveChange(parseInt(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>

              {/* 3. Temple Arms & Watermark Trimming Sliders */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
                    <Scissors className="w-3 h-3 text-teal-400" />
                    <span>{t("Side Arms & Bottom Trim:")}</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    L: {crop.leftPercent}% · R: {crop.rightPercent}% · B: {crop.bottomPercent}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      {t("Left Arm")}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={45}
                      value={crop.leftPercent}
                      onChange={(e) => handleCropChange("leftPercent", parseInt(e.target.value))}
                      className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      {t("Right Arm")}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={45}
                      value={crop.rightPercent}
                      onChange={(e) => handleCropChange("rightPercent", parseInt(e.target.value))}
                      className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">
                      {t("Bottom Trim")}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={35}
                      value={crop.bottomPercent}
                      onChange={(e) => handleCropChange("bottomPercent", parseInt(e.target.value))}
                      className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                    />
                  </div>
                </div>
              </div>

              {/* 4. Interactive Magic Eraser Brush (HIGH-PRECISION ERASER) */}
              <div className="pt-2.5 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
                      <Eraser className="w-3.5 h-3.5 text-rose-400" />
                      <span>{t("Magic Eraser Brush")}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {t("Paint over rear temple arms or inner lens artifacts to erase them.")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {canUndo && (
                      <button
                        type="button"
                        onClick={handleUndo}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer flex items-center gap-1 border border-slate-700/60"
                        title={t("Undo last stroke (Ctrl+Z)")}
                      >
                        <Undo2 className="w-3 h-3 text-teal-400" />
                        <span>{t("Undo")}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEraserActive(!isEraserActive)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                        isEraserActive
                          ? "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-500/20"
                          : "bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 border border-teal-500/30"
                      }`}
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      <span>{isEraserActive ? t("Done Erasing") : t("Use Eraser")}</span>
                    </button>
                  </div>
                </div>

                {/* Eraser Brush Options & Presets */}
                {isEraserActive && (
                  <div className="p-2.5 bg-slate-950/90 rounded-2xl border border-rose-500/30 space-y-2 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-rose-300">
                        {t("Brush Presets:")}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {[
                          { label: "10px", size: 10 },
                          { label: "18px", size: 18 },
                          { label: "28px", size: 28 },
                          { label: "40px", size: 40 },
                        ].map((p) => (
                          <button
                            key={p.size}
                            type="button"
                            onClick={() => setBrushSize(p.size)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition cursor-pointer ${
                              brushSize === p.size
                                ? "bg-rose-500 text-white font-bold"
                                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                            }`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 shrink-0">{t("Custom Size:")}</span>
                      <input
                        type="range"
                        min={6}
                        max={50}
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                        className="flex-1 accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                      />
                      <span className="text-[10px] font-mono text-rose-300 w-8 text-right font-bold">
                        {brushSize}px
                      </span>
                    </div>

                    {hasErased && (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-400">
                          {t("Erased changes applied to live preview.")}
                        </span>
                        <button
                          type="button"
                          onClick={handleResetEraser}
                          className="text-[10px] text-rose-400 hover:text-rose-300 transition cursor-pointer underline"
                        >
                          {t("Revert All Eraser Strokes")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 5. Clear Lenses & Background Power */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-300 block">
                    {t("Transparent Lens Cutout")}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {t("Make lens glass transparent so eyes remain visible.")}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cutoutLenses}
                    onChange={(e) => handleCutoutToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                </label>
              </div>

              {/* Sensitivity */}
              <div className="pt-2 border-t border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {t("Background Removal Power:")}
                  </span>
                  <span className="text-[10px] font-mono text-teal-400 font-bold">
                    {bgSensitivity}
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={80}
                  value={bgSensitivity}
                  onChange={(e) => handleSensitivityChange(parseInt(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                />
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-auto pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800/70 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition cursor-pointer"
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!processedUrl}
                className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 active:scale-95 text-slate-950 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-lg shadow-teal-500/20 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t("Apply & Try On")}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
