/**
 * Parity checking (IGCSE 0478 §2.2): odd & even parity, parity byte / block,
 * and single-bit error location at a row/column intersection.
 */

export type Parity = "even" | "odd";
export type Bit = 0 | 1;

function toBits(bits: Bit[] | string): number[] {
  if (typeof bits === "string") return bits.replace(/\s+/g, "").split("").map(Number);
  return bits;
}

export function countOnes(bits: Bit[] | string): number {
  return toBits(bits).reduce((acc, b) => acc + (b ? 1 : 0), 0);
}

/** The parity bit to append so the data + bit together satisfy the scheme. */
export function parityBit(dataBits: Bit[] | string, scheme: Parity): Bit {
  const ones = countOnes(dataBits);
  const even = ones % 2 === 0;
  if (scheme === "even") return even ? 0 : 1;
  return even ? 1 : 0;
}

/** Does a received unit (data + parity bit included) satisfy the scheme? */
export function checkParity(allBits: Bit[] | string, scheme: Parity): boolean {
  const ones = countOnes(allBits);
  return scheme === "even" ? ones % 2 === 0 : ones % 2 === 1;
}

/** Parity bit for each row (the appended column). */
export function rowParities(rows: Bit[][], scheme: Parity): Bit[] {
  return rows.map((r) => parityBit(r, scheme));
}

/** Parity bit for each column (the parity byte). */
export function colParities(rows: Bit[][], scheme: Parity): Bit[] {
  const cols = rows[0]?.length ?? 0;
  const result: Bit[] = [];
  for (let c = 0; c < cols; c += 1) {
    result.push(parityBit(rows.map((r) => r[c]), scheme));
  }
  return result;
}

/**
 * Locate a single flipped data bit by comparing recomputed parity against the
 * transmitted row/column parity. A single error flips exactly one row and one
 * column parity, pinpointing it. Returns null if not exactly one of each.
 */
export function locateSingleBitError(
  received: Bit[][],
  transmittedRowParity: Bit[],
  transmittedColParity: Bit[],
  scheme: Parity,
): { row: number; col: number } | null {
  const rp = rowParities(received, scheme);
  const cp = colParities(received, scheme);
  const badRows = rp.flatMap((v, i) => (v !== transmittedRowParity[i] ? [i] : []));
  const badCols = cp.flatMap((v, i) => (v !== transmittedColParity[i] ? [i] : []));
  if (badRows.length === 1 && badCols.length === 1) {
    return { row: badRows[0], col: badCols[0] };
  }
  return null;
}
