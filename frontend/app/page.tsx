"use client";
import { usePeer } from "@/hooks/usePeer";
import { useSocket } from "@/hooks/useSocket";
import Image from "next/image";
import { DataConnection } from "peerjs";
import { useEffect, useRef, useState } from "react";

export default function Home() {
  const { peer, peerId } = usePeer();
  const { socket } = useSocket();
  const connections = useRef<DataConnection[]>([]);
  const [file, setFile] = useState<File | null>();
  const handleData = (data: unknown) => {
    if (typeof data === "object" && data !== null && "type" in data) {
      const d = data as {
        type: string;
        name: string;
        fileType: string;
        data: ArrayBuffer;
      };
      if (d.type === "file") {
        const blob = new Blob([d.data], { type: d.fileType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = d.name;
        a.click();

        URL.revokeObjectURL(url);
      }
    }
  };

  useEffect(() => {
    if (!socket || !peerId || !peer) return;
    socket?.emit("join-room", { roomId: "123", peerId });

    // user-connected fires when someone ELSE joins after me
    // meaning i am already in the room, THEY just arrived
    // so i connect to THEM
    socket.on("user-connected", ({ peerId: otherPeerId }) => {
      const conn = peer.connect(otherPeerId);
      connections.current?.push(conn);
      conn.on("data", handleData);
    });

    // this fires when i am the newcomer
    // and the existing user called peer.connect(yourPeerId)
    peer.on("connection", (conn) => {
      connections.current?.push(conn);
      conn.on("data", handleData);
    });

    return () => {
      socket.off("user-connected");
      peer.removeAllListeners("connection");
    };
  }, [peerId, socket, peer]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].size > 100 * 1024 * 1024) {
        alert("File too large");
        return;
      }

      setFile(e.target.files[0]);
    }
  };

  const sendFile = async () => {
    if (!file) return;
    const buffer = await file.arrayBuffer();
    connections.current.forEach((conn) => {
      conn.send({
        type: "file",
        name: file.name,
        fileType: file.type,
        data: buffer,
      });
    });
    setFile(null);
  };
  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={sendFile}>Send</button>
    </div>
  );
}
