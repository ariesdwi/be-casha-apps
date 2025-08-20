import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TransactionService } from './transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly txService: TransactionService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Request() req) {
    return this.txService.findAll(req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-text')
  async createFromText(@Body('input') input: string, @Request() req) {
    return this.txService.createFromText(input, req.user.id);
  }
}
