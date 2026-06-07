import type { Unit } from "./types";

/**
 * Sector 0 — Training Grounds. The "dummy unit" that proves the whole loop
 * (learn → drill → boss → unlock at 80%) while doubling as real onboarding:
 * it teaches how the dungeon works AND a genuine taste of binary, so it's not
 * throwaway. Not a reward sector — clearing it pays no cash/Nintendo bonus.
 */
const UNIT_ID = "sector-0";

export const trainingGrounds: Unit = {
  id: UNIT_ID,
  order: 0,
  syllabusRef: "—",
  paper: 1,
  title: "Training Grounds",
  blurb: "Learn how the dungeon works — then warm up your brain on a little binary.",
  sector: { number: 0, name: "Training Grounds", boss: "The Tutorial Golem" },
  isRewardSector: false,
  lessons: [
    {
      id: "s0-l1",
      unitId: UNIT_ID,
      topicCode: "0.1",
      title: "How the Dungeon works",
      summary: "Sectors, Boss Fights, and how you unlock what's next.",
      widgets: ["tour-demo"],
      cards: [
        {
          id: "s0-l1-c1",
          title: "Welcome to CS of Doom",
          blocks: [
            {
              kind: "p",
              text: "This course is a five-sector dungeon. Each sector is one topic of IGCSE Computer Science, and each ends in a **Boss Fight** — a scored test of everything in that sector.",
            },
            {
              kind: "callout",
              tone: "key",
              title: "The one rule",
              text: "Beat a boss with a score of **80% or higher** to descend to the next sector. You can't skip ahead — the next sector stays locked until you do.",
            },
            {
              kind: "p",
              text: "You can retake any boss as many times as you like, and you can revisit a cleared sector whenever you want.",
            },
          ],
        },
        {
          id: "s0-l1-c2",
          title: "Learn → Drill → Boss",
          blocks: [
            { kind: "h", text: "Every sector has the same four rooms" },
            {
              kind: "list",
              items: [
                "**Learn** — short concept cards with interactive widgets you can actually play with.",
                "**Drill** — flashcards and quick questions with instant feedback. Low stakes, just practice.",
                "**Tutor** — an AI guide that gives hints (it won't just hand you boss answers).",
                "**Boss Fight** — the scored test. Pass at 80% to clear the sector.",
              ],
            },
          ],
        },
        {
          id: "s0-l1-c3",
          title: "Flawless & the Vault",
          blocks: [
            {
              kind: "callout",
              tone: "info",
              title: "Flawless (No-Hit)",
              text: "Beat a boss at 80%+ on your **first attempt** and you earn a permanent Flawless trophy — plus a cash bonus.",
            },
            {
              kind: "callout",
              tone: "mistake",
              title: "Don't rush in blind",
              text: "Failing a boss costs the Flawless bonus for that sector forever. The smart play: learn it, then pass first time.",
            },
            {
              kind: "p",
              text: "There's also a **Speed Vault** of cash that shrinks every week. Finish the whole dungeon early and you keep more of it. Quality and speed both pay.",
            },
          ],
        },
      ],
      recall: [
        {
          id: "s0-l1-r1",
          prompt: "What score do you need to beat a Boss Fight and unlock the next sector?",
          answer: "80% or higher.",
        },
        {
          id: "s0-l1-r2",
          prompt: "In your own words, what does 'Flawless' mean?",
          answer: "Passing a boss at 80%+ on your very first attempt.",
        },
      ],
    },
    {
      id: "s0-l2",
      unitId: UNIT_ID,
      topicCode: "0.2",
      title: "Reading the numbers (warm-up)",
      summary: "A first taste of binary — the language Sector 1 is all about.",
      widgets: ["tour-demo"],
      cards: [
        {
          id: "s0-l2-c1",
          title: "Computers count in 2s",
          blocks: [
            {
              kind: "p",
              text: "People count in base 10 (ten digits, 0–9). Computers count in **binary** — base 2, just two digits: **0 and 1**. Each digit is a **bit**.",
            },
            {
              kind: "p",
              text: "Each place in a binary number is worth double the one to its right. For a 4-bit number the places are:",
            },
            {
              kind: "kv",
              rows: [
                { k: "8", v: "1 = eight" },
                { k: "4", v: "0 = nothing" },
                { k: "2", v: "1 = two" },
                { k: "1", v: "0 = nothing" },
              ],
            },
            {
              kind: "p",
              text: "So `1010` = 8 + 0 + 2 + 0 = **10**. Add up the places where there's a 1 — that's the whole trick. Try the toggles below.",
            },
            { kind: "widget", widget: "tour-demo", caption: "Flip the bits and watch the number change." },
          ],
        },
        {
          id: "s0-l2-c2",
          title: "Bits and bytes",
          blocks: [
            {
              kind: "callout",
              tone: "key",
              text: "8 bits = 1 **byte**. A byte can hold 256 different values (0–255).",
            },
            {
              kind: "p",
              text: "That's all the binary you need for now — Sector 1 (The Binary Hydra) goes deep on it.",
            },
          ],
        },
      ],
      recall: [
        {
          id: "s0-l2-r1",
          prompt: "How many different values can a single bit store?",
          answer: "Two — 0 or 1.",
        },
        {
          id: "s0-l2-r2",
          prompt: "What is binary 1010 in denary (normal numbers)?",
          answer: "10 (that's 8 + 2).",
        },
      ],
    },
  ],
  flashcards: [
    { id: "s0-f1", unitId: UNIT_ID, topicCode: "0.1", front: "Pass mark for a Boss Fight?", back: "80% or higher." },
    {
      id: "s0-f2",
      unitId: UNIT_ID,
      topicCode: "0.1",
      front: "What earns the Flawless bonus?",
      back: "Passing a boss at 80%+ on the first attempt.",
    },
    { id: "s0-f3", unitId: UNIT_ID, topicCode: "0.2", front: "1 byte = ? bits", back: "8 bits." },
    { id: "s0-f4", unitId: UNIT_ID, topicCode: "0.2", front: "Binary uses which two digits?", back: "0 and 1." },
  ],
  drill: [
    {
      id: "s0-d1",
      unitId: UNIT_ID,
      topicCode: "0.1",
      type: "mcq",
      difficulty: "intro",
      prompt: "To unlock the next sector you must…",
      explanation: "Bosses gate the next sector — you have to score at least 80%.",
      choices: [
        { id: "a", text: "Score 80% or higher on the Boss Fight" },
        { id: "b", text: "Just attempt the Boss Fight", misconception: "attempting isn't enough — you need 80%+." },
        { id: "c", text: "Finish all the Learn cards", misconception: "learning helps, but the boss is the gate." },
      ],
      correctId: "a",
    },
    {
      id: "s0-d2",
      unitId: UNIT_ID,
      topicCode: "0.1",
      type: "truefalse",
      difficulty: "intro",
      prompt: "You can retake a Boss Fight if you don't pass.",
      explanation: "Yes — retake as many times as you need. Every attempt is logged.",
      answer: true,
    },
    {
      id: "s0-d3",
      unitId: UNIT_ID,
      topicCode: "0.2",
      type: "numeric",
      difficulty: "intro",
      prompt: "What is binary 0011 in denary?",
      explanation: "0011 = 2 + 1 = 3.",
      answer: 3,
    },
    {
      id: "s0-d4",
      unitId: UNIT_ID,
      topicCode: "0.1",
      type: "mcq",
      difficulty: "core",
      prompt: "'Flawless' means you…",
      explanation: "Flawless is about the first try, not a perfect score.",
      choices: [
        { id: "a", text: "Passed the boss (80%+) on your first attempt" },
        { id: "b", text: "Scored exactly 100%", misconception: "Flawless is first-try ≥80%, not a perfect score." },
      ],
      correctId: "a",
    },
  ],
  masteryTest: {
    passThreshold: 0.8,
    questions: [
      {
        id: "s0-t1",
        unitId: UNIT_ID,
        topicCode: "0.1",
        type: "mcq",
        difficulty: "intro",
        commandWord: "Identify",
        prompt: "What is the pass mark to clear a sector?",
        explanation: "80% or higher clears the boss.",
        choices: [
          { id: "a", text: "80%" },
          { id: "b", text: "50%", misconception: "half marks isn't enough here — the gate is 80%." },
          { id: "c", text: "100%", misconception: "you don't need to be perfect — 80% clears it." },
        ],
        correctId: "a",
      },
      {
        id: "s0-t2",
        unitId: UNIT_ID,
        topicCode: "0.1",
        type: "truefalse",
        difficulty: "intro",
        prompt: "A failed first attempt loses the Flawless bonus for that sector.",
        explanation: "Correct — Flawless needs a clean first pass.",
        answer: true,
      },
      {
        id: "s0-t3",
        unitId: UNIT_ID,
        topicCode: "0.2",
        type: "numeric",
        difficulty: "core",
        commandWord: "Calculate",
        prompt: "Convert binary 1010 to denary.",
        explanation: "8 + 0 + 2 + 0 = 10.",
        answer: 10,
      },
      {
        id: "s0-t4",
        unitId: UNIT_ID,
        topicCode: "0.2",
        type: "fill",
        difficulty: "intro",
        prompt: "1 byte = ____ bits (write the number).",
        explanation: "A byte is 8 bits.",
        answer: "8",
      },
      {
        id: "s0-t5",
        unitId: UNIT_ID,
        topicCode: "0.1",
        type: "mcq",
        difficulty: "core",
        prompt: "Which room gives instant feedback for low-stakes practice?",
        explanation: "Drill is the practice room — instant feedback, no score pressure.",
        choices: [
          { id: "a", text: "Drill" },
          { id: "b", text: "Boss Fight", misconception: "the boss is the scored test, not practice." },
          { id: "c", text: "Learn", misconception: "Learn is the concept cards; Drill is the quiz practice." },
        ],
        correctId: "a",
      },
      {
        id: "s0-t6",
        unitId: UNIT_ID,
        topicCode: "0.2",
        type: "order",
        difficulty: "core",
        prompt: "Put these storage units in order, smallest first.",
        explanation: "A bit is one digit, a nibble is 4 bits, a byte is 8 bits.",
        items: [
          { id: "byte", text: "byte" },
          { id: "bit", text: "bit" },
          { id: "nibble", text: "nibble" },
        ],
        correctOrder: ["bit", "nibble", "byte"],
      },
    ],
  },
  tutor: {
    conceptSummary:
      "Sector 0 teaches how the app works (sectors, Boss Fights, the 80% gate, Flawless, the Speed Vault) plus a first taste of binary: bits, place values (8/4/2/1), reading a binary number into denary, and 1 byte = 8 bits.",
    misconceptions: [
      "Thinking that attempting a boss is enough — you must score 80%+.",
      "Thinking Flawless means 100% — it means passing on the first attempt.",
      "Confusing the rooms: Learn = concepts, Drill = practice, Boss = the scored test.",
    ],
  },
};
