import { describe, it, expect } from "vitest";
import { isbn13CheckDigit, isValidIsbn13 } from "@/lib/util/checkDigit";

describe("ISBN-13 check digit", () => {
  it("computes the check digit", () => {
    expect(isbn13CheckDigit("978030640615")).toBe(7);
    expect(isbn13CheckDigit("978014300723")).toBe(4); // 9780143007234
  });
  it("validates a correct ISBN and rejects a wrong one", () => {
    expect(isValidIsbn13("9780306406157")).toBe(true);
    expect(isValidIsbn13("978-0-306-40615-7")).toBe(true); // hyphens ignored
    expect(isValidIsbn13("9780306406158")).toBe(false); // last digit flipped
    expect(isValidIsbn13("123")).toBe(false);
  });
});
