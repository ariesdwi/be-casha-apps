import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BudgetService } from './budget.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { successResponse } from '../../common/response/response.helper';

@Controller('budgets')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() dto: CreateBudgetDto, @Request() req) {
    const budget = await this.budgetService.create(dto, req.user.userId);
    return successResponse(budget, 'Budget created successfully', 201);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Request() req) {
    const budgets = await this.budgetService.findAll(req.user.userId);
    return successResponse(budgets, 'Get budgets successfully', 200);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const budget = await this.budgetService.findOne(id, req.user.userId);
    return successResponse(budget, 'Get budget successfully', 200);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
    @Request() req,
  ) {
    const budget = await this.budgetService.update(id, dto, req.user.userId);
    return successResponse(budget, 'Budget updated successfully', 200);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.budgetService.remove(id, req.user.userId);
    return successResponse(null, 'Budget deleted successfully', 200);
  }
}
