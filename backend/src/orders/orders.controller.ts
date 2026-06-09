import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto';

@Controller('orders')
export class OrdersController {
  constructor(private svc: OrdersService) {}

  @Post()
  create(@Body() dto: CreateOrderDto) { return this.svc.create(dto); }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.svc.findOne(id); }

  @Get() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(Role.ADMIN)
  findAll() { return this.svc.findAll(); }
}
