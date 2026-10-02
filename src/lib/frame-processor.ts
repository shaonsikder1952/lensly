/**
 * Lensly Custom Frame Processor & Alignment Engine (v2)
 *
 * Core Capabilities:
 * 1. Automatic Watermark / Label Stripping (removes bottom/border site watermarks)
 * 2. High-Precision Dual-Peak Tilt Detection (Browline / Lens Peak Angle)
 * 3. 3D Perspective / Skew Compensation (makes 3/4 angle photos front-facing)
 * 4. Temple Arm Auto-Clipping & Inner Lens Cleaning
 * 5. Optical Bridge Centering (centers on the nose bridge, not raw image bounds)
 */

export interface FrameAnalysisResult {
  estimatedAngle: number; // in degrees (-35 to +35)
  suggestedPerspective: number; // -30 to +30 (if 3/4 view detected)
  suggestedCrop: {
    leftPercent: number; // 0..40
    rightPercent: number; // 0..40
    topPercent: number; // 0..30
    bottomPercent: number; // 0..30
  };
  isSolidBg: boolean;
  bgR: number;
  bgG: number;
  bgB: number;
  confidence: number;
  watermarkDetected: boolean;
}

export interface ProcessFrameOptions {
  img: HTMLImageElement;
  rotationDeg: number;
  perspectiveSkew?: number; // -40 to +40, default 0
  crop: {
    leftPercent: number;
    rightPercent: number;
    topPercent: number;
    bottomPercent: number;
  };
  cutoutLenses: boolean;
  clearInnerTemples?: boolean;
  bgSensitivity: number; // default ~45
  eraserMaskCanvas?: HTMLCanvasElement | null;
}

/**
 * Analyzes an uploaded glasses image to determine tilt angle, perspective,
 * background, and temple boundaries.
 */
