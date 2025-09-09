import { IsOptional, IsString, Matches } from 'class-validator';

export class FindBudgetsDto {
  @IsOptional()
  @IsString()
  year?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Month must be in format YYYY-MM',
  })
  month?: string;
}
