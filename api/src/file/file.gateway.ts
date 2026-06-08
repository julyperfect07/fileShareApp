import { WebSocketGateway } from '@nestjs/websockets';
import { FileService } from './file.service';

@WebSocketGateway()
export class FileGateway {
  constructor(private readonly fileService: FileService) {}
}
