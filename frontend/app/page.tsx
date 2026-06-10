"use client";
import { usePeer } from "@/hooks/usePeer";
import { useSocket } from "@/hooks/useSocket";
import { DataConnection } from "peerjs";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

interface ConnectedPeer {
  peerId: string;
  name: string;
  conn: DataConnection;
}

type IntroMessage = {
  type: "intro";
  name: string;
};

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
  const connections = useRef<DataConnection[]>([]);
  const [myName, setMyName] = useState<string>("");
  const [peers, setPeers] = useState<ConnectedPeer[]>([]);
  const selectedPeer = useRef<DataConnection | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const myNameRef = useRef<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);
  const [myRoomId, setMyRoomId] = useState<string>("");
  const [joinCode, setJoinCode] = useState<string>("");

  const handleData = (data: unknown, conn: DataConnection) => {
    if (typeof data !== "object" || data === null || !("type" in data)) return;
    const d = data as PeerMessage;

    if (d.type === "intro") {
      setPeers((prev) =>
        prev.map((p) => (p.peerId === conn.peer ? { ...p, name: d.name } : p)),
      );
    }

    if (d.type === "file") {
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
    const buffer = await file.arrayBuffer();
    conn.send({
      type: "file",
      name: file.name,
      fileType: file.type,
      data: buffer,
    });
  };

  const setupConn = (conn: DataConnection) => {
    conn.on("open", () => {
      if (myNameRef.current) {
        conn.send({ type: "intro", name: myNameRef.current });
      }
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

  // auto create room when peerId is ready
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

  // peer connection logic
  useEffect(() => {
    if (!socket || !peerId || !peer) return;

    socket.on("your-name", ({ name }) => {
      setMyName(name);
      myNameRef.current = name;
      connections.current.forEach((conn) => {
        conn.send({ type: "intro", name });
      });
    });

    // انت الي بتتصل
    socket.on("user-connected", ({ peerId: otherPeerId }) => {
      const conn = peer.connect(otherPeerId);
      setupConn(conn);
    });

    // هم لما يتصلوا بتشتغل عندك
    peer.on("connection", (conn) => {
      setupConn(conn);
    });

    socket.on("user-disconnected", ({ peerId: disconnectedPeerId }) => {
      const target = connections.current.find(
        (c) => c.peer === disconnectedPeerId,
      );
      target?.close();
      setPeers((prev) => prev.filter((p) => p.peerId !== disconnectedPeerId));
      connections.current = connections.current.filter(
        (conn) => conn.peer !== disconnectedPeerId,
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

  const joinRoom = () => {
    if (!socket || !peerId || !joinCode.trim()) return;
    socket.emit("join-room", { roomId: joinCode.trim(), peerId });
    setShowModal(false);
    setJoinCode("");
  };

  return (
    <div className="relative w-screen h-screen bg-black flex items-center justify-center">
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
      {peers.map((p, index) => {
        const angle = (index / peers.length) * Math.PI * 2 - Math.PI / 2;
        const radius = 180;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <div
            key={p.peerId}
            onClick={() => {
              selectedPeer.current = p.conn;
              fileInputRef.current?.click();
            }}
            className="absolute flex flex-col items-center gap-2 cursor-pointer"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
            }}
          >
            <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm">
              {p.name.split(" ")[0]?.[0]}
              {p.name.split(" ")[1]?.[0]}
            </div>
            <span className="text-white text-xs">{p.name}</span>
          </div>
        );
      })}

      {/* your name at bottom */}
      <div className="absolute bottom-8 flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center text-white text-sm font-semibold">
          You
        </div>
        <span className="text-gray-400 text-xs">
          {myName || "Connecting..."}
        </span>
        <button
          onClick={() => setShowModal(true)}
          className="mt-2 px-4 py-2 bg-teal-600 text-white text-xs rounded-full"
        >
          Pair Devices
        </button>
      </div>

      {/* modal */}
      {showModal && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
          <div className="bg-zinc-900 rounded-2xl p-6 w-80 flex flex-col items-center gap-4">
            <h2 className="text-white font-semibold text-lg">Pair Devices</h2>

            {/* QR code */}
            {myRoomId && (
              <div className="bg-white p-3 rounded-xl">
                <QRCodeCanvas value={myRoomId} size={160} />
              </div>
            )}

            {/* room code */}
            <div className="flex gap-3">
              {myRoomId.split("").map((digit, i) => (
                <div
                  key={i}
                  className="w-9 h-11 bg-zinc-700 rounded-lg flex items-center justify-center text-white text-lg font-bold"
                >
                  {digit}
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-xs text-center">
              Input this key on another device or scan the QR code.
            </p>

            <div className="flex items-center gap-2 w-full">
              <div className="flex-1 h-px bg-zinc-700" />
              <span className="text-gray-500 text-xs">OR</span>
              <div className="flex-1 h-px bg-zinc-700" />
            </div>

            {/* join input */}
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter code from another device"
              maxLength={6}
              className="w-full bg-zinc-700 text-white text-center rounded-lg px-3 py-2 text-sm outline-none tracking-widest"
            />

            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setShowModal(false);
                  setJoinCode("");
                }}
                className="flex-1 py-2 rounded-lg bg-zinc-700 text-teal-400 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={joinRoom}
                className="flex-1 py-2 rounded-lg bg-zinc-700 text-white text-sm font-semibold"
              >
                Pair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
