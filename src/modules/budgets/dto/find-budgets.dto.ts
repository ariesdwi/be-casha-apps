import { IsOptional, IsString } from 'class-validator';

export class FindBudgetsDto {
  @IsOptional()
  @IsString()
  year?: string; // e.g., "2025"
}
