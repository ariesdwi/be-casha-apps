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

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  // CREATE a new budget (scoped to authenticated user)
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() dto: CreateBudgetDto, @Req() req) {
    return this.budgetService.create(dto, req.user.id);
  }

  // GET all budgets for authenticated user (optional year/month filter)
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Query() query: FindBudgetsDto, @Req() req) {
    return this.budgetService.findAll(req.user.id, query.year, query.month);
  }

  // GET budget summary for user
  @UseGuards(AuthGuard('jwt'))
  @Get('summary')
  async getBudgetSummary(@Req() req, @Query() query: GetBudgetSummaryDto) {
    return this.budgetService.getBudgetSummary(
      req.user.id,
      query.month,
      query.year,
    );
  }

  // GET a single budget by ID
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req) {
    return this.budgetService.findOne(id, req.user.id);
  }

  // UPDATE a budget by ID
  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
    @Req() req,
  ) {
    return this.budgetService.update(id, dto, req.user.id);
  }

  // DELETE a budget by ID
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    return this.budgetService.remove(id, req.user.id);
  }
}
