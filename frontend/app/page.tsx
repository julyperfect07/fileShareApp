"use client";
import { usePeer } from "@/hooks/usePeer";
import { useSocket } from "@/hooks/useSocket";
import { DataConnection } from "peerjs";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Header } from "@/components/Header";
import { useSearchParams } from "next/navigation";

interface ConnectedPeer {
  peerId: string;
  name: string;
  conn: DataConnection;
}

type IntroMessage = { type: "intro"; name: string };
type FileMessage = {
  type: "file";
  name: string;
  fileType: string;
  data: ArrayBuffer;
};
type PeerMessage = IntroMessage | FileMessage;

export default function Home() {
  const { peer, peerId } = usePeer();
  const { socket } = useSocket();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const connections = useRef<DataConnection[]>([]);
  const [myName, setMyName] = useState<string>("");
  const [peers, setPeers] = useState<ConnectedPeer[]>([]);
  const selectedPeer = useRef<DataConnection | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const myNameRef = useRef<string>("");
  const [showModal, setShowModal] = useState(false);
  const [myRoomId, setMyRoomId] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [receivingFile, setReceivingFile] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => setMounted(true), []);

  const isDark = !mounted || theme === "dark";

  const handleData = (data: unknown, conn: DataConnection) => {
    if (typeof data !== "object" || data === null || !("type" in data)) return;
    const d = data as PeerMessage;
    if (d.type === "intro") {
      setPeers((prev) =>
        prev.map((p) => (p.peerId === conn.peer ? { ...p, name: d.name } : p)),
      );
    }
    if (d.type === "file") {
      setReceivingFile(true);
      setTimeout(() => setReceivingFile(false), 2000);
      const blob = new Blob([d.data], { type: d.fileType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = d.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const sendFileToPeer = async (conn: DataConnection, file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      alert("File too large, max 100MB");
      return;
    }
    setSendingTo(conn.peer);
    const buffer = await file.arrayBuffer();
    conn.send({
      type: "file",
      name: file.name,
      fileType: file.type,
      data: buffer,
    });
    setTimeout(() => setSendingTo(null), 2000);
  };

  const setupConn = (conn: DataConnection) => {
    conn.on("open", () => {
      if (myNameRef.current)
        conn.send({ type: "intro", name: myNameRef.current });
      connections.current.push(conn);
      setPeers((prev) => {
        if (prev.some((p) => p.peerId === conn.peer)) return prev;
        return [...prev, { peerId: conn.peer, name: "Unknown", conn }];
      });
    });
    conn.on("data", (data) => handleData(data, conn));
    conn.on("close", () => {
      setPeers((prev) => prev.filter((p) => p.peerId !== conn.peer));
      connections.current = connections.current.filter(
        (c) => c.peer !== conn.peer,
      );
    });
    conn.on("error", (err) => console.error("connection error:", err));
  };

  useEffect(() => {
    if (!socket || !peerId) return;
    socket.emit("create-room", { peerId });
    socket.on("my-room", ({ roomId, name }) => {
      setMyRoomId(roomId);
      setMyName(name);
      myNameRef.current = name;
    });
    return () => {
      socket.off("my-room");
    };
  }, [peerId, socket]);

  useEffect(() => {
    if (!socket || !peerId || !peer) return;
    socket.on("your-name", ({ name }) => {
      setMyName(name);
      myNameRef.current = name;
      connections.current.forEach((conn) => conn.send({ type: "intro", name }));
    });
    socket.on("user-connected", ({ peerId: otherPeerId }) => {
      const conn = peer.connect(otherPeerId);
      setupConn(conn);
    });
    peer.on("connection", (conn) => setupConn(conn));
    socket.on("user-disconnected", ({ peerId: disconnectedPeerId }) => {
      const target = connections.current.find(
        (c) => c.peer === disconnectedPeerId,
      );
      target?.close();
      setPeers((prev) => prev.filter((p) => p.peerId !== disconnectedPeerId));
      connections.current = connections.current.filter(
        (c) => c.peer !== disconnectedPeerId,
      );
    });
    return () => {
      socket.off("user-connected");
      socket.off("your-name");
      socket.off("user-disconnected");
      peer.removeAllListeners("connection");
      connections.current.forEach((conn) => conn.close());
      connections.current = [];
    };
  }, [peerId, socket, peer]);

  useEffect(() => {
    const room = searchParams.get("room");
    if (!room || !socket || !peerId) return;
    socket.emit("join-room", { roomId: room, peerId });
  }, [peerId, socket, searchParams]);

  const joinRoom = () => {
    if (!socket || !peerId || !joinCode.trim()) return;
    socket.emit("join-room", { roomId: joinCode.trim(), peerId });
    setShowModal(false);
    setJoinCode("");
  };

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
      <Header />

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
              Pair devices to send files
            </p>
            <p className="text-gray-400 dark:text-white/30 text-sm max-w-xs">
              Open this app on another device, then tap "Pair devices" to
              connect
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
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white font-semibold text-sm relative z-10 transition-all duration-300"
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
                  {isSending ? "sending..." : "click to send"}
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
          {myName || "Connecting..."}
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="mt-1 px-5 py-1.5 rounded-full text-teal-500 dark:text-teal-400 text-xs font-medium transition-colors hover:bg-teal-500/10"
          style={{ border: `1px solid ${tealRing(0.35)}` }}
        >
          Pair devices
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
                Pair devices
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
                Input this key on another device or scan the QR code
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
                onKeyDown={(e) => e.key === "Enter" && joinRoom()}
                placeholder="Enter code from another device"
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
                  Cancel
                </button>
                <button
                  onClick={joinRoom}
                  className="flex-1 py-3 rounded-xl text-white text-sm font-semibold transition-colors hover:opacity-90"
                  style={{ background: "#0f766e" }}
                >
                  Pair
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
