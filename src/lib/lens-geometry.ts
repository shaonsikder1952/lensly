// Measures where the two lenses are inside a transparent glasses PNG.
// Result is relative to the FULL image size, so padding / temples / crop do not matter.

export interface LensGeometry {
  /** distance between the two lens centres / image width */
  distRatio: number;
  /** x of the midpoint between the lenses / image width (0.5 = centred) */
  midX: number;
  /** y of the lens centres / image height */
  midY: number;
  /** smaller lens area / bigger lens area (1 = perfectly front-facing) */
  areaRatio: number;
  /** false = detection failed, defaults are used */
  measured: boolean;
}

export const DEFAULT_LENS_GEOMETRY: LensGeometry = {
  distRatio: 0.42,
  midX: 0.5,
  midY: 0.5,
  areaRatio: 1,
  measured: false,
};

function tryThreshold(
  alpha: ArrayLike<number>,
  w: number,
  h: number,
  threshold: number
): LensGeometry | null {
  const N = w * h;
  const solid = new Uint8Array(N);
  for (let i = 0; i < N; i++) solid[i] = alpha[i] > threshold ? 1 : 0;

  // label: 0 = unvisited, -1 = outside background, >0 = enclosed hole id
  const label = new Int32Array(N);
  const stack = new Int32Array(N);

  const fill = (start: number, id: number) => {
    let sp = 0;
    stack[sp++] = start;
    label[start] = id;
    let area = 0, sx = 0, sy = 0;
    while (sp > 0) {
      const p = stack[--sp];
      const x = p % w;
      const y = (p - x) / w;
      area++; sx += x; sy += y;
      if (x > 0 && !solid[p - 1] && label[p - 1] === 0) { label[p - 1] = id; stack[sp++] = p - 1; }
      if (x < w - 1 && !solid[p + 1] && label[p + 1] === 0) { label[p + 1] = id; stack[sp++] = p + 1; }
      if (y > 0 && !solid[p - w] && label[p - w] === 0) { label[p - w] = id; stack[sp++] = p - w; }
      if (y < h - 1 && !solid[p + w] && label[p + w] === 0) { label[p + w] = id; stack[sp++] = p + w; }
    }
    return { area, cx: sx / area, cy: sy / area };
  };

  // 1) outside background = transparent region touching the border
  for (let x = 0; x < w; x++) {
    if (!solid[x] && label[x] === 0) fill(x, -1);
    const b = (h - 1) * w + x;
    if (!solid[b] && label[b] === 0) fill(b, -1);
  }
  for (let y = 0; y < h; y++) {
    const l = y * w;
    if (!solid[l] && label[l] === 0) fill(l, -1);
    const r = y * w + w - 1;
    if (!solid[r] && label[r] === 0) fill(r, -1);
  }

  // 2) every remaining transparent blob is an enclosed hole (lens candidates)
  const holes: { area: number; cx: number; cy: number }[] = [];
  let id = 1;
  for (let p = 0; p < N; p++) {
    if (!solid[p] && label[p] === 0) {
      const hole = fill(p, id++);
      if (hole.area >= N * 0.012) holes.push(hole);
    }
  }
  if (holes.length < 2) return null;

  holes.sort((a, b) => b.area - a.area);
  const [a, b] = holes.slice(0, 2).sort((p, q) => p.cx - q.cx); // left, right
  const areaRatio = Math.min(a.area, b.area) / Math.max(a.area, b.area);
  const dist = (b.cx - a.cx) / w;

  if (dist < 0.15) return null;                  // both holes on the same side = not a lens pair
  if (Math.abs(a.cy - b.cy) > h * 0.3) return null;
  if (areaRatio < 0.4) return null;              // one of them is not a lens

  return {
    distRatio: dist,
    midX: (a.cx + b.cx) / 2 / w,
    midY: (a.cy + b.cy) / 2 / h,
    areaRatio,
    measured: true,
  };
}

/** Pure version (easy to test): alpha = one value per pixel, 0..255 */
export function measureLensGeometryFromAlpha(
  alpha: ArrayLike<number>,
  w: number,
  h: number
): LensGeometry {
  for (const th of [96, 64, 128, 40]) {
    const r = tryThreshold(alpha, w, h, th);
    if (r) return r;
  }
  return DEFAULT_LENS_GEOMETRY;
}

/** Browser version: call once when a frame image is loaded. */
export function measureLensGeometry(img: HTMLImageElement | HTMLCanvasElement): LensGeometry {
  const iw = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
  const ih = img instanceof HTMLImageElement ? img.naturalHeight : img.height;
  if (!iw || !ih) return DEFAULT_LENS_GEOMETRY;

  const s = Math.min(1, 360 / Math.max(iw, ih));
  const w = Math.max(1, Math.round(iw * s));
  const h = Math.max(1, Math.round(ih * s));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return DEFAULT_LENS_GEOMETRY;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = data[i * 4 + 3];
  return measureLensGeometryFromAlpha(alpha, w, h);
}
