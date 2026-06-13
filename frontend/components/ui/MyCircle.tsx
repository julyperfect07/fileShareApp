"use client";
import { motion } from "framer-motion";

interface MyCircleProps {
  myName: string;
  isDark: boolean;
  t: { connecting: string; pairDevices: string };
  onPair: () => void;
}

const tealRing = (opacity: number) => `rgba(20, 184, 166, ${opacity})`;

export function MyCircle({ myName, isDark, t, onPair }: MyCircleProps) {
  const circleBg = isDark ? "#111827" : "#f8fafc";

  return (
    <div className="absolute bottom-8 flex flex-col items-center gap-2">
      <motion.div
        className="relative"
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          className="absolute rounded-full"
          style={{ inset: -4, border: `1px solid ${tealRing(0.25)}` }}
          animate={{ scale: [1, 1.12, 1], opacity: [0.3, 0.08, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center relative z-10"
          style={{ background: circleBg, border: `1px solid ${tealRing(0.5)}` }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(20,184,166,0.9)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <circle
              cx="12"
              cy="20"
              r="1"
              fill="rgba(20,184,166,0.9)"
              stroke="none"
            />
          </svg>
        </div>
      </motion.div>
      <span
        className="text-xs"
        style={{ color: isDark ? "rgba(255,255,255,0.6)" : "#6b7280" }}
      >
        {myName || t.connecting}
      </span>
      <button
        onClick={onPair}
        className="mt-1 px-5 py-1.5 rounded-full text-teal-500 dark:text-teal-400 text-xs font-medium transition-colors hover:bg-teal-500/10"
        style={{ border: `1px solid ${tealRing(0.35)}` }}
      >
        {t.pairDevices}
      </button>
    </div>
  );
}
