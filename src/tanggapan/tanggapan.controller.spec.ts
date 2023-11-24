import { Test, TestingModule } from '@nestjs/testing';
import { TanggapanController } from './tanggapan.controller';

describe('TanggapanController', () => {
  let controller: TanggapanController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TanggapanController],
    }).compile();

    controller = module.get<TanggapanController>(TanggapanController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
