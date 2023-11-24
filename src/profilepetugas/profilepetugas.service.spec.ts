import { Test, TestingModule } from '@nestjs/testing';
import { ProfilepetugasService } from './profilepetugas.service';

describe('ProfilepetugasService', () => {
  let service: ProfilepetugasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProfilepetugasService],
    }).compile();

    service = module.get<ProfilepetugasService>(ProfilepetugasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
