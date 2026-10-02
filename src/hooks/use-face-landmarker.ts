import { useState, useRef, useCallback, useEffect, useMemo } from "react";

// Types for MediaPipe Face Landmarker results
export interface FaceLandmark {
  x: number; // 0..1 normalized
  y: number;
  z: number;
}

export interface FaceDetectionResult {
  landmarks: FaceLandmark[];
  glasses: {
    centerX: number;
    centerY: number;
    width: number;
    angle: number;
    yaw: number;
    pitch: number;
    roll: number;
    leftEar: { x: number; y: number; z: number };
    rightEar: { x: number; y: number; z: number };
    leftTemple: { x: number; y: number; z: number };
    rightTemple: { x: number; y: number; z: number };
    noseBridge: { x: number; y: number; z: number };
  };
}

// Key face landmark indices for glasses placement and 3D temple arms
const LEFT_EYE_OUTER = 33;
const LEFT_EYE_INNER = 133;
const RIGHT_EYE_OUTER = 263;
const RIGHT_EYE_INNER = 362;
const NOSE_BRIDGE = 168;
const NOSE_MID = 6;
const LEFT_EAR_TRAGUS = 234;
const RIGHT_EAR_TRAGUS = 454;
const LEFT_TEMPLE = 127;
const RIGHT_TEMPLE = 356;
const FOREHEAD = 10;
const CHIN = 152;

let faceLandmarkerInstance: any = null;
let loadingPromise: Promise<any> | null = null;
let loadFailed = false;

async function loadFaceLandmarker() {
  if (faceLandmarkerInstance) return faceLandmarkerInstance;
  if (loadFailed) return null;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const vision = await import("@mediapipe/tasks-vision");
      const { FaceLandmarker, FilesetResolver } = vision;

      const baseUrl =
        typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
          ? import.meta.env.BASE_URL.replace(/\/$/, "")
          : "";
      const origin = typeof window !== "undefined" ? window.location.origin : "";

      let wasmPath = `${origin}${baseUrl}/wasm`;
      let modelPath = `${origin}${baseUrl}/models/face_landmarker.task`;

      // Verify local model is accessible and not an HTML SPA fallback (Netlify/Vercel rewrite)
      let useLocal = true;
      try {
        const checkRes = await fetch(modelPath, { method: "HEAD" });
        const ct = checkRes.headers.get("content-type") || "";
        if (!checkRes.ok || ct.includes("text/html")) {
          console.warn(
            `[MediaPipe] Local model invalid (status: ${checkRes.status}, content-type: "${ct}"). Falling back to CDN.`
          );
          useLocal = false;
        }
      } catch (checkErr) {
        console.warn("[MediaPipe] Network probe for local model failed. Falling back to CDN:", checkErr);
        useLocal = false;
      }

      if (!useLocal) {
        wasmPath = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
        modelPath =
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
      }

      console.log("[MediaPipe] Initializing FilesetResolver from:", wasmPath);
      const filesetResolver = await FilesetResolver.forVisionTasks(wasmPath);

      // Try GPU first, fall back to CPU
      try {
        console.log("[MediaPipe] Attempting GPU delegate...");
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "GPU",
          },
          runningMode: "IMAGE",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });
        faceLandmarkerInstance.__activeDelegate = "GPU";
        faceLandmarkerInstance.__filesetResolver = filesetResolver;
        faceLandmarkerInstance.__modelPath = modelPath;
        console.log("[MediaPipe] Initialized successfully with GPU delegate!");
      } catch (gpuErr) {
        console.warn("[MediaPipe] GPU delegate failed, trying CPU fallback:", gpuErr);
        faceLandmarkerInstance = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath: modelPath,
            delegate: "CPU",
          },
          runningMode: "IMAGE",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });
        faceLandmarkerInstance.__activeDelegate = "CPU";
        faceLandmarkerInstance.__filesetResolver = filesetResolver;
        faceLandmarkerInstance.__modelPath = modelPath;
        console.log("[MediaPipe] Initialized successfully with CPU delegate!");
      }

      return faceLandmarkerInstance;
    } catch (err: any) {
      console.error("[MediaPipe] Failed to load FaceLandmarker:", err);
      loadFailed = true;
      loadingPromise = null;
      throw err;
    }
  })();

  return loadingPromise;
}

