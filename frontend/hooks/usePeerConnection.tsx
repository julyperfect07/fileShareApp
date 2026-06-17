"use client";
import { useEffect, useRef, useState } from "react";
import { DataConnection } from "peerjs";
import { usePeer } from "./usePeer";
import { useSocket } from "./useSocket";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

interface ConnectedPeer {
  peerId: string;
  name: string;
  conn: DataConnection;
}

interface IncomingTransfer {
  id: string;
  name: string;
  fileType: string;
  total: number;
  chunks: ArrayBuffer[];
}

type IntroMessage = { type: "intro"; name: string };

type ChunkMessage = {
  type: "file-chunk";
  id: string;
  chunk: ArrayBuffer;
  index: number;
  total: number;
  name: string;
  fileType: string;
};

type FileStartMessage = {
  type: "file-start";
  id: string;
  name: string;
  fileType: string;
  size: number;
  total: number;
};

type FileEndMessage = {
  type: "file-end";
  id: string;
};

type PeerMessage =
  | IntroMessage
  | ChunkMessage
  | FileStartMessage
  | FileEndMessage;

const CHUNK_SIZE = 64 * 1024; // 64KB per chunk

export function usePeerConnection() {
  const { peer, peerId } = usePeer();
  const { socket } = useSocket();
  const connections = useRef<DataConnection[]>([]);
  const myNameRef = useRef<string>("");
  const incomingTransfers = useRef<Map<string, IncomingTransfer>>(new Map());

  const [myName, setMyName] = useState<string>("");
  const [myRoomId, setMyRoomId] = useState<string>("");
  const [peers, setPeers] = useState<ConnectedPeer[]>([]);
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [sendProgress, setSendProgress] = useState<number>(0);
  const [receivingFile, setReceivingFile] = useState(false);
  const [receiveProgress, setReceiveProgress] = useState<number>(0);
  const searchParams = useSearchParams();

  const downloadFile = (
    chunks: ArrayBuffer[],
    name: string,
    fileType: string,
  ) => {
    const blob = new Blob(chunks, { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleData = (data: unknown, conn: DataConnection) => {
    if (typeof data !== "object" || data === null || !("type" in data)) return;
    const d = data as PeerMessage;

    if (d.type === "intro") {
      setPeers((prev) =>
        prev.map((p) => (p.peerId === conn.peer ? { ...p, name: d.name } : p)),
      );
    }

    if (d.type === "file-start") {
      incomingTransfers.current.set(d.id, {
        id: d.id,
        name: d.name,
        fileType: d.fileType,
        total: d.total,
        chunks: [],
      });
      setReceivingFile(true);
      setReceiveProgress(0);
      toast.loading(`Receiving ${d.name}...`, { id: d.id });
    }

    if (d.type === "file-chunk") {
      const transfer = incomingTransfers.current.get(d.id);
      if (!transfer) return;
      transfer.chunks[d.index] = d.chunk;
      const received = transfer.chunks.filter(Boolean).length;
      const progress = Math.round((received / transfer.total) * 100);
      setReceiveProgress(progress);
    }

    if (d.type === "file-end") {
      const transfer = incomingTransfers.current.get(d.id);
      if (!transfer) return;
      downloadFile(transfer.chunks, transfer.name, transfer.fileType);
      incomingTransfers.current.delete(d.id);
      setReceivingFile(false);
      setReceiveProgress(0);
      toast.success(`${transfer.name} received!`, { id: d.id });
    }
  };

  const sendFileToPeer = async (conn: DataConnection, file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File too large, max 100MB");
      return;
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const buffer = await file.arrayBuffer();
    const totalChunks = Math.ceil(buffer.byteLength / CHUNK_SIZE);

    setSendingTo(conn.peer);
    setSendProgress(0);

    const toastId = `send-${id}`;
    toast.loading(`Sending ${file.name}...`, { id: toastId });

    conn.send({
      type: "file-start",
      id,
      name: file.name,
      fileType: file.type,
      size: file.size,
      total: totalChunks,
    });

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, buffer.byteLength);
      const chunk = buffer.slice(start, end);

      conn.send({
        type: "file-chunk",
        id,
        chunk,
        index: i,
        total: totalChunks,
        name: file.name,
        fileType: file.type,
      });

      const progress = Math.round(((i + 1) / totalChunks) * 100);
      setSendProgress(progress);

      // small delay to avoid overwhelming the data channel
      await new Promise((r) => setTimeout(r, 10));
    }

    conn.send({ type: "file-end", id });

    toast.success(`${file.name} sent!`, { id: toastId });
    setSendingTo(null);
    setSendProgress(0);
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

    socket.on("existing-users", (users: { peerId: string }[]) => {
      users.forEach(({ peerId: otherPeerId }) => {
        if (!peer) return;
        const conn = peer.connect(otherPeerId);
        setupConn(conn);
      });
    });

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
      socket.off("existing-users");
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
    sendProgress,
    receivingFile,
    receiveProgress,
    sendFileToPeer,
    joinRoom,
  };
}
