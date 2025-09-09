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
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { FindBudgetsDto } from './dto/find-budgets.dto';
import { GetBudgetSummaryDto } from './dto/get-budget-summary.dto';
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

  // GET all budgets for authenticated user (optional year filter)
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Query() query: FindBudgetsDto, @Req() req) {
    const budgets = await this.budgetService.findAll(req.user.id, query.year);
    return successResponse(budgets, 'Budgets retrieved successfully', 200);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('summary')
  async getBudgetSummary(@Req() req, @Query() query: GetBudgetSummaryDto) {
    const summary = await this.budgetService.getBudgetSummary(
      req.user.id,
      query.month,
      query.year,
    );
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
