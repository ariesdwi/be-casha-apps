import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateBudgetDto {
  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  month: string; // e.g., "September 2025"

  @IsString()
  @IsNotEmpty()
  category: string;
}
