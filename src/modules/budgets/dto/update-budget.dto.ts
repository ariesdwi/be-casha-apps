import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateBudgetDto {
  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsString()
  month?: string; // e.g., "October 2025"

  @IsOptional()
  @IsString()
  category?: string;
}
