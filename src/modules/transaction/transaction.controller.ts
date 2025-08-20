import { Controller, Post, Body, Get } from '@nestjs/common';
import { TransactionService } from './transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly txService: TransactionService) {}

  @Get()
  async findAll() {
    return this.txService.findAll();
  }

  @Post('create-text')
  async createFromText(@Body('input') input: string) {
    return this.txService.createFromText(input);
  }
}
