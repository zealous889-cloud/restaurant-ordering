import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(onlyAvailable = true) {
    return this.prisma.product.findMany({
      where: onlyAvailable ? { available: true } : {},
      include: { category: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id }, include: { category: true } });
    if (!p) throw new NotFoundException('ไม่พบสินค้า');
    return p;
  }

  create(data: any) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description ?? '',
        price: data.price,
        imageUrl: data.imageUrl ?? '',
        available: data.available ?? true,
        categoryId: data.categoryId,
      },
    });
  }

  update(id: string, data: any) {
    return this.prisma.product.update({ where: { id }, data });
  }

  remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}
