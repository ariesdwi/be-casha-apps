import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTransactionDto {
  @IsOptional()
  @IsString()
  readonly input?: string; // for text input

  @IsOptional()
  readonly receipt?: any; // image file handled by Multer
}
