// src/modules/budget/dto/get-budget-summary.dto.ts
import { IsOptional, IsString, Matches } from 'class-validator';

export class GetBudgetSummaryDto {
  @IsOptional()
  @IsString()
  // Accepts "YYYY" format
  @Matches(/^\d{4}$/, { message: 'year must be in YYYY format' })
  year?: string;

  @IsOptional()
  @IsString()
  // Accepts "YYYY-MM" format
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'month must be in YYYY-MM format (e.g., 2025-09)',
  })
  month?: string;
}
