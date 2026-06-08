import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { FileService } from './file.service';
import { Socket, Server } from 'socket.io';

interface MessageBody {
  roomId: string;
  peerId: string;
}

@WebSocketGateway()
export class FileGateway implements OnGatewayDisconnect {
  constructor(private readonly fileService: FileService) {}

  private activeUsers = new Map<string, MessageBody>();

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join-room')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MessageBody,
  ) {
    const { roomId, peerId } = data;
    client.join(roomId);
    client.to(roomId).emit('user-connected', { peerId });
    this.activeUsers.set(client.id, data);
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userData = this.activeUsers.get(client.id);
    if (userData) {
      const { roomId, peerId } = userData;
      this.server.to(roomId).emit('user-disconnected', { peerId });
      this.activeUsers.delete(client.id);
    }
  }
}
