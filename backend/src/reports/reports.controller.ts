import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class ReportsController {
  constructor(private svc: ReportsService) {}

  @Get('summary')
  summary(@Query('period') period: any) { return this.svc.summary(period || 'day'); }

  @Get('history')
  history(@Query('period') period: any) { return this.svc.history(period || 'month'); }

  @Get('export/excel')
  async excel(@Query('period') period: any, @Res() res: Response) {
    const buf = await this.svc.exportExcel(period || 'month');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="sales-${period || 'month'}.xlsx"`);
    res.send(buf);
  }

  @Get('export/csv')
  async csv(@Query('period') period: any, @Res() res: Response) {
    const csv = await this.svc.exportCsv(period || 'month');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="sales-${period || 'month'}.csv"`);
    res.send('﻿' + csv);
  }
}
