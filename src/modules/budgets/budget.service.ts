import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

export interface FormattedBudget {
  id: string;
  amount: number;
  spent: number;
  remaining: number;
  period: string;
  startDate: Date;
  endDate: Date;
  category: {
    id: string;
    name: string;
  };
}

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  // --- Utils ---
  private parseMonthToDates(monthStr: string) {
    const parsed = dayjs(monthStr, 'MMMM YYYY'); // e.g. "September 2025"
    if (!parsed.isValid()) {
      throw new BadRequestException(
        'Invalid month format. Use format like "September 2025"',
      );
    }

    return {
      startDate: parsed.startOf('month').toDate(),
      endDate: parsed.endOf('month').toDate(),
      period: 'monthly',
    };
  }

  private async getOrCreateCategory(name: string) {
    let category = await this.prisma.category.findUnique({ where: { name } });
    if (!category) {
      category = await this.prisma.category.create({ data: { name } });
    }
    return category;
  }

  private async calculateSpent(
    userId: string,
    categoryId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const spentAggregate = await this.prisma.transaction.aggregate({
      where: {
        userId,
        categoryId,
        datetime: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });
    return spentAggregate._sum.amount || 0;
  }

  private async formatBudget(budget: any): Promise<FormattedBudget> {
    const spent = await this.calculateSpent(
      budget.userId,
      budget.category.id,
      budget.startDate,
      budget.endDate,
    );

    return {
      id: budget.id,
      amount: budget.amount,
      spent,
      remaining: budget.amount - spent,
      period: budget.period,
      startDate: budget.startDate,
      endDate: budget.endDate,
      category: {
        id: budget.category.id,
        name: budget.category.name,
      },
    };
  }

  // --- CREATE ---
  async create(
    data: CreateBudgetDto,
    userId: string,
  ): Promise<FormattedBudget> {
    if (!data.month) {
      throw new BadRequestException('Month is required');
    }

    const category = await this.getOrCreateCategory(data.category);
    const { startDate, endDate, period } = this.parseMonthToDates(data.month);

    // Check if budget already exists before trying to create
    const existingBudget = await this.prisma.budget.findFirst({
      where: {
        userId,
        categoryId: category.id,
        startDate,
        endDate,
      },
    });

    if (existingBudget) {
      throw new BadRequestException(
        `You already have a budget for category "${category.name}" in ${data.month}. Please update the existing budget instead.`,
      );
    }

    try {
      const budget = await this.prisma.budget.create({
        data: {
          amount: data.amount,
          period,
          startDate,
          endDate,
          userId,
          categoryId: category.id,
        },
        include: { category: true },
      });

      return this.formatBudget(budget);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Fallback error handling in case the pre-check missed something
          throw new BadRequestException(
            `You already have a budget for category "${category.name}" in ${data.month}. Please update the existing budget instead.`,
          );
        }
      }

      throw error;
    }
  }

  // --- FIND ALL ---
  async findAll(
    userId: string,
    year?: string,
    month?: string,
  ): Promise<FormattedBudget[]> {
    const where: any = { userId };

    if (month) {
      const [y, m] = month.split('-').map(Number);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0);
      where.startDate = { gte: startDate, lte: endDate };
    } else if (year) {
      where.startDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    const budgets = await this.prisma.budget.findMany({
      where,
      include: { category: true },
    });

    const results: FormattedBudget[] = [];
    for (const b of budgets) {
      results.push(await this.formatBudget(b));
    }
    return results;
  }

  // --- FIND ONE ---
  async findOne(id: string, userId: string): Promise<FormattedBudget> {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!budget || budget.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }

    return this.formatBudget(budget);
  }

  // --- UPDATE ---
  async update(
    id: string,
    data: UpdateBudgetDto,
    userId: string,
  ): Promise<FormattedBudget> {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }

    let categoryId: string | undefined;
    if (data.category) {
      const category = await this.getOrCreateCategory(data.category);
      categoryId = category.id;
    }

    let startDate: Date | undefined;
    let endDate: Date | undefined;
    let period: string | undefined;

    if (data.month) {
      const parsed = this.parseMonthToDates(data.month);
      startDate = parsed.startDate;
      endDate = parsed.endDate;
      period = parsed.period;
    }

    // Check if the update would create a duplicate
    if (categoryId && startDate && endDate) {
      const existingBudget = await this.prisma.budget.findFirst({
        where: {
          userId,
          categoryId,
          startDate,
          endDate,
          NOT: { id }, // Exclude the current budget from the check
        },
      });

      if (existingBudget) {
        throw new BadRequestException(
          `You already have a budget for this category in ${data.month || this.formatMonthFromDate(startDate)}.`,
        );
      }
    }

    try {
      const updatedBudget = await this.prisma.budget.update({
        where: { id },
        data: {
          amount: data.amount ?? budget.amount,
          period,
          startDate,
          endDate,
          categoryId,
        },
        include: { category: true },
      });

      return this.formatBudget(updatedBudget);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException(
            'Cannot update budget. A budget with these parameters already exists.',
          );
        }
      }

      throw error;
    }
  }

  // --- DELETE ---
  async remove(id: string, userId: string) {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }

    return this.prisma.budget.delete({ where: { id } });
  }

  // --- SUMMARY ---
  async getBudgetSummary(
    userId: string,
    month?: string,
    year?: string,
  ): Promise<{
    totalBudget: number;
    totalSpent: number;
    totalRemaining: number;
  }> {
    let where: any = { userId };

    if (month) {
      const [y, m] = month.split('-').map(Number);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0);
      where.startDate = { gte: startDate, lte: endDate };
    } else if (year) {
      where.startDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    const budgets = await this.prisma.budget.findMany({
      where,
      include: { category: true },
    });

    let totalBudget = 0;
    let totalSpent = 0;

    for (const b of budgets) {
      const spent = await this.calculateSpent(
        b.userId,
        b.category.id,
        b.startDate,
        b.endDate,
      );
      totalBudget += b.amount;
      totalSpent += spent;
    }

    return {
      totalBudget,
      totalSpent,
      totalRemaining: totalBudget - totalSpent,
    };
  }

  // Helper method to format date back to month string
  private formatMonthFromDate(date: Date): string {
    return dayjs(date).format('MMMM YYYY');
  }
}
