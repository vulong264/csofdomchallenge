/**
 * Exam command words (spec §5.9). Knowing what each demands is "free marks";
 * questions can be tagged with a command word and graded against it.
 */
export const COMMAND_WORDS = {
  State: "Give a brief, specific fact or term — no explanation needed.",
  Identify: "Name or select the correct item(s).",
  Define: "Give the precise meaning of a term.",
  Describe: "Give the key features or characteristics — say what something is like.",
  Explain: "Give reasons or causes — say how or why, not just what.",
  Compare: "Identify similarities AND differences between things.",
  Suggest: "Apply your knowledge to a new situation to propose a sensible answer.",
  Calculate: "Work out a numerical answer, showing the steps.",
} as const;

export type CommandWord = keyof typeof COMMAND_WORDS;

export const commandWordHint = (cw: CommandWord): string => COMMAND_WORDS[cw];
