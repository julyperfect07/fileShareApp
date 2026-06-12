"use client";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Header } from "@/components/Header";
import { translations } from "@/lib/translations";
import { usePeerConnection } from "@/hooks/usePeerConnection";

export default function HomeContent() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [lang, setLang] = useState<"en" | "ar">("en");
  const selectedPeer = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    peers,
    myName,
    myRoomId,
    sendingTo,
    receivingFile,
    sendFileToPeer,
    joinRoom,
  } = usePeerConnection();

  const t = translations[lang];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang]);

  const isDark = !mounted || theme === "dark";

  const tealRing = (opacity: number) => `rgba(20, 184, 166, ${opacity})`;
  const circleBg = isDark ? "#111827" : "#f8fafc";
  const circleBorder = isDark ? tealRing(0.3) : tealRing(0.5);
  const modalBg = isDark ? "#0f0f1a" : "#ffffff";
  const modalBorder = isDark ? tealRing(0.15) : tealRing(0.25);
  const digitBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  const digitBorder = isDark ? tealRing(0.2) : tealRing(0.3);
  const inputBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.04)";
  const inputBorder = isDark ? tealRing(0.2) : tealRing(0.3);
  const dividerBg = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const cancelBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";

  return (
    <div
      className="relative w-screen h-screen flex items-center justify-center overflow-hidden"
      style={{ background: isDark ? "#080810" : "#f0fdf9" }}
    >
      <Header lang={lang} setLang={setLang} />

      {/* radar rings */}
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

      {/* receiving flash */}
      <AnimatePresence>
        {receivingFile && (
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none"
            style={{ background: "rgba(20,184,166,0.08)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          />
        )}
      </AnimatePresence>

      {/* center text */}
      <AnimatePresence>
        {peers.length === 0 && (
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
            <p className="text-gray-400 dark:text-white/30 text-sm max-w-xs">
              {t.pairSubtitle}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={async (e) => {
          if (!e.target.files?.[0] || !selectedPeer.current) return;
          await sendFileToPeer(selectedPeer.current, e.target.files[0]);
          e.target.value = "";
        }}
      />

      {/* peer circles */}
      <AnimatePresence>
        {peers.map((p, index) => {
          const angle = (index / peers.length) * Math.PI * 2 - Math.PI / 2;
          const radius = 180;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          const isSending = sendingTo === p.peerId;

          return (
            <motion.div
              key={p.peerId}
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
              onClick={() => {
                selectedPeer.current = p.conn;
                fileInputRef.current?.click();
              }}
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
                    {p.name.split(" ")[0]?.[0]}
                    {p.name.split(" ")[1]?.[0]}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <span
                  className="text-xs font-medium"
                  style={{
                    color: isDark ? "rgba(255,255,255,0.8)" : "#1f2937",
                  }}
                >
                  {p.name}
                </span>
                <span className="text-teal-500 dark:text-teal-400 text-[10px]">
                  {isSending ? t.sending : t.clickToSend}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* my circle */}
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
            style={{
              background: circleBg,
              border: `1px solid ${tealRing(0.5)}`,
            }}
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
          onClick={() => setShowModal(true)}
          className="mt-1 px-5 py-1.5 rounded-full text-teal-500 dark:text-teal-400 text-xs font-medium transition-colors hover:bg-teal-500/10"
          style={{ border: `1px solid ${tealRing(0.35)}` }}
        >
          {t.pairDevices}
        </button>
      </div>

      {/* modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              className="absolute inset-0 z-20"
              style={{
                background: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
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
                <div
                  className="flex-1 h-px"
                  style={{ background: dividerBg }}
                />
                <span
                  style={{
                    color: isDark ? "rgba(255,255,255,0.25)" : "#d1d5db",
                    fontSize: 12,
                  }}
                >
                  or
                </span>
                <div
                  className="flex-1 h-px"
                  style={{ background: dividerBg }}
                />
              </div>

              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    joinRoom(joinCode);
                    setShowModal(false);
                    setJoinCode("");
                  }
                }}
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
                  onClick={() => {
                    setShowModal(false);
                    setJoinCode("");
                  }}
                  className="flex-1 py-3 rounded-xl text-teal-500 dark:text-teal-400 text-sm font-semibold transition-colors"
                  style={{ background: cancelBg }}
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => {
                    joinRoom(joinCode);
                    setShowModal(false);
                    setJoinCode("");
                  }}
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
    </div>
  );
}
