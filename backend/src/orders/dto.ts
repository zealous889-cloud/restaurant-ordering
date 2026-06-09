import { IsArray, IsInt, IsOptional, IsString, Min, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class CartItemDto {
  @IsString() productId: string;
  @IsInt() @Min(1) quantity: number;
  @IsOptional() @IsString() note?: string;
}

export class CreateOrderDto {
  @IsString() customerName: string;
  @IsString() customerPhone: string;
  @IsOptional() @IsString() note?: string;
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CartItemDto)
  items: CartItemDto[];
}
