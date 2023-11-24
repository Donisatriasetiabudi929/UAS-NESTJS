import { Test, TestingModule } from '@nestjs/testing';
import { TanggapanService } from './tanggapan.service';

describe('TanggapanService', () => {
  let service: TanggapanService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TanggapanService],
    }).compile();

    service = module.get<TanggapanService>(TanggapanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
