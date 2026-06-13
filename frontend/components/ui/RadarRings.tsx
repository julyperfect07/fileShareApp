"use client";
import { motion } from "framer-motion";

const tealRing = (opacity: number) => `rgba(20, 184, 166, ${opacity})`;

export function RadarRings({ isDark }: { isDark: boolean }) {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: i * 200,
            height: i * 200,
            border: `1px solid ${tealRing(isDark ? 0.35 - i * 0.05 : 0.25 - i * 0.03)}`,
          }}
          animate={{ scale: [1, 1.06, 1], opacity: [1, 0.5, 1] }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.6,
            ease: "easeInOut",
          }}
        />
      ))}
    </>
  );
}
