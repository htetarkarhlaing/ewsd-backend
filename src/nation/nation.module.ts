import { Module } from '@nestjs/common';
import { NationService } from './nation.service';
import { NationController } from './nation.controller';

@Module({
  controllers: [NationController],
  providers: [NationService],
})
export class NationModule {}
