import { describe, it, expect } from "vitest";
import {
  denaryToBinary,
  binaryToDenary,
  denaryToHex,
  hexToDenary,
  binaryToHex,
  hexToBinary,
  placeValues,
  signedPlaceValues,
  addUnsigned,
  logicalShift,
  twosComplementToSigned,
  signedToTwosComplement,
} from "@/lib/util/numberSystems";

describe("denary ⇄ binary", () => {
  it("converts denary to padded 8-bit binary", () => {
    expect(denaryToBinary(0)).toBe("00000000");
    expect(denaryToBinary(5)).toBe("00000101");
    expect(denaryToBinary(170)).toBe("10101010");
    expect(denaryToBinary(255)).toBe("11111111");
  });
  it("converts binary back to denary (and ignores spaces)", () => {
    expect(binaryToDenary("11111111")).toBe(255);
    expect(binaryToDenary("0000 0101")).toBe(5);
  });
  it("rejects values that don't fit and bad input", () => {
    expect(() => denaryToBinary(256)).toThrow();
    expect(() => denaryToBinary(-1)).toThrow();
    expect(() => binaryToDenary("1021")).toThrow();
  });
});

describe("denary ⇄ hex ⇄ binary", () => {
  it("converts denary to hex", () => {
    expect(denaryToHex(255)).toBe("FF");
    expect(denaryToHex(26)).toBe("1A");
    expect(denaryToHex(10, 1)).toBe("A");
  });
  it("parses hex (with optional 0x)", () => {
    expect(hexToDenary("FF")).toBe(255);
    expect(hexToDenary("0x1a")).toBe(26);
  });
  it("round-trips binary ⇄ hex", () => {
    expect(binaryToHex("11111111")).toBe("FF");
    expect(hexToBinary("1A")).toBe("00011010");
    expect(hexToBinary("FF")).toBe("11111111");
  });
});

describe("place values", () => {
  it("unsigned MSB-first", () => {
    expect(placeValues()).toEqual([128, 64, 32, 16, 8, 4, 2, 1]);
  });
  it("two's complement MSB is negative", () => {
    expect(signedPlaceValues()).toEqual([-128, 64, 32, 16, 8, 4, 2, 1]);
  });
});

describe("8-bit addition + overflow", () => {
  it("adds without overflow", () => {
    const r = addUnsigned(5, 10);
    expect(r.result).toBe(15);
    expect(r.binary).toBe("00001111");
    expect(r.overflow).toBe(false);
    expect(r.carryOut).toBe(false);
    expect(r.carries.every((c) => c === false)).toBe(true);
  });
  it("flags overflow above 255", () => {
    const r = addUnsigned(200, 100);
    expect(r.sum).toBe(300);
    expect(r.result).toBe(44);
    expect(r.overflow).toBe(true);
    expect(r.carryOut).toBe(true);
  });
  it("255 + 1 wraps to 0 with carry out", () => {
    const r = addUnsigned(255, 1);
    expect(r.result).toBe(0);
    expect(r.overflow).toBe(true);
    expect(r.carryOut).toBe(true);
  });
});

describe("logical shift", () => {
  it("left shift multiplies by two", () => {
    const r = logicalShift(5, "left", 1);
    expect(r.output).toBe("00001010");
    expect(r.valueAfter).toBe(10);
    expect(r.lostBits).toBe("0");
  });
  it("right shift divides by two, losing the LSB", () => {
    const r = logicalShift(5, "right", 1);
    expect(r.output).toBe("00000010");
    expect(r.valueAfter).toBe(2);
    expect(r.lostBits).toBe("1");
  });
  it("left shift can lose significant bits (overflow off the end)", () => {
    const r = logicalShift(200, "left", 1);
    expect(r.lostBits).toBe("1");
    expect(r.valueAfter).toBe(144); // 11001000 -> 10010000
  });
});

describe("two's complement", () => {
  it("encodes signed integers", () => {
    expect(signedToTwosComplement(0)).toBe("00000000");
    expect(signedToTwosComplement(127)).toBe("01111111");
    expect(signedToTwosComplement(-1)).toBe("11111111");
    expect(signedToTwosComplement(-128)).toBe("10000000");
  });
  it("decodes signed integers (sign bit)", () => {
    expect(twosComplementToSigned("00000000")).toBe(0);
    expect(twosComplementToSigned("01111111")).toBe(127);
    expect(twosComplementToSigned("11111111")).toBe(-1);
    expect(twosComplementToSigned("10000000")).toBe(-128);
  });
  it("round-trips and rejects out-of-range", () => {
    for (let v = -128; v <= 127; v += 1) {
      expect(twosComplementToSigned(signedToTwosComplement(v))).toBe(v);
    }
    expect(() => signedToTwosComplement(128)).toThrow();
    expect(() => signedToTwosComplement(-129)).toThrow();
  });
});
