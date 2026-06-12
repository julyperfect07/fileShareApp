"use client";
import { useEffect, useRef, useState } from "react";
import { DataConnection } from "peerjs";
import { usePeer } from "./usePeer";
import { useSocket } from "./useSocket";
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

export function usePeerConnection() {
  const { peer, peerId } = usePeer();
  const { socket } = useSocket();
  const connections = useRef<DataConnection[]>([]);
  const myNameRef = useRef<string>("");
  const [myName, setMyName] = useState<string>("");
  const [myRoomId, setMyRoomId] = useState<string>("");
  const [peers, setPeers] = useState<ConnectedPeer[]>([]);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [receivingFile, setReceivingFile] = useState(false);
  const searchParams = useSearchParams();

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

  const joinRoom = (code: string) => {
    if (!socket || !peerId || !code.trim()) return;
    socket.emit("join-room", { roomId: code.trim(), peerId });
  };

  return {
    peers,
    myName,
    myRoomId,
    sendingTo,
    receivingFile,
    sendFileToPeer,
    joinRoom,
  };
}
