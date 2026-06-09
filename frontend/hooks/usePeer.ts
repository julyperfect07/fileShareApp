import { useEffect, useRef, useState } from "react";
import { Peer } from "peerjs";

export function usePeer() {
  const peerInstance = useRef<Peer | null>(null);
  const [peerId, setPeerId] = useState<string>("");

  useEffect(() => {
    const peer = new Peer();

    peer.on("open", (id) => {
      console.log(id);
      setPeerId(id);
    });
    peerInstance.current = peer;
    return () => {
      peer.destroy();
      peerInstance.current = null;
    };
  }, []);

  return { peer: peerInstance.current, peerId };
}
