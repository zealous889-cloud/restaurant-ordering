import { Module } from '@nestjs/common';
import { KitchenService } from './kitchen.service';
import { KitchenController } from './kitchen.controller';
import { EventsGateway } from './events.gateway';

@Module({
  providers: [KitchenService, EventsGateway],
  controllers: [KitchenController],
  exports: [EventsGateway, KitchenService],
})
export class KitchenModule {}
