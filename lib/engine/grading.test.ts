import { describe, it, expect } from "vitest";
import { gradeQuestion } from "@/lib/engine/grading";
import type { Question } from "@/lib/domain/questions";

const base = { unitId: "u1", topicCode: "1.1", explanation: "Because reasons.", difficulty: "core" as const };

describe("gradeQuestion", () => {
  it("grades MCQ and surfaces the misconception on a wrong pick", () => {
    const q: Question = {
      ...base,
      id: "q1",
      type: "mcq",
      prompt: "Sample rate is…",
      choices: [
        { id: "a", text: "samples per second" },
        { id: "b", text: "bits per sample", misconception: "that's sample resolution, not rate." },
      ],
      correctId: "a",
    };
    expect(gradeQuestion(q, { type: "mcq", choiceId: "a" })).toMatchObject({ correct: true, marks: 1 });
    const wrong = gradeQuestion(q, { type: "mcq", choiceId: "b" });
    expect(wrong.correct).toBe(false);
    expect(wrong.feedback).toContain("sample resolution");
    expect(wrong.feedback).toContain("samples per second"); // states the correct answer
  });

  it("grades true/false", () => {
    const q: Question = { ...base, id: "q2", type: "truefalse", prompt: "Lossless is reversible?", answer: true };
    expect(gradeQuestion(q, { type: "truefalse", value: true }).correct).toBe(true);
    expect(gradeQuestion(q, { type: "truefalse", value: false }).correct).toBe(false);
  });

  it("grades numeric with tolerance", () => {
    const q: Question = { ...base, id: "q3", type: "numeric", prompt: "FF in denary?", answer: 255 };
    expect(gradeQuestion(q, { type: "numeric", value: 255 }).correct).toBe(true);
    expect(gradeQuestion(q, { type: "numeric", value: 254 }).correct).toBe(false);
  });

  it("grades fill (case-insensitive + accepted variants)", () => {
    const q: Question = {
      ...base,
      id: "q4",
      type: "fill",
      prompt: "1010 in hex?",
      answer: "A",
      accept: ["0xA"],
    };
    expect(gradeQuestion(q, { type: "fill", value: " a " }).correct).toBe(true);
    expect(gradeQuestion(q, { type: "fill", value: "0xA" }).correct).toBe(true);
    expect(gradeQuestion(q, { type: "fill", value: "B" }).correct).toBe(false);
  });

  it("grades multi-select as an exact set", () => {
    const q: Question = {
      ...base,
      id: "q5",
      type: "multi",
      prompt: "Pick the lossless methods",
      choices: [
        { id: "rle", text: "RLE" },
        { id: "jpg", text: "lower resolution", misconception: "that's lossy — data is discarded." },
        { id: "flac", text: "FLAC" },
      ],
      correctIds: ["rle", "flac"],
    };
    expect(gradeQuestion(q, { type: "multi", choiceIds: ["rle", "flac"] }).correct).toBe(true);
    expect(gradeQuestion(q, { type: "multi", choiceIds: ["rle"] }).correct).toBe(false);
    expect(gradeQuestion(q, { type: "multi", choiceIds: ["rle", "jpg"] }).correct).toBe(false);
  });

  it("grades order and circuit", () => {
    const order: Question = {
      ...base,
      id: "q6",
      type: "order",
      prompt: "Smallest to largest",
      items: [
        { id: "bit", text: "bit" },
        { id: "byte", text: "byte" },
        { id: "kib", text: "KiB" },
      ],
      correctOrder: ["bit", "byte", "kib"],
    };
    expect(gradeQuestion(order, { type: "order", order: ["bit", "byte", "kib"] }).correct).toBe(true);
    expect(gradeQuestion(order, { type: "order", order: ["byte", "bit", "kib"] }).correct).toBe(false);

    const circuit: Question = {
      ...base,
      id: "q7",
      type: "circuit",
      prompt: "Build XOR",
      variables: ["A", "B"],
      targetOutputs: [false, true, true, false],
    };
    expect(gradeQuestion(circuit, { type: "circuit", outputs: [false, true, true, false] }).correct).toBe(true);
    expect(gradeQuestion(circuit, { type: "circuit", outputs: [false, false, true, false] }).correct).toBe(false);
  });
});
