import { Test, TestingModule } from '@nestjs/testing';
import { ProfilepetugasController } from './profilepetugas.controller';

describe('ProfilepetugasController', () => {
  let controller: ProfilepetugasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfilepetugasController],
    }).compile();

    controller = module.get<ProfilepetugasController>(ProfilepetugasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