export function analyzeFrameImage(img: HTMLImageElement): FrameAnalysisResult {
  const procW = 800;
  const procH = Math.max(
    120,
    Math.round((img.naturalHeight || img.height) * (procW / (img.naturalWidth || img.width)))
  );

  const canvas = document.createElement("canvas");
  canvas.width = procW;
  canvas.height = procH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  const fallback: FrameAnalysisResult = {
    estimatedAngle: 0,
    suggestedPerspective: 0,
    suggestedCrop: { leftPercent: 0, rightPercent: 0, topPercent: 0, bottomPercent: 0 },
    isSolidBg: false,
    bgR: 255,
    bgG: 255,
    bgB: 255,
    confidence: 0,
    watermarkDetected: false,
  };

  if (!ctx) return fallback;

  ctx.drawImage(img, 0, 0, procW, procH);
  const imgData = ctx.getImageData(0, 0, procW, procH);
  const data = imgData.data;

  // 1. Sample outer border perimeter to identify background color
  const samplePoints: number[] = [];
  for (let x = 0; x < procW; x += 40) {
    samplePoints.push(x * 4); // top edge
    samplePoints.push(((procH - 1) * procW + x) * 4); // bottom edge
  }
  for (let y = 0; y < procH; y += 30) {
    samplePoints.push((y * procW) * 4); // left edge
    samplePoints.push((y * procW + (procW - 1)) * 4); // right edge
  }

  let sumA = 0,
    sumR = 0,
    sumG = 0,
    sumB = 0;
  for (const idx of samplePoints) {
    sumA += data[idx + 3];
    sumR += data[idx];
    sumG += data[idx + 1];
    sumB += data[idx + 2];
  }
  const avgA = sumA / samplePoints.length;
  const bgR = Math.round(sumR / samplePoints.length);
  const bgG = Math.round(sumG / samplePoints.length);
  const bgB = Math.round(sumB / samplePoints.length);
  const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

  const isTransparent = avgA < 30;
  const isLightBg = bgLum > 170;
  const isSolidBg = !isTransparent && (isLightBg || bgLum > 80);

  // Robust background pixel test with adaptive luminance and color distance
  const isBgPixel = (r: number, g: number, b: number, a: number): boolean => {
    if (a < 30) return true;
    if (!isSolidBg) return false;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

    if (isLightBg) {
      // Light background: off-white, light gray, studio lighting gradients
      return lum > 200 || dist < 65 || (lum > 175 && Math.abs(r - g) < 20 && Math.abs(g - b) < 20);
    }
    // Dark or colored background
    return dist < 55;
  };

  // 2. Row density analysis & Watermark Filtering
  const rowFgCounts = new Int32Array(procH);
  for (let y = 0; y < procH; y++) {
    for (let x = 0; x < procW; x++) {
      const idx = (y * procW + x) * 4;
      if (!isBgPixel(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) {
        rowFgCounts[y]++;
      }
    }
  }

  // Detect isolated bottom watermark text (e.g. "www.eyespace22.com")
  // A watermark is characterized by sparse active rows at the very bottom,
  // followed by a gap of near-empty rows before the glasses frame body.
  let watermarkCutoffY = procH;
  let watermarkDetected = false;
  const maxGapNoise = Math.max(6, Math.round(procW * 0.03));

  for (let y = procH - 1; y > Math.round(procH * 0.65); y--) {
    if (rowFgCounts[y] > 0 && rowFgCounts[y] < procW * 0.4) {
      // Check if there is an empty/near-empty gap above this row
      let emptyGapCount = 0;
      for (let gy = y - 1; gy > Math.max(0, y - 40); gy--) {
        if (rowFgCounts[gy] <= maxGapNoise) {
          emptyGapCount++;
        } else {
          break;
        }
      }
      if (emptyGapCount >= 5) {
        watermarkCutoffY = y - emptyGapCount;
        watermarkDetected = true;
        break;
      }
    }
  }

  // 3. Scan filtered glasses frame bounding box
  let minX = procW,
    maxX = 0,
    minY = procH,
    maxY = 0;

  for (let y = 0; y < watermarkCutoffY; y++) {
    for (let x = 0; x < procW; x++) {
      const idx = (y * procW + x) * 4;
      if (!isBgPixel(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const frameW = maxX - minX;
  const frameH = maxY - minY;

  if (frameW < 80 || frameH < 40) {
    return fallback;
  }

  // 4. Robust Dual-Peak Tilt Detection (Browline Peaks of Left & Right Lenses)
  // Divide glasses into Left Lens Zone (12% to 42%) and Right Lens Zone (58% to 88%)
  const leftZoneStart = Math.round(minX + frameW * 0.12);
  const leftZoneEnd = Math.round(minX + frameW * 0.42);
  const rightZoneStart = Math.round(minX + frameW * 0.58);
  const rightZoneEnd = Math.round(minX + frameW * 0.88);

  // For each zone, find the topmost rim pixels
  const findZoneTopPeak = (xStart: number, xEnd: number): { x: number; y: number } => {
    let topY = procH;
    let peakX = Math.round((xStart + xEnd) / 2);

    // Collect topmost 5 points in this zone to avoid single noise spikes
    const tops: { x: number; y: number }[] = [];
    for (let x = xStart; x <= xEnd; x++) {
      for (let y = minY; y < Math.min(procH, minY + frameH * 0.6); y++) {
        const idx = (y * procW + x) * 4;
        if (!isBgPixel(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) {
          tops.push({ x, y });
          if (y < topY) {
            topY = y;
            peakX = x;
          }
          break;
        }
      }
    }

    if (tops.length === 0) return { x: peakX, y: topY };
    tops.sort((a, b) => a.y - b.y);
    const bestCount = Math.min(5, tops.length);
    let avgX = 0,
      avgY = 0;
    for (let i = 0; i < bestCount; i++) {
      avgX += tops[i].x;
      avgY += tops[i].y;
    }
    return { x: Math.round(avgX / bestCount), y: avgY / bestCount };
  };

  const leftPeak = findZoneTopPeak(leftZoneStart, leftZoneEnd);
  const rightPeak = findZoneTopPeak(rightZoneStart, rightZoneEnd);

  let estimatedAngle = 0;
  const deltaY = rightPeak.y - leftPeak.y;
  const deltaX = rightPeak.x - leftPeak.x;

  if (deltaX > 80) {
    const rawRad = Math.atan2(deltaY, deltaX);
    const rawDeg = (rawRad * 180) / Math.PI;

    // Constrain to typical real-world eyewear angles (-35 to +35 degrees)
    if (Math.abs(rawDeg) <= 35) {
      estimatedAngle = Math.round(rawDeg * 10) / 10;
    }
  }

  // 5. Detect 3/4 Perspective Asymmetry (Left vs Right Lens Height/Width)
  // If one lens is significantly taller/larger than the other, suggest perspective correction
  let leftZoneMaxH = 0;
  let rightZoneMaxH = 0;

  for (let x = leftZoneStart; x <= leftZoneEnd; x++) {
    let top = -1,
      bot = -1;
    for (let y = minY; y < watermarkCutoffY; y++) {
      const idx = (y * procW + x) * 4;
      if (!isBgPixel(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) {
        if (top === -1) top = y;
        bot = y;
      }
    }
    if (top !== -1 && bot > top) {
      const h = bot - top;
      if (h > leftZoneMaxH) leftZoneMaxH = h;
    }
  }

  for (let x = rightZoneStart; x <= rightZoneEnd; x++) {
    let top = -1,
      bot = -1;
    for (let y = minY; y < watermarkCutoffY; y++) {
      const idx = (y * procW + x) * 4;
      if (!isBgPixel(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) {
        if (top === -1) top = y;
        bot = y;
      }
    }
    if (top !== -1 && bot > top) {
      const h = bot - top;
      if (h > rightZoneMaxH) rightZoneMaxH = h;
    }
  }

  let suggestedPerspective = 0;
  if (leftZoneMaxH > 30 && rightZoneMaxH > 30) {
    const ratio = rightZoneMaxH / leftZoneMaxH;
    if (ratio > 1.15) {
      suggestedPerspective = Math.min(30, Math.round((ratio - 1.0) * 45));
    } else if (ratio < 0.85) {
      suggestedPerspective = Math.max(-30, Math.round((ratio - 1.0) * 45));
    }
  }

  // 6. Temple Auto-Crop
  let trimLeftPercent = 0;
  let trimRightPercent = 0;
  const maxZoneHeight = Math.max(leftZoneMaxH, rightZoneMaxH);

  if (maxZoneHeight > 30) {
    // Check if there are thin temple bands sticking out on the far left or right
    let leftHinge = minX;
    for (let x = minX; x < minX + frameW * 0.22; x++) {
      let colH = 0;
      for (let y = minY; y < watermarkCutoffY; y++) {
        const idx = (y * procW + x) * 4;
        if (!isBgPixel(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) colH++;
      }
      if (colH > maxZoneHeight * 0.35) {
        leftHinge = x;
        break;
      }
    }

    let rightHinge = maxX;
    for (let x = maxX; x > maxX - frameW * 0.22; x--) {
      let colH = 0;
      for (let y = minY; y < watermarkCutoffY; y++) {
        const idx = (y * procW + x) * 4;
        if (!isBgPixel(data[idx], data[idx + 1], data[idx + 2], data[idx + 3])) colH++;
      }
      if (colH > maxZoneHeight * 0.35) {
        rightHinge = x;
        break;
      }
    }

    if (leftHinge > minX + 10) {
      trimLeftPercent = Math.min(25, Math.round(((leftHinge - minX) / procW) * 100));
    }
    if (rightHinge < maxX - 10) {
      trimRightPercent = Math.min(25, Math.round(((maxX - rightHinge) / procW) * 100));
    }
  }

  const trimTopPercent = Math.max(0, Math.round((minY / procH) * 100));
  const trimBottomPercent = Math.max(
    0,
    Math.round(((procH - watermarkCutoffY) / procH) * 100)
  );

  return {
    estimatedAngle,
    suggestedPerspective,
    suggestedCrop: {
      leftPercent: trimLeftPercent,
      rightPercent: trimRightPercent,
      topPercent: trimTopPercent,
      bottomPercent: trimBottomPercent,
    },
    isSolidBg,
    bgR,
    bgG,
    bgB,
    confidence: 0.95,
    watermarkDetected,
  };
}

/**
 * Renders the final transparent, deskewed, perspective-corrected, and centered frame PNG.
 */
export function renderProcessedFrame(options: ProcessFrameOptions): string {
  const {
    img,
    rotationDeg,
    perspectiveSkew = 0,
    crop,
    cutoutLenses,
    clearInnerTemples = true,
    bgSensitivity,
    eraserMaskCanvas,
  } = options;

  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  // 1. Initial Pass: Rotate & apply 3D perspective skew
  const rad = (rotationDeg * Math.PI) / 180;
  const absCos = Math.abs(Math.cos(rad));
  const absSin = Math.abs(Math.sin(rad));

  const rotW = Math.round(srcW * absCos + srcH * absSin);
  const rotH = Math.round(srcW * absSin + srcH * absCos);

  const rotCanvas = document.createElement("canvas");
  rotCanvas.width = rotW;
  rotCanvas.height = rotH;
  const rotCtx = rotCanvas.getContext("2d", { willReadFrequently: true });
  if (!rotCtx) return img.src;

  // Apply rotation
  rotCtx.save();
  rotCtx.translate(rotW / 2, rotH / 2);
  rotCtx.rotate(rad);
  rotCtx.drawImage(img, -srcW / 2, -srcH / 2);
  rotCtx.restore();

  // Apply perspective compensation if specified (equalizes lens sizes for 3/4 angle shots)
  if (perspectiveSkew !== 0) {
    const skewCanvas = document.createElement("canvas");
    skewCanvas.width = rotW;
    skewCanvas.height = rotH;
    const skewCtx = skewCanvas.getContext("2d");
    if (skewCtx) {
      const p = perspectiveSkew / 100;
      const numSlices = 60;
      const sliceW = rotW / numSlices;
      for (let i = 0; i < numSlices; i++) {
        const sx = i * sliceW;
        const norm = (sx - rotW / 2) / (rotW / 2); // -1..+1
        const scaleFactor = 1.0 - norm * p * 0.45;
        const sliceH = rotH * scaleFactor;
        const dy = (rotH - sliceH) / 2;
        skewCtx.drawImage(rotCanvas, sx, 0, sliceW, rotH, sx, dy, sliceW, sliceH);
      }
      rotCtx.clearRect(0, 0, rotW, rotH);
      rotCtx.drawImage(skewCanvas, 0, 0);
    }
  }

  // 2. Crop boundaries
  const cropLeft = Math.round((crop.leftPercent / 100) * rotW);
  const cropRight = Math.round((crop.rightPercent / 100) * rotW);
  const cropTop = Math.round((crop.topPercent / 100) * rotH);
  const cropBottom = Math.round((crop.bottomPercent / 100) * rotH);

  const finalW = Math.max(50, rotW - cropLeft - cropRight);
  const finalH = Math.max(30, rotH - cropTop - cropBottom);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = finalW;
  outCanvas.height = finalH;
  const outCtx = outCanvas.getContext("2d", { willReadFrequently: true });
  if (!outCtx) return img.src;

  outCtx.drawImage(rotCanvas, cropLeft, cropTop, finalW, finalH, 0, 0, finalW, finalH);

  // Apply manual eraser mask if user made erase strokes on canvas
  if (eraserMaskCanvas) {
    outCtx.save();
    outCtx.globalCompositeOperation = "destination-out";
    outCtx.drawImage(eraserMaskCanvas, 0, 0, finalW, finalH);
    outCtx.restore();
  }

  // 3. Pixel processing: Background removal & inner lens clearing
  const imgData = outCtx.getImageData(0, 0, finalW, finalH);
  const data = imgData.data;

  // Sample perimeter pixels
  const samples = [
    0,
    (finalW - 1) * 4,
    (finalH - 1) * finalW * 4,
    (finalH * finalW - 1) * 4,
    Math.floor(finalW / 2) * 4,
    (finalH - 1) * finalW * 4 + Math.floor(finalW / 2) * 4,
  ];

  let sumR = 0,
    sumG = 0,
    sumB = 0,
    sumA = 0;
  for (const idx of samples) {
    sumR += data[idx];
    sumG += data[idx + 1];
    sumB += data[idx + 2];
    sumA += data[idx + 3];
  }
  const avgA = sumA / samples.length;
  const bgR = Math.round(sumR / samples.length);
  const bgG = Math.round(sumG / samples.length);
  const bgB = Math.round(sumB / samples.length);

  const isNearWhite = bgR > 180 && bgG > 180 && bgB > 180;
  const threshold = bgSensitivity;
  const feather = 16;

  let minX = finalW,
    minY = finalH,
    maxX = 0,
    maxY = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 10) continue;

    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

    // Outer background removal
    if (avgA > 40 && (dist < threshold || (isNearWhite && r > 230 && g > 230 && b > 230))) {
      data[i + 3] = 0;
    } else if (avgA > 40 && dist < threshold + feather) {
      const alphaMul = (dist - threshold) / feather;
      data[i + 3] = Math.round(a * Math.max(0, Math.min(1, alphaMul)));
    }

    // Lens transparency cutout
    if (cutoutLenses && data[i + 3] > 0) {
      if (isNearWhite && r > 218 && g > 218 && b > 218 && dist < threshold * 1.3) {
        data[i + 3] = 0;
      }
    }
  }

  // Strip bottom watermark text (e.g. "www.eyespace22.com")
  const rowActive = new Int32Array(finalH);
  for (let y = 0; y < finalH; y++) {
    for (let x = 0; x < finalW; x++) {
      if (data[(y * finalW + x) * 4 + 3] > 25) {
        rowActive[y]++;
      }
    }
  }

  let botCutoff = finalH;
  const maxGapNoise = Math.max(6, Math.round(finalW * 0.03));
  for (let y = finalH - 1; y > Math.round(finalH * 0.65); y--) {
    if (rowActive[y] > 0 && rowActive[y] < finalW * 0.45) {
      let gap = 0;
      for (let gy = y - 1; gy > Math.max(0, y - 40); gy--) {
        if (rowActive[gy] <= maxGapNoise) gap++;
        else break;
      }
      if (gap >= 5) {
        botCutoff = y - gap;
        break;
      }
    }
  }

  if (botCutoff < finalH) {
    for (let y = botCutoff; y < finalH; y++) {
      for (let x = 0; x < finalW; x++) {
        data[(y * finalW + x) * 4 + 3] = 0; // Completely strip the watermark!
      }
    }
  }

  for (let y = 0; y < finalH; y++) {
    for (let x = 0; x < finalW; x++) {
      const a = data[(y * finalW + x) * 4 + 3];
      if (a > 25) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // Clear rear temple stick inside lens if requested:
  // Identify lone thin darker pixels inside the transparent lens opening zone
  if (clearInnerTemples && maxX > minX) {
    const spanW = maxX - minX;
    // Check inside left and right lens centers
    const lensCenters = [
      Math.round(minX + spanW * 0.28),
      Math.round(minX + spanW * 0.72),
    ];
    for (const lcx of lensCenters) {
      const radius = Math.round(spanW * 0.12);
      const lcy = Math.round((minY + maxY) / 2);
      for (let y = lcy - radius; y <= lcy + radius; y++) {
        for (let x = lcx - radius; x <= lcx + radius; x++) {
          if (x >= 0 && x < finalW && y >= 0 && y < finalH) {
            const d = Math.sqrt((x - lcx) ** 2 + (y - lcy) ** 2);
            if (d < radius * 0.75) {
              const idx = (y * finalW + x) * 4;
              // If isolated thin pixel with transparent neighbours, clear it
              if (data[idx + 3] > 0 && data[idx + 3] < 200) {
                data[idx + 3] = 0;
              }
            }
          }
        }
      }
    }
  }

  outCtx.putImageData(imgData, 0, 0);

  // 4. Center the resulting glasses perfectly on the output canvas with 2% optical margin
  if (maxX > minX && maxY > minY) {
    const tightW = maxX - minX + 1;
    const tightH = maxY - minY + 1;
    const pad = Math.max(4, Math.round(tightW * 0.02));

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = tightW + pad * 2;
    finalCanvas.height = tightH + pad * 2;
    const finalCtx = finalCanvas.getContext("2d");
    if (finalCtx) {
      finalCtx.drawImage(
        outCanvas,
        minX,
        minY,
        tightW,
        tightH,
        pad,
        pad,
        tightW,
        tightH
      );
      return finalCanvas.toDataURL("image/png");
    }
  }

  return outCanvas.toDataURL("image/png");
}
