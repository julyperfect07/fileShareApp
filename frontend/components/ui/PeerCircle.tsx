"use client";
import { motion } from "framer-motion";
import { DataConnection } from "peerjs";

interface ConnectedPeer {
  peerId: string;
  name: string;
  conn: DataConnection;
}

interface PeerCircleProps {
  peer: ConnectedPeer;
  index: number;
  total: number;
  isSending: boolean;
  isDark: boolean;
  t: { sending: string; clickToSend: string };
  onClick: () => void;
}

const tealRing = (opacity: number) => `rgba(20, 184, 166, ${opacity})`;

export function PeerCircle({
  peer,
  index,
  total,
  isSending,
  isDark,
  t,
  onClick,
}: PeerCircleProps) {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const radius = 180;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  const circleBg = isDark ? "#111827" : "#f8fafc";
  const circleBorder = isDark ? tealRing(0.3) : tealRing(0.5);

  return (
    <motion.div
      className="absolute flex flex-col items-center gap-2 cursor-pointer select-none"
      style={{ left: "50%", top: "50%" }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: 1,
        x: `calc(-50% + ${x}px)`,
        y: `calc(-50% + ${y}px)`,
      }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ type: "spring", stiffness: 250, damping: 22 }}
      onClick={onClick}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="relative">
        <motion.div
          className="absolute rounded-full"
          style={{ inset: -6, border: `1px solid ${tealRing(0.4)}` }}
          animate={
            isSending
              ? { scale: [1, 1.6], opacity: [0.8, 0] }
              : { scale: [1, 1.15, 1], opacity: [0.4, 0.1, 0.4] }
          }
          transition={
            isSending
              ? { duration: 0.5, repeat: Infinity }
              : { duration: 3, repeat: Infinity, ease: "easeInOut" }
          }
        />
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center font-semibold text-sm relative z-10 transition-all duration-300"
          style={{
            background: isSending ? "#0f766e" : circleBg,
            border: `1px solid ${isSending ? tealRing(0.8) : circleBorder}`,
            color: isDark ? "white" : isSending ? "white" : "#134e4a",
          }}
        >
          <span className="text-base font-semibold">
            {peer.name.split(" ")[0]?.[0]}
            {peer.name.split(" ")[1]?.[0]}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-0.5">
        <span
          className="text-xs font-medium"
          style={{ color: isDark ? "rgba(255,255,255,0.8)" : "#1f2937" }}
        >
          {peer.name}
        </span>
        <span className="text-teal-500 dark:text-teal-400 text-[10px]">
          {isSending ? t.sending : t.clickToSend}
        </span>
      </div>
    </motion.div>
  );
}
