import { describe, it, expect } from "vitest";
import {
  humanBytes,
  convertBytes,
  coloursFromDepth,
  imageFileSize,
  soundFileSize,
  bitsToBytes,
} from "@/lib/util/fileSize";

describe("IEC units step by ×1024 (not 1000)", () => {
  it("stays in bytes below 1024", () => {
    expect(humanBytes(500)).toMatchObject({ value: 500, unit: "B" });
    expect(humanBytes(1000)).toMatchObject({ unit: "B" }); // NOT 1 KiB
  });
  it("uses 1024 as the step", () => {
    expect(humanBytes(1024)).toMatchObject({ value: 1, unit: "KiB" });
    expect(humanBytes(1024 * 1024)).toMatchObject({ value: 1, unit: "MiB" });
    expect(humanBytes(1536)).toMatchObject({ value: 1.5, unit: "KiB" });
  });
  it("converts between units", () => {
    expect(convertBytes(1024 * 1024, "MiB")).toBe(1);
    expect(convertBytes(1024 ** 3, "GiB")).toBe(1);
  });
});

describe("colour depth", () => {
  it("colours = 2^depth", () => {
    expect(coloursFromDepth(1)).toBe(2);
    expect(coloursFromDepth(8)).toBe(256);
    expect(coloursFromDepth(24)).toBe(16_777_216);
  });
});

describe("image file size = pixels × colour depth", () => {
  it("computes bits/bytes for a 100×100 24-bit image", () => {
    const img = imageFileSize(100, 100, 24);
    expect(img.pixels).toBe(10_000);
    expect(img.bits).toBe(240_000);
    expect(img.bytes).toBe(30_000);
    expect(img.human).toBe("29.3 KiB");
    expect(img.colours).toBe(16_777_216);
  });
});

describe("sound file size = sample rate × resolution × seconds", () => {
  it("computes bits/bytes for CD-quality 10s mono", () => {
    const snd = soundFileSize(44_100, 16, 10);
    expect(snd.samples).toBe(441_000);
    expect(snd.bits).toBe(7_056_000);
    expect(snd.bytes).toBe(882_000);
  });
  it("doubles for stereo (2 channels)", () => {
    const mono = soundFileSize(44_100, 16, 10, 1);
    const stereo = soundFileSize(44_100, 16, 10, 2);
    expect(stereo.bits).toBe(mono.bits * 2);
  });
  it("bitsToBytes divides by 8", () => {
    expect(bitsToBytes(240_000)).toBe(30_000);
  });
});
