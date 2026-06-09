import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}
  findAll() {
    return this.prisma.category.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' } });
  }
  create(data: { name: string; sortOrder?: number }) {
    return this.prisma.category.create({ data });
  }
  update(id: string, data: any) {
    return this.prisma.category.update({ where: { id }, data });
  }
  remove(id: string) {
    return this.prisma.category.update({ where: { id }, data: { active: false } });
  }
}
