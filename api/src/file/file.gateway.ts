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

interface UserData {
  roomId: string;
  peerId: string;
  name: string;
}

const adjectives = [
  'Fuchsia',
  'Crimson',
  'Silent',
  'Amber',
  'Cosmic',
  'Neon',
  'Violet',
  'Turquoise',
];
const animals = [
  'Harrier',
  'Falcon',
  'Panther',
  'Viper',
  'Lynx',
  'Condor',
  'Manta',
  'Jaguar',
];

const randomName = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adj} ${animal}`;
};

@WebSocketGateway({ cors: { origin: '*' } })
export class FileGateway implements OnGatewayDisconnect {
  constructor(private readonly fileService: FileService) {}

  private activeUsers = new Map<string, UserData>();

  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('create-room')
  handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { peerId: string },
  ) {
    const { peerId } = data;
    const roomId = Math.floor(100000 + Math.random() * 900000).toString();
    const name = randomName();
    client.join(roomId);
    client.emit('my-room', { roomId, name });

    this.activeUsers.set(client.id, { roomId, peerId, name });
  }

  @SubscribeMessage('join-room')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; peerId: string },
  ) {
    const { roomId, peerId } = data;
    const name = randomName();

    client.join(roomId);
    client.emit('your-name', { name });
    client.to(roomId).emit('user-connected', { peerId, name });
    // const existingUsers = Array.from(this.activeUsers.entries())
    //   .filter(([_, u]) => u.roomId === roomId)
    //   .map(([_, u]) => ({ peerId: u.peerId, name: u.name }));

    // client.emit('existing-users', existingUsers);

    this.activeUsers.set(client.id, { roomId, peerId, name });
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
