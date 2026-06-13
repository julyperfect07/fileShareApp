"use client";
import { motion, AnimatePresence } from "framer-motion";

interface CenterTextProps {
  show: boolean;
  isDark: boolean;
  t: { pairToSend: string; pairSubtitle: string };
}

export function CenterText({ show, isDark, t }: CenterTextProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="absolute flex flex-col items-center gap-2 text-center pointer-events-none"
          style={{ top: "35%" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-teal-500 dark:text-teal-400 text-base font-medium tracking-wide">
            {t.pairToSend}
          </p>
          <p
            className="text-sm max-w-xs"
            style={{ color: isDark ? "rgba(255,255,255,0.25)" : "#6b7280" }}
          >
            {t.pairSubtitle}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
