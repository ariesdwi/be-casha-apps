// import {
//   Controller,
//   Get,
//   Post,
//   Put,
//   Delete,
//   Body,
//   Param,
//   UseGuards,
//   Request,
//   Req,
// } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { BudgetService } from './budget.service';
// import { CreateBudgetDto } from './dto/create-budget.dto';
// import { UpdateBudgetDto } from './dto/update-budget.dto';
// import { successResponse } from '../../common/response/response.helper';

// @Controller('budgets')
// export class BudgetController {
//   constructor(private readonly budgetService: BudgetService) {}

//   @UseGuards(AuthGuard('jwt'))
//   @Post()
//   async create(@Body() dto: CreateBudgetDto, @Request() req) {
//     const budget = await this.budgetService.create(dto, req.user.id);
//     return successResponse(budget, 'Budget created successfully', 201);
//   }

//   @UseGuards(AuthGuard('jwt'))
//   @Get()
//   async findAll(@Request() req) {
//     const budgets = await this.budgetService.findAll(req.user.userId);
//     return successResponse(budgets, 'Get budgets successfully', 200);
//   }

//   @UseGuards(AuthGuard('jwt'))
//   @Get('summary')
//   async getBudgetSummary(@Req() req) {
//     const summary = await this.budgetService.getBudgetSummary(req.user.userId);
//     return successResponse(
//       summary,
//       'Budget summary retrieved successfully',
//       200,
//     );
//   }

//   @UseGuards(AuthGuard('jwt'))
//   @Get(':id')
//   async findOne(@Param('id') id: string, @Request() req) {
//     const budget = await this.budgetService.findOne(id, req.user.userId);
//     return successResponse(budget, 'Get budget successfully', 200);
//   }

//   @UseGuards(AuthGuard('jwt'))
//   @Put(':id')
//   async update(
//     @Param('id') id: string,
//     @Body() dto: UpdateBudgetDto,
//     @Request() req,
//   ) {
//     const budget = await this.budgetService.update(id, dto, req.user.userId);
//     return successResponse(budget, 'Budget updated successfully', 200);
//   }

//   @UseGuards(AuthGuard('jwt'))
//   @Delete(':id')
//   async remove(@Param('id') id: string, @Request() req) {
//     await this.budgetService.remove(id, req.user.userId);
//     return successResponse(null, 'Budget deleted successfully', 200);
//   }
// }

// // import {
// //   Controller,
// //   Get,
// //   Post,
// //   Put,
// //   Delete,
// //   Body,
// //   Param,
// //   UseGuards,
// //   Request,
// //   Req,
// // } from '@nestjs/common';
// // import { AuthGuard } from '@nestjs/passport';
// // import { BudgetService } from './budget.service';
// // import { CreateBudgetDto } from './dto/create-budget.dto';
// // import { UpdateBudgetDto } from './dto/update-budget.dto';
// // import { successResponse } from '../../common/response/response.helper';

// // @Controller('budgets')
// // export class BudgetController {
// //   constructor(private readonly budgetService: BudgetService) {}

// //   @UseGuards(AuthGuard('jwt'))
// //   @Post()
// //   async create(@Body() dto: CreateBudgetDto, @Request() req) {
// //     const budget = await this.budgetService.create(dto, req.user.userId);
// //     return successResponse(budget, 'Budget created successfully', 201);
// //   }

// //   @UseGuards(AuthGuard('jwt'))
// //   @Get()
// //   async findAll(@Request() req) {
// //     const budgets = await this.budgetService.findAll(req.user.userId);
// //     return successResponse(budgets, 'Get budgets successfully', 200);
// //   }

// //   // MOVE THE SUMMARY ENDPOINT ABOVE THE :id ENDPOINT
// //   @UseGuards(AuthGuard('jwt'))
// //   @Get('summary')
// //   async getBudgetSummary(@Req() req) {
// //     const summary = await this.budgetService.getBudgetSummary(req.user.userId);
// //     return successResponse(
// //       summary,
// //       'Budget summary retrieved successfully',
// //       200,
// //     );
// //   }

// //   // This should come AFTER specific routes
// //   @UseGuards(AuthGuard('jwt'))
// //   @Get(':id')
// //   async findOne(@Param('id') id: string, @Request() req) {
// //     const budget = await this.budgetService.findOne(id, req.user.userId);
// //     return successResponse(budget, 'Get budget successfully', 200);
// //   }

// //   @UseGuards(AuthGuard('jwt'))
// //   @Put(':id')
// //   async update(
// //     @Param('id') id: string,
// //     @Body() dto: UpdateBudgetDto,
// //     @Request() req,
// //   ) {
// //     const budget = await this.budgetService.update(id, dto, req.user.userId);
// //     return successResponse(budget, 'Budget updated successfully', 200);
// //   }

// //   @UseGuards(AuthGuard('jwt'))
// //   @Delete(':id')
// //   async remove(@Param('id') id: string, @Request() req) {
// //     await this.budgetService.remove(id, req.user.userId);
// //     return successResponse(null, 'Budget deleted successfully', 200);
// //   }
// // }

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { successResponse } from '../../common/response/response.helper';

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  // CREATE a new budget (scoped to authenticated user)
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() dto: CreateBudgetDto, @Req() req) {
    const budget = await this.budgetService.create(dto, req.user.id);
    return successResponse(budget, 'Budget created successfully', 201);
  }

  // GET all budgets for authenticated user
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req) {
    const budgets = await this.budgetService.findAll(req.user.id);
    return successResponse(budgets, 'Budgets retrieved successfully', 200);
  }

  // GET budget summary (must come before :id route)
  @UseGuards(AuthGuard('jwt'))
  @Get('summary')
  async getBudgetSummary(@Req() req) {
    const summary = await this.budgetService.getBudgetSummary(req.user.id);
    return successResponse(
      summary,
      'Budget summary retrieved successfully',
      200,
    );
  }

  // GET a single budget by ID
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    const budget = await this.budgetService.findOne(id, req.user.id);
    return successResponse(budget, 'Budget retrieved successfully', 200);
  }

  // UPDATE a budget by ID
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
    @Req() req,
  ) {
    const budget = await this.budgetService.update(id, dto, req.user.id);
    return successResponse(budget, 'Budget updated successfully', 200);
  }

  // DELETE a budget by ID
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    await this.budgetService.remove(id, req.user.id);
    return successResponse(null, 'Budget deleted successfully', 200);
  }
}
