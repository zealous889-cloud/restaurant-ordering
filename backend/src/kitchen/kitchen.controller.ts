import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { KitchenState, Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { KitchenService } from './kitchen.service';

@Controller('kitchen')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.KITCHEN, Role.ADMIN)
export class KitchenController {
  constructor(private svc: KitchenService) {}

  @Get('board')
  board() { return this.svc.board(); }

  @Patch(':orderId/state')
  setState(@Param('orderId') orderId: string, @Body('state') state: KitchenState) {
    return this.svc.setState(orderId, state);
  }
}
