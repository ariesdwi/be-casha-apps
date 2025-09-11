// import {
//   Controller,
//   Post,
//   Body,
//   Get,
//   UseGuards,
//   Request,
//   UseInterceptors,
//   UploadedFile,
// } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { TransactionService } from './transaction.service';
// import { successResponse } from '../../common/response/response.helper';

// @Controller('transactions')
// export class TransactionController {
//   constructor(private readonly txService: TransactionService) {}

//   @UseGuards(AuthGuard('jwt'))
//   @Get()
//   async findAll(@Request() req) {
//     const transactions = await this.txService.findAll(req.user.id);
//     return successResponse(transactions, 'Get transactions successfully', 200);
//   }

//   // ✅ SINGLE ENDPOINT for both text and image using form-data
//   @UseGuards(AuthGuard('jwt'))
//   @Post('create')
//   @UseInterceptors(FileInterceptor('receipt'))
//   async createTransaction(
//     @UploadedFile() file: Express.Multer.File,
//     @Body() body: any,
//     @Request() req,
//   ) {
//     const userId = req.user.id;
//     const input = body.input; // This comes from form-data

//     // If file is uploaded, process as image (priority)
//     if (file) {
//       const tx = await this.txService.createFromImage(
//         file.buffer,
//         file.mimetype,
//         userId,
//       );
//       return successResponse(
//         tx,
//         'Create spending from receipt successfully',
//         201,
//       );
//     }

//     // If text input is provided, process as text
//     if (input) {
//       const tx = await this.txService.createFromText(input, userId);
//       return successResponse(tx, 'Create spending successfully', 201);
//     }

//     // If neither file nor text is provided
//     return {
//       code: 400,
//       status: 'error',
//       message: 'Either file upload or text input is required',
//       data: null,
//     };
//   }

//   // ✅ Keep separate endpoints for backward compatibility
//   @UseGuards(AuthGuard('jwt'))
//   @Post('create-text')
//   async createFromText(@Body('input') input: string, @Request() req) {
//     const tx = await this.txService.createFromText(input, req.user.userId);
//     return successResponse(tx, 'Create spending successfully', 201);
//   }

//   @UseGuards(AuthGuard('jwt'))
//   @Get('debug-user')
//   async debugUser(@Request() req) {
//     return {
//       message: 'User object from JWT',
//       user: req.user,
//       availableProperties: Object.keys(req.user),
//       userId: req.user.userId,
//       id: req.user.id,
//       areTheyEqual: req.user.userId === req.user.id,
//     };
//   }

//   @UseGuards(AuthGuard('jwt'))
//   @Post('create-image')
//   @UseInterceptors(FileInterceptor('receipt'))
//   async createFromImage(
//     @UploadedFile() file: Express.Multer.File,
//     @Request() req,
//   ) {
//     const tx = await this.txService.createFromImage(
//       file.buffer,
//       file.mimetype,
//       req.user.userId,
//     );
//     return successResponse(
//       tx,
//       'Create spending from receipt successfully',
//       201,
//     );
//   }
// }

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
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionService } from './transaction.service';
import { successResponse } from '../../common/response/response.helper';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly txService: TransactionService) {}

  // ✅ Get all transactions for logged-in user
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Request() req) {
    const transactions = await this.txService.findAll(req.user.id);
    return successResponse(transactions, 'Get transactions successfully', 200);
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
      const tx = await this.txService.createFromImage(
        file.buffer,
        file.mimetype,
        userId,
      );
      return successResponse(
        tx,
        'Create spending from receipt successfully',
        201,
      );
    }

    if (input) {
      const tx = await this.txService.createFromText(input, userId);
      return successResponse(tx, 'Create spending successfully', 201);
    }

    return {
      code: 400,
      status: 'error',
      message: 'Either file upload or text input is required',
      data: null,
    };
  }

  // ✅ Update transaction
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async updateTransaction(
    @Param('id') id: string,
    @Body() body: any,
    @Request() req,
  ) {
    const tx = await this.txService.updateTransaction(req.user.id, id, body);
    return successResponse(tx, 'Update transaction successfully', 200);
  }

  // ✅ Delete transaction
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deleteTransaction(@Param('id') id: string, @Request() req) {
    const result = await this.txService.deleteTransaction(req.user.id, id);
    return successResponse(result, 'Delete transaction successfully', 200);
  }

  // ✅ Keep separate endpoints for backward compatibility
  @UseGuards(AuthGuard('jwt'))
  @Post('create-text')
  async createFromText(@Body('input') input: string, @Request() req) {
    const tx = await this.txService.createFromText(input, req.user.id);
    return successResponse(tx, 'Create spending successfully', 201);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('create-image')
  @UseInterceptors(FileInterceptor('receipt'))
  async createFromImage(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    const tx = await this.txService.createFromImage(
      file.buffer,
      file.mimetype,
      req.user.id,
    );
    return successResponse(
      tx,
      'Create spending from receipt successfully',
      201,
    );
  }

  // ✅ Debug endpoint (opsional)
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
