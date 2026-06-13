"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Header } from "@/components/Header";
import { RadarRings } from "@/components/ui/RadarRings";
import { ReceivingFlash } from "@/components/ui/ReceivingFlash";
import { CenterText } from "@/components/ui/CenterText";
import { PeerCircle } from "@/components/ui/PeerCircle";
import { MyCircle } from "@/components/ui/MyCircle";
import { PairModal } from "@/components/ui/PairModal";
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

  return (
    <div
      className="relative w-screen h-screen flex items-center justify-center overflow-hidden"
      style={{ background: isDark ? "#080810" : "#f0fdf9" }}
    >
      <Header lang={lang} setLang={setLang} />
      <RadarRings isDark={isDark} />
      <ReceivingFlash show={receivingFile} />
      <CenterText show={peers.length === 0} isDark={isDark} t={t} />

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

      <AnimatePresence>
        {peers.map((p, index) => (
          <PeerCircle
            key={p.peerId}
            peer={p}
            index={index}
            total={peers.length}
            isSending={sendingTo === p.peerId}
            isDark={isDark}
            t={t}
            onClick={() => {
              selectedPeer.current = p.conn;
              fileInputRef.current?.click();
            }}
          />
        ))}
      </AnimatePresence>

      <MyCircle
        myName={myName}
        isDark={isDark}
        t={t}
        onPair={() => setShowModal(true)}
      />

      <PairModal
        show={showModal}
        isDark={isDark}
        myRoomId={myRoomId}
        joinCode={joinCode}
        setJoinCode={setJoinCode}
        onClose={() => {
          setShowModal(false);
          setJoinCode("");
        }}
        onJoin={() => {
          joinRoom(joinCode);
          setShowModal(false);
          setJoinCode("");
        }}
        t={t}
      />
    </div>
  );
}