function computeGlassesTransform(
  landmarks: FaceLandmark[],
  sourceWidth: number,
  sourceHeight: number,
  pdMultiplier: number = 1.0
): FaceDetectionResult["glasses"] {
  const leftOuter = landmarks[LEFT_EYE_OUTER];
  const leftInner = landmarks[LEFT_EYE_INNER] || leftOuter;
  const rightOuter = landmarks[RIGHT_EYE_OUTER];
  const rightInner = landmarks[RIGHT_EYE_INNER] || rightOuter;
  const noseBridge = landmarks[NOSE_BRIDGE];
  const noseMid = landmarks[NOSE_MID] || noseBridge;

  // Pupil centers (average of inner & outer canthi)
  const lx = ((leftOuter.x + leftInner.x) / 2) * sourceWidth;
  const ly = ((leftOuter.y + leftInner.y) / 2) * sourceHeight;
  const rx = ((rightOuter.x + rightInner.x) / 2) * sourceWidth;
  const ry = ((rightOuter.y + rightInner.y) / 2) * sourceHeight;

  // Interpupillary distance in pixels (2D)
  const ipd2D = Math.sqrt((rx - lx) ** 2 + (ry - ly) ** 2);

  // 3D landmarks for ear attachment, nose bridge, and pose
  const leftEarPt = landmarks[LEFT_EAR_TRAGUS] || landmarks[LEFT_TEMPLE] || leftOuter;
  const rightEarPt = landmarks[RIGHT_EAR_TRAGUS] || landmarks[RIGHT_TEMPLE] || rightOuter;
  const leftTemplePt = landmarks[LEFT_TEMPLE] || leftOuter;
  const rightTemplePt = landmarks[RIGHT_TEMPLE] || rightOuter;
  const nosePt = noseBridge || noseMid || leftOuter;

  // 3D Yaw (head turn left/right in radians):
  // Compare ear depths (z-coordinate) and nose shift relative to pupil center
  const earDz = rightEarPt.z - leftEarPt.z;
  const earDx = Math.max(0.05, Math.abs(rightEarPt.x - leftEarPt.x));
  const eyeMidX = (lx + rx) / 2;
  const eyeMidY = (ly + ry) / 2;
  const nosePxX = (nosePt ? nosePt.x : eyeMidX / sourceWidth) * sourceWidth;
  const nosePxY = (nosePt ? nosePt.y : eyeMidY / sourceHeight) * sourceHeight;
  const noseShift = (nosePxX - eyeMidX) / Math.max(1, ipd2D);

  // Robust 3D yaw angle (-1.2 to +1.2 radians)
  const yaw = Math.atan2(earDz * 2.5 + noseShift * 1.0, Math.max(0.1, earDx));

  // 3D Pitch (head tilt up/down in radians)
  const eyeMidZ = (leftOuter.z + rightOuter.z) / 2;
  const pitch = Math.atan2((eyeMidZ - (nosePt ? nosePt.z : eyeMidZ)) * 2.5, 1.0);

  // Face roll / head tilt angle in 2D
  const roll = Math.atan2(ry - ly, rx - lx);
  const angle = roll;

  // Use raw 2D IPD as width — the frame naturally follows the face projection.
  // Do NOT divide by cos(yaw) — that causes the frame to explode in size when turning.
  const centerX = eyeMidX;
  const centerY = eyeMidY;
  const width = ipd2D;

  return {
    centerX,
    centerY,
    width,
    angle,
    yaw,
    pitch,
    roll,
    leftEar: { x: leftEarPt.x * sourceWidth, y: leftEarPt.y * sourceHeight, z: leftEarPt.z },
    rightEar: { x: rightEarPt.x * sourceWidth, y: rightEarPt.y * sourceHeight, z: rightEarPt.z },
    leftTemple: { x: leftTemplePt.x * sourceWidth, y: leftTemplePt.y * sourceHeight, z: leftTemplePt.z },
    rightTemple: { x: rightTemplePt.x * sourceWidth, y: rightTemplePt.y * sourceHeight, z: rightTemplePt.z },
    noseBridge: { x: nosePxX, y: nosePxY, z: nosePt ? nosePt.z : 0 },
  };
}

