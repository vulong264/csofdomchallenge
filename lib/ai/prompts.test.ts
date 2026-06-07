import { describe, expect, it } from "vitest";
import type { GradeRequest } from "./types";
import { graderSystemPrompt, graderUserPrompt, tutorSystemPrompt, type TutorScope } from "./prompts";

const scope: TutorScope = {
  title: "Data Representation",
  syllabusRef: "Topic 1",
  conceptSummary: "Binary, hex, two's complement, text, sound, images, storage.",
  misconceptions: ["1000 0000 is −128, not 128.", "Using 1000 instead of 1024."],
};

describe("tutorSystemPrompt", () => {
  it("scopes to the unit and embeds its ground-truth content", () => {
    const p = tutorSystemPrompt(scope);
    expect(p).toContain("Data Representation");
    expect(p).toContain("Topic 1");
    expect(p).toContain(scope.conceptSummary);
    scope.misconceptions.forEach((m) => expect(p).toContain(m));
  });

  it("forbids handing over boss answers (protects mastery gating)", () => {
    expect(tutorSystemPrompt(scope)).toMatch(/NEVER write a complete answer/i);
  });

  it("pins pseudocode to Cambridge 0478 conventions", () => {
    const p = tutorSystemPrompt(scope);
    expect(p).toContain("UPPERCASE");
    expect(p).toContain("←");
  });
});

describe("graderSystemPrompt", () => {
  const examReq: GradeRequest = {
    mode: "exam",
    unitId: "data-representation",
    prompt: "Explain why lossless compression can reduce file size.",
    studentAnswer: "x",
    commandWord: "Explain",
    markPoints: ["Identifies redundancy is removed/encoded", "States the original can be perfectly reconstructed"],
    maxMarks: 2,
    reference: "RLE replaces runs; fully reversible.",
  };

  it("exam mode lists every mark point and the maximum", () => {
    const p = graderSystemPrompt(examReq);
    examReq.markPoints!.forEach((mp) => expect(p).toContain(mp));
    expect(p).toContain("Maximum marks: 2");
    expect(p).toMatch(/examiner/i);
  });

  it("exam mode surfaces the command word and its meaning", () => {
    const p = graderSystemPrompt(examReq);
    expect(p).toContain("Explain");
    expect(p).toMatch(/reasons or causes/i); // commandWordHint for Explain
  });

  it("explain mode is lenient and formative, not gating", () => {
    const p = graderSystemPrompt({ ...examReq, mode: "explain" });
    expect(p).toMatch(/formative|lenient/i);
    expect(p).not.toContain("examiner marking");
  });

  it("defaults max marks to the number of mark points when omitted", () => {
    const { maxMarks: _omit, ...rest } = examReq;
    void _omit;
    expect(graderSystemPrompt(rest)).toContain("Maximum marks: 2");
  });
});

describe("graderUserPrompt", () => {
  it("includes the task and the answer, and flags a blank answer", () => {
    const base: GradeRequest = {
      mode: "exam",
      unitId: "u",
      prompt: "Define a byte.",
      studentAnswer: "8 bits",
    };
    expect(graderUserPrompt(base)).toContain("Define a byte.");
    expect(graderUserPrompt(base)).toContain("8 bits");
    expect(graderUserPrompt({ ...base, studentAnswer: "   " })).toContain("(left blank)");
  });
});
