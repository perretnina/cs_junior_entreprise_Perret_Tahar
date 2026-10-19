import { Test, TestingModule } from '@nestjs/testing';
import { IntervenantsController } from './intervenants.controller.js';

describe('IntervenantsController', () => {
  let controller: IntervenantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IntervenantsController],
    }).compile();

    controller = module.get<IntervenantsController>(IntervenantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