export function useFaceLandmarker() {
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const landmarkerRef = useRef<any>(null);
  const currentModeRef = useRef<"IMAGE" | "VIDEO">("IMAGE");

  // Temporal smoothing state for live video (EMA with velocity adaptation)
  const smoothedRef = useRef<FaceDetectionResult["glasses"] | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const isBusyRef = useRef<boolean>(false);

  const initialize = useCallback(async () => {
    if (isReady || isLoading) return;
    setIsLoading(true);
    setError(null);

    try {
      const lm = await loadFaceLandmarker();
      if (lm) {
        landmarkerRef.current = lm;
        currentModeRef.current = "IMAGE";
        setIsReady(true);
      } else {
        setError("Face detection model failed to load.");
      }
    } catch (err) {
      console.error("Failed to load Face Landmarker:", err);
      setError("Face detection model failed to load. Please refresh and try again.");
    } finally {
      setIsLoading(false);
    }
  }, [isReady, isLoading]);

  // Switch running mode if needed
  const ensureMode = useCallback(async (mode: "IMAGE" | "VIDEO") => {
    if (!landmarkerRef.current || currentModeRef.current === mode) return landmarkerRef.current;
    try {
      await landmarkerRef.current.setOptions({ runningMode: mode });
      currentModeRef.current = mode;
    } catch (err) {
      console.warn("Failed to switch mode:", err);
    }
    return landmarkerRef.current;
  }, []);

  // Detect face on a video frame (for live camera with concurrency guard)
  const detectVideo = useCallback(
    async (
      videoElement: HTMLVideoElement,
      timestamp: number,
      pdMultiplier: number = 1.0
    ): Promise<FaceDetectionResult | null> => {
      if (!landmarkerRef.current || isBusyRef.current) return null;

      // Ensure strictly increasing timestamp
      const validTimestamp = Math.max(timestamp, lastTimestampRef.current + 1);
      lastTimestampRef.current = validTimestamp;
      isBusyRef.current = true;

      try {
        // Switch mode only if needed (synchronous check first, async only on actual switch)
        if (currentModeRef.current !== "VIDEO") {
          await ensureMode("VIDEO");
        }

        let results;
        try {
          results = landmarkerRef.current.detectForVideo(videoElement, validTimestamp);
        } catch (execErr: any) {
          // If GPU delegate fails during runtime detection, downgrade to CPU!
          if (landmarkerRef.current?.__activeDelegate === "GPU" && landmarkerRef.current.__filesetResolver) {
            console.warn("[MediaPipe] Runtime GPU detection failed, downgrading to CPU delegate:", execErr);
            try {
              const vision = await import("@mediapipe/tasks-vision");
              const { FaceLandmarker } = vision;
              landmarkerRef.current = await FaceLandmarker.createFromOptions(
                landmarkerRef.current.__filesetResolver,
                {
                  baseOptions: {
                    modelAssetPath: landmarkerRef.current.__modelPath,
                    delegate: "CPU",
                  },
                  runningMode: "VIDEO",
                  numFaces: 1,
                  outputFaceBlendshapes: false,
                  outputFacialTransformationMatrixes: false,
                }
              );
              landmarkerRef.current.__activeDelegate = "CPU";
              currentModeRef.current = "VIDEO";
              results = landmarkerRef.current.detectForVideo(videoElement, validTimestamp);
            } catch (cpuDowngradeErr) {
              console.error("[MediaPipe] CPU downgrade also failed:", cpuDowngradeErr);
              throw cpuDowngradeErr;
            }
          } else {
            throw execErr;
          }
        }

        if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
          smoothedRef.current = null;
          return null;
        }

        const landmarks = results.faceLandmarks[0] as FaceLandmark[];
        const raw = computeGlassesTransform(
          landmarks,
          videoElement.videoWidth,
          videoElement.videoHeight,
          pdMultiplier
        );

        // Adaptive Exponential Moving Average (EMA)
        // High smoothing when still (no jitter), instant response when moving (zero lag)
        if (!smoothedRef.current) {
          smoothedRef.current = { ...raw };
        } else {
          const prev = smoothedRef.current;
          const dx = raw.centerX - prev.centerX;
          const dy = raw.centerY - prev.centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          // Fast movement -> high alpha (follow instantly)
          // Small movement -> low alpha (rock-solid stability)
          const alpha = Math.min(0.85, Math.max(0.35, dist / 12));

          smoothedRef.current = {
            centerX: prev.centerX + (raw.centerX - prev.centerX) * alpha,
            centerY: prev.centerY + (raw.centerY - prev.centerY) * alpha,
            width: prev.width + (raw.width - prev.width) * alpha,
            angle: prev.angle + (raw.angle - prev.angle) * alpha,
            yaw: prev.yaw + (raw.yaw - prev.yaw) * alpha,
            pitch: prev.pitch + (raw.pitch - prev.pitch) * alpha,
            roll: prev.roll + (raw.roll - prev.roll) * alpha,
            leftEar: {
              x: prev.leftEar.x + (raw.leftEar.x - prev.leftEar.x) * alpha,
              y: prev.leftEar.y + (raw.leftEar.y - prev.leftEar.y) * alpha,
              z: prev.leftEar.z + (raw.leftEar.z - prev.leftEar.z) * alpha,
            },
            rightEar: {
              x: prev.rightEar.x + (raw.rightEar.x - prev.rightEar.x) * alpha,
              y: prev.rightEar.y + (raw.rightEar.y - prev.rightEar.y) * alpha,
              z: prev.rightEar.z + (raw.rightEar.z - prev.rightEar.z) * alpha,
            },
            leftTemple: {
              x: prev.leftTemple.x + (raw.leftTemple.x - prev.leftTemple.x) * alpha,
              y: prev.leftTemple.y + (raw.leftTemple.y - prev.leftTemple.y) * alpha,
              z: prev.leftTemple.z + (raw.leftTemple.z - prev.leftTemple.z) * alpha,
            },
            rightTemple: {
              x: prev.rightTemple.x + (raw.rightTemple.x - prev.rightTemple.x) * alpha,
              y: prev.rightTemple.y + (raw.rightTemple.y - prev.rightTemple.y) * alpha,
              z: prev.rightTemple.z + (raw.rightTemple.z - prev.rightTemple.z) * alpha,
            },
            noseBridge: {
              x: prev.noseBridge.x + (raw.noseBridge.x - prev.noseBridge.x) * alpha,
              y: prev.noseBridge.y + (raw.noseBridge.y - prev.noseBridge.y) * alpha,
              z: prev.noseBridge.z + (raw.noseBridge.z - prev.noseBridge.z) * alpha,
            },
          };
        }

        return { landmarks, glasses: smoothedRef.current };
      } catch (err) {
        console.warn("Video detection error:", err);
        return null;
      } finally {
        isBusyRef.current = false;
      }
    },
    [ensureMode]
  );

  // Detect face on a static image
  const detectImage = useCallback(
    async (
      imageElement: HTMLImageElement | HTMLCanvasElement,
      pdMultiplier: number = 1.0
    ): Promise<FaceDetectionResult | null> => {
      if (!landmarkerRef.current) return null;

      try {
        await ensureMode("IMAGE");
        const results = landmarkerRef.current.detect(imageElement);

        if (!results.faceLandmarks || results.faceLandmarks.length === 0) {
          return null;
        }

        const landmarks = results.faceLandmarks[0] as FaceLandmark[];
        const w =
          imageElement instanceof HTMLImageElement
            ? imageElement.naturalWidth
            : imageElement.width;
        const h =
          imageElement instanceof HTMLImageElement
            ? imageElement.naturalHeight
            : imageElement.height;

        const glasses = computeGlassesTransform(landmarks, w, h, pdMultiplier);
        return { landmarks, glasses };
      } catch (err) {
        console.warn("Face detection failed:", err);
        return null;
      }
    },
    [ensureMode]
  );

  // Reset smoothing buffer
  const resetSmoothing = useCallback(() => {
    smoothedRef.current = null;
    lastTimestampRef.current = 0;
    isBusyRef.current = false;
  }, []);

  useEffect(() => {
    return () => {
      smoothedRef.current = null;
    };
  }, []);

  return useMemo(
    () => ({
      initialize,
      isLoading,
      isReady,
      error,
      detectVideo,
      detectImage,
      resetSmoothing,
    }),
    [initialize, isLoading, isReady, error, detectVideo, detectImage, resetSmoothing]
  );
}
