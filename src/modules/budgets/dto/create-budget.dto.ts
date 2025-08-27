import { IsNumber, IsString, IsDateString, IsUUID } from 'class-validator';

export class CreateBudgetDto {
  @IsNumber()
  amount: number;

  @IsString()
  period: string; // e.g. "monthly", "weekly"

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsUUID()
  userId: string;

  @IsString()
  category: string; // client sends category name
}
