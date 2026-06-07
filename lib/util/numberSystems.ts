/**
 * Number systems (IGCSE 0478 §1.1).
 * Denary ⇄ binary ⇄ hex, 8-bit addition with overflow, logical shifts,
 * and two's complement. All functions are pure and unit-tested.
 */

export const BITS = 8; // default register width

const assertNonNegInt = (n: number, label: string): void => {
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`${label} expects a non-negative integer, got ${n}`);
  }
};

/** Place values for an unsigned register, MSB first: [128,64,32,16,8,4,2,1]. */
export function placeValues(bits = BITS): number[] {
  return Array.from({ length: bits }, (_, i) => 2 ** (bits - 1 - i));
}

/** Place values for a two's-complement register — the MSB is negative. */
export function signedPlaceValues(bits = BITS): number[] {
  const pv = placeValues(bits);
  pv[0] = -pv[0];
  return pv;
}

export const isBinaryString = (s: string): boolean =>
  /^[01]+$/.test(s.replace(/\s+/g, ""));

export const isHexString = (s: string): boolean =>
  /^[0-9a-fA-F]+$/.test(s.replace(/^0x/i, "").replace(/\s+/g, ""));

export function denaryToBinary(n: number, bits = BITS): string {
  assertNonNegInt(n, "denaryToBinary");
  const max = 2 ** bits - 1;
  if (n > max) throw new Error(`${n} does not fit in ${bits} bits (max ${max})`);
  return n.toString(2).padStart(bits, "0");
}

export function binaryToDenary(bin: string): number {
  const cleaned = bin.replace(/\s+/g, "");
  if (!isBinaryString(cleaned)) throw new Error(`not a binary string: "${bin}"`);
  return parseInt(cleaned, 2);
}

export function denaryToHex(n: number, minDigits = 2): string {
  assertNonNegInt(n, "denaryToHex");
  return n.toString(16).toUpperCase().padStart(minDigits, "0");
}

export function hexToDenary(hex: string): number {
  const cleaned = hex.replace(/^0x/i, "").replace(/\s+/g, "");
  if (!isHexString(cleaned)) throw new Error(`not a hex string: "${hex}"`);
  return parseInt(cleaned, 16);
}

/** Binary → hex (nibble-aligned, min 2 digits). */
export function binaryToHex(bin: string, minDigits = 2): string {
  return denaryToHex(binaryToDenary(bin), minDigits);
}

/** Hex → binary, padded to a whole number of nibbles. */
export function hexToBinary(hex: string): string {
  const bin = hexToDenary(hex).toString(2);
  const pad = Math.max(4, Math.ceil(bin.length / 4) * 4);
  return bin.padStart(pad, "0");
}

export interface AddResult {
  bits: number;
  a: number;
  b: number;
  /** True arithmetic sum (a + b), may exceed the register. */
  sum: number;
  /** Sum wrapped into `bits` (what the register actually holds). */
  result: number;
  binary: string;
  /** Carry out of the most-significant bit. */
  carryOut: boolean;
  /** The result needed more than `bits` (8-bit register overflows above 255). */
  overflow: boolean;
  /** Carry INTO each column, LSB-first — for the visual adder widget. */
  carries: boolean[];
}

/** Add two unsigned integers in a fixed-width register, reporting overflow. */
export function addUnsigned(a: number, b: number, bits = BITS): AddResult {
  const max = 2 ** bits - 1;
  assertNonNegInt(a, "addUnsigned(a)");
  assertNonNegInt(b, "addUnsigned(b)");
  if (a > max || b > max) throw new Error(`operands must be 0..${max}`);

  const sum = a + b;
  const result = sum % 2 ** bits;
  const aBits = denaryToBinary(a, bits).split("").map(Number).reverse();
  const bBits = denaryToBinary(b, bits).split("").map(Number).reverse();

  const carries: boolean[] = [];
  let carry = 0;
  for (let i = 0; i < bits; i++) {
    carries[i] = carry === 1; // carry INTO column i
    const s = aBits[i] + bBits[i] + carry;
    carry = s > 1 ? 1 : 0;
  }

  return {
    bits,
    a,
    b,
    sum,
    result,
    binary: denaryToBinary(result, bits),
    carryOut: carry === 1,
    overflow: sum > max,
    carries,
  };
}

export interface ShiftResult {
  bits: number;
  direction: "left" | "right";
  places: number;
  input: string;
  output: string;
  /** Bits shifted off the end (lost). */
  lostBits: string;
  valueBefore: number;
  valueAfter: number;
}

/** Logical shift: left = ×2 per place, right = ÷2; vacated positions get 0, shifted-off bits are lost. */
export function logicalShift(
  value: number,
  direction: "left" | "right",
  places: number,
  bits = BITS,
): ShiftResult {
  if (!Number.isInteger(places) || places < 0) throw new Error("places must be a non-negative integer");
  const input = denaryToBinary(value, bits);
  let arr = input.split("");
  const lost: string[] = [];
  for (let p = 0; p < places; p++) {
    if (direction === "left") {
      lost.push(arr[0]);
      arr = [...arr.slice(1), "0"];
    } else {
      lost.push(arr[bits - 1]);
      arr = ["0", ...arr.slice(0, bits - 1)];
    }
  }
  const output = arr.join("");
  return {
    bits,
    direction,
    places,
    input,
    output,
    lostBits: lost.join(""),
    valueBefore: value,
    valueAfter: binaryToDenary(output),
  };
}

/** Interpret a fixed-width bit pattern as a signed two's-complement value. */
export function twosComplementToSigned(bin: string, bits = BITS): number {
  const cleaned = bin.replace(/\s+/g, "");
  if (cleaned.length !== bits || !isBinaryString(cleaned)) {
    throw new Error(`expected a ${bits}-bit binary string, got "${bin}"`);
  }
  const unsigned = parseInt(cleaned, 2);
  const signBit = 2 ** (bits - 1);
  return unsigned >= signBit ? unsigned - 2 ** bits : unsigned;
}

/** Represent a signed integer in two's complement of the given width. */
export function signedToTwosComplement(value: number, bits = BITS): string {
  const min = -(2 ** (bits - 1));
  const max = 2 ** (bits - 1) - 1;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${value} is out of range for ${bits}-bit two's complement (${min}..${max})`);
  }
  if (value >= 0) return denaryToBinary(value, bits);
  return denaryToBinary(2 ** bits + value, bits);
}
