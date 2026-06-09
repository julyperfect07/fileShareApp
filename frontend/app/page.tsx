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
  const handleData = () => {};

  useEffect(() => {
    if (!socket || !peerId || !peer) return;
    socket?.emit("join-room", { roomId: "123", peerId });

    // If i am the first one this one triggers , but if i was already found the new peer wants to connect to me with peer.connect and this fires peer.on("connection")
    socket.on("user-connected", ({ peerId: otherPeerId }) => {
      const conn = peer.connect(otherPeerId);
      connections.current?.push(conn);
      conn.on("data", handleData);
    });

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
  return (
    <div>
      <input type="file" onChange={handleFileChange} />
    </div>
  );
}
