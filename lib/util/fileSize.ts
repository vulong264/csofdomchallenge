/**
 * Storage & file-size maths (IGCSE 0478 §1.2–1.3).
 * IEC units step by ×1024 (NOT 1000). Image size = pixels × colour depth;
 * sound size = sample rate × resolution × seconds. All sizes computed in bits.
 */

export const BITS_PER_BYTE = 8;
export const BYTE_STEP = 1024;

export const BYTE_UNITS = ["B", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB"] as const;
export type ByteUnit = (typeof BYTE_UNITS)[number];

export const bitsToBytes = (bits: number): number => bits / BITS_PER_BYTE;

/** Number of distinct colours a given colour depth can encode. */
export const coloursFromDepth = (depthBits: number): number => 2 ** depthBits;

/** Convert a number of bytes to a specific IEC unit (×1024 steps). */
export function convertBytes(bytes: number, to: ByteUnit): number {
  const idx = BYTE_UNITS.indexOf(to);
  if (idx < 0) throw new Error(`unknown unit ${to}`);
  return bytes / BYTE_STEP ** idx;
}

export interface HumanSize {
  value: number;
  unit: ByteUnit;
  label: string;
}

/** Pick the largest IEC unit where the value is ≥ 1, rounding for display. */
export function humanBytes(bytes: number, fractionDigits = 2): HumanSize {
  let value = bytes;
  let i = 0;
  while (value >= BYTE_STEP && i < BYTE_UNITS.length - 1) {
    value /= BYTE_STEP;
    i += 1;
  }
  const rounded = Number(value.toFixed(fractionDigits));
  return { value: rounded, unit: BYTE_UNITS[i], label: `${rounded} ${BYTE_UNITS[i]}` };
}

export interface ImageSize {
  widthPx: number;
  heightPx: number;
  colourDepthBits: number;
  pixels: number;
  colours: number;
  bits: number;
  bytes: number;
  human: string;
}

/** Raw image file size in bits = pixels × colour depth. */
export const imageBits = (pixels: number, colourDepthBits: number): number =>
  pixels * colourDepthBits;

export function imageFileSize(widthPx: number, heightPx: number, colourDepthBits: number): ImageSize {
  const pixels = widthPx * heightPx;
  const bits = imageBits(pixels, colourDepthBits);
  const bytes = bitsToBytes(bits);
  return {
    widthPx,
    heightPx,
    colourDepthBits,
    pixels,
    colours: coloursFromDepth(colourDepthBits),
    bits,
    bytes,
    human: humanBytes(bytes).label,
  };
}

export interface SoundSize {
  sampleRateHz: number;
  sampleResolutionBits: number;
  seconds: number;
  channels: number;
  samples: number;
  bits: number;
  bytes: number;
  human: string;
}

/**
 * Sound file size in bits = sample rate × sample resolution × seconds (× channels).
 * `channels` defaults to 1 (mono) to match the 0478 formula exactly.
 */
export function soundFileSize(
  sampleRateHz: number,
  sampleResolutionBits: number,
  seconds: number,
  channels = 1,
): SoundSize {
  const samples = sampleRateHz * seconds * channels;
  const bits = samples * sampleResolutionBits;
  const bytes = bitsToBytes(bits);
  return {
    sampleRateHz,
    sampleResolutionBits,
    seconds,
    channels,
    samples,
    bits,
    bytes,
    human: humanBytes(bytes).label,
  };
}
