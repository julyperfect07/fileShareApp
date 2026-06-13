"use client";
import { motion, AnimatePresence } from "framer-motion";
import { FileIcon } from "lucide-react";
import { PendingFile } from "@/hooks/usePeerConnection";

interface FileRequestModalProps {
  pendingFile: PendingFile | null;
  isDark: boolean;
  onAccept: () => void;
  onReject: () => void;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const tealRing = (opacity: number) => `rgba(20, 184, 166, ${opacity})`;

export function FileRequestModal({
  pendingFile,
  isDark,
  onAccept,
  onReject,
}: FileRequestModalProps) {
  return (
    <AnimatePresence>
      {pendingFile && (
        <>
          <motion.div
            className="absolute inset-0 z-40"
            style={{
              background: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="absolute z-50 w-80 rounded-2xl p-6 flex flex-col items-center gap-4"
            style={{
              background: isDark ? "#0f0f1a" : "#ffffff",
              border: `1px solid ${tealRing(isDark ? 0.2 : 0.3)}`,
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* icon */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: isDark
                  ? "rgba(20,184,166,0.1)"
                  : "rgba(20,184,166,0.08)",
                border: `1px solid ${tealRing(0.25)}`,
              }}
            >
              <FileIcon
                size={24}
                className="text-teal-500 dark:text-teal-400"
              />
            </div>

            {/* info */}
            <div className="flex flex-col items-center gap-1 text-center">
              <p
                className="text-sm font-semibold"
                style={{ color: isDark ? "white" : "#111827" }}
              >
                {pendingFile.fromName} wants to send a file
              </p>
              <p
                className="text-xs font-medium"
                style={{ color: isDark ? "rgba(255,255,255,0.7)" : "#374151" }}
              >
                {pendingFile.name}
              </p>
              <p
                className="text-xs"
                style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#9ca3af" }}
              >
                {formatSize(pendingFile.size)}
              </p>
            </div>

            {/* buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={onReject}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                style={{
                  background: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.05)",
                  color: isDark ? "rgba(255,255,255,0.6)" : "#6b7280",
                }}
              >
                Decline
              </button>
              <button
                onClick={onAccept}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-colors hover:opacity-90"
                style={{ background: "#0f766e" }}
              >
                Accept
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
