import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileGateway } from './file.gateway';

@Module({
  providers: [FileGateway, FileService],
})
export class FileModule {}
