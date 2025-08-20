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
import { successResponse } from '../../common/response/response.helper';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly txService: TransactionService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Request() req) {
    const transactions = await this.txService.findAll(req.user.userId);
    return successResponse(transactions, 'Get transactions successfully', 200);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-text')
  async createFromText(@Body('input') input: string, @Request() req) {
    const tx = await this.txService.createFromText(input, req.user.userId);
    return successResponse(tx, 'Create spending successfully', 201);
  }
}
