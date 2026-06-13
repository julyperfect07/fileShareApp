import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useSocket() {
  const socketInstance = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000",
    );

    socketInstance.current = socket;
    // console.log(socket);
    return () => {
      socket.disconnect();
      socketInstance.current = null;
    };
  }, []);

  return { socket: socketInstance.current };
}
