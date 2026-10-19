import { Test, TestingModule } from '@nestjs/testing';
import { IntervenantsService } from './intervenants.service.js';

describe('IntervenantsService', () => {
  let service: IntervenantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IntervenantsService],
    }).compile();

    service = module.get<IntervenantsService>(IntervenantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
