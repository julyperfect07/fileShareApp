"use client";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeCanvas } from "qrcode.react";

interface PairModalProps {
  show: boolean;
  isDark: boolean;
  myRoomId: string;
  joinCode: string;
  setJoinCode: (val: string) => void;
  onClose: () => void;
  onJoin: () => void;
  t: {
    pairDevicesTitle: string;
    inputKey: string;
    enterCode: string;
    cancel: string;
    pair: string;
  };
}

const tealRing = (opacity: number) => `rgba(20, 184, 166, ${opacity})`;

export function PairModal({
  show,
  isDark,
  myRoomId,
  joinCode,
  setJoinCode,
  onClose,
  onJoin,
  t,
}: PairModalProps) {
  const modalBg = isDark ? "#0f0f1a" : "#ffffff";
  const modalBorder = isDark ? tealRing(0.15) : tealRing(0.25);
  const digitBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  const digitBorder = isDark ? tealRing(0.2) : tealRing(0.3);
  const inputBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  const inputBorder = isDark ? tealRing(0.2) : tealRing(0.3);
  const dividerBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const cancelBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            className="absolute inset-0 z-20"
            style={{
              background: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl p-6 flex flex-col items-center gap-5"
            style={{
              background: modalBg,
              borderTop: `1px solid ${modalBorder}`,
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div
              className="w-10 h-1 rounded-full"
              style={{
                background: isDark
                  ? "rgba(255,255,255,0.2)"
                  : "rgba(0,0,0,0.15)",
              }}
            />
            <h2
              className="font-semibold text-base"
              style={{ color: isDark ? "white" : "#111827" }}
            >
              {t.pairDevicesTitle}
            </h2>

            {myRoomId && (
              <div className="bg-white p-3 rounded-2xl">
                <QRCodeCanvas
                  value={`https://file-share-app-tau.vercel.app?room=${myRoomId}`}
                  size={148}
                />
              </div>
            )}

            <div className="flex gap-3">
              {myRoomId.split("").map((digit, i) => (
                <div
                  key={i}
                  className="w-10 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
                  style={{
                    background: digitBg,
                    border: `1px solid ${digitBorder}`,
                    color: isDark ? "white" : "#111827",
                  }}
                >
                  {digit}
                </div>
              ))}
            </div>

            <p
              className="text-xs text-center"
              style={{ color: isDark ? "rgba(255,255,255,0.35)" : "#9ca3af" }}
            >
              {t.inputKey}
            </p>

            <div className="flex items-center gap-3 w-full max-w-xs">
              <div className="flex-1 h-px" style={{ background: dividerBg }} />
              <span
                style={{
                  color: isDark ? "rgba(255,255,255,0.25)" : "#d1d5db",
                  fontSize: 12,
                }}
              >
                or
              </span>
              <div className="flex-1 h-px" style={{ background: dividerBg }} />
            </div>

            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onJoin()}
              placeholder={t.enterCode}
              maxLength={6}
              className="w-full max-w-xs text-center rounded-xl px-4 py-3 text-sm outline-none tracking-widest transition-colors"
              style={{
                background: inputBg,
                border: `1px solid ${inputBorder}`,
                color: isDark ? "white" : "#111827",
              }}
            />

            <div className="flex gap-3 w-full max-w-xs">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl text-teal-500 dark:text-teal-400 text-sm font-semibold transition-colors"
                style={{ background: cancelBg }}
              >
                {t.cancel}
              </button>
              <button
                onClick={onJoin}
                className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-colors hover:opacity-90"
                style={{ background: "#0f766e" }}
              >
                {t.pair}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
