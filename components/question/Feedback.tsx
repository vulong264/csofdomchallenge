import { motion } from "framer-motion";
import type { GradeResult } from "@/lib/engine/grading";
import { cn } from "@/lib/util/cn";

export function Feedback({ result }: { result: GradeResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-lg border p-3 text-sm",
        result.correct ? "border-success/40 bg-success/10" : "border-danger/40 bg-danger/10",
      )}
    >
      <div className={cn("mb-1 font-semibold", result.correct ? "text-success" : "text-danger")}>
        {result.correct ? "✓ Correct" : "✗ Not quite"}
      </div>
      <p className="text-text/90">{result.feedback}</p>
    </motion.div>
  );
}
