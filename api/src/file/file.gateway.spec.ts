import { Test, TestingModule } from '@nestjs/testing';
import { FileGateway } from './file.gateway';
import { FileService } from './file.service';

describe('FileGateway', () => {
  let gateway: FileGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileGateway, FileService],
    }).compile();

    gateway = module.get<FileGateway>(FileGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
