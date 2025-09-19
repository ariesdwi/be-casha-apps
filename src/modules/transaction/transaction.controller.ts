import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Get,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionService } from './transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly txService: TransactionService) {}

  // ✅ Get all transactions for logged-in user
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Request() req) {
    return this.txService.findAll(req.user.id);
  }

  // ✅ SINGLE ENDPOINT for both text and image using form-data
  @UseGuards(AuthGuard('jwt'))
  @Post('create')
  @UseInterceptors(FileInterceptor('receipt'))
  async createTransaction(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Request() req,
  ) {
    const userId = req.user.id;
    const input = body.input; // from form-data

    if (file) {
      return this.txService.createFromImage(file.buffer, file.mimetype, userId);
    }

    if (input) {
      return this.txService.createFromText(input, userId);
    }

    throw new BadRequestException(
      'Either file upload or text input is required',
    );
  }

  // ✅ Update transaction
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async updateTransaction(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req,
  ) {
    return this.txService.updateTransaction(req.user.id, id, body);
  }

  // ✅ Delete transaction
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deleteTransaction(@Param('id') id: string, @Request() req) {
    return this.txService.deleteTransaction(req.user.id, id);
  }

  // ✅ Keep separate endpoints for backward compatibility
  @UseGuards(AuthGuard('jwt'))
  @Post('create-text')
  async createFromText(@Body('input') input: string, @Request() req) {
    return this.txService.createFromText(input, req.user.id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-image')
  @UseInterceptors(FileInterceptor('receipt'))
  async createFromImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.txService.createFromImage(
      file.buffer,
      file.mimetype,
      req.user.id,
    );
  }

  // ✅ Debug endpoint (optional, raw object)
  @UseGuards(AuthGuard('jwt'))
  @Get('debug-user')
  async debugUser(@Request() req) {
    return {
      message: 'User object from JWT',
      user: req.user,
      availableProperties: Object.keys(req.user),
      userId: req.user.userId,
      id: req.user.id,
      areTheyEqual: req.user.userId === req.user.id,
    };
  }
}
