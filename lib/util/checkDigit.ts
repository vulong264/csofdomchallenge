/**
 * Check digits (IGCSE 0478 §2.2) — used in ISBNs and barcodes to detect data
 * entry errors. ISBN-13: weight digits 1,3,1,3,…; the check digit makes the
 * weighted sum a multiple of 10.
 */

export function isbn13CheckDigit(first12: string): number {
  const digits = first12.replace(/[^0-9]/g, "").split("").map(Number);
  if (digits.length !== 12) throw new Error("ISBN-13 needs 12 digits before the check digit");
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10;
}

export function isValidIsbn13(isbn: string): boolean {
  const digits = isbn.replace(/[^0-9]/g, "");
  if (digits.length !== 13) return false;
  return isbn13CheckDigit(digits.slice(0, 12)) === Number(digits[12]);
}
