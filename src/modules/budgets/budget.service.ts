import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  // --- Utils ---
  private parseMonthToDates(monthStr: string) {
    const parsed = dayjs(monthStr, 'MMMM YYYY'); // e.g. "September 2025"
    if (!parsed.isValid()) {
      throw new NotFoundException(
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

  private formatBudget(budget: any) {
    return {
      id: budget.id,
      amount: budget.amount,
      spent: budget.spent || 0,
      remaining: budget.amount - (budget.spent || 0),
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
  create = async (data: CreateBudgetDto, userId: string) => {
    if (!data.month) {
      throw new NotFoundException('Month is required');
    }

    const category = await this.getOrCreateCategory(data.category);
    const { startDate, endDate, period } = this.parseMonthToDates(data.month);

    const budget = await this.prisma.budget.create({
      data: {
        amount: data.amount,
        spent: 0,
        period,
        startDate,
        endDate,
        userId,
        categoryId: category.id,
      },
      include: { category: true },
    });

    return this.formatBudget(budget);
  };

  // --- FIND ALL ---
  findAll = async (userId: string, year?: string) => {
    const where: any = { userId };

    if (year) {
      where.startDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    const budgets = await this.prisma.budget.findMany({
      where,
      include: { category: true },
    });

    return budgets.map((b) => this.formatBudget(b));
  };

  // --- FIND ONE ---
  findOne = async (id: string, userId: string) => {
    const budget = await this.prisma.budget.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!budget || budget.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }

    return this.formatBudget(budget);
  };

  // --- UPDATE ---
  update = async (id: string, data: UpdateBudgetDto, userId: string) => {
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
  };

  // --- DELETE ---
  remove = async (id: string, userId: string) => {
    const budget = await this.prisma.budget.findUnique({ where: { id } });
    if (!budget || budget.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }

    return this.prisma.budget.delete({ where: { id } });
  };

  // --- SUMMARY ---
  private getTotalBudget = async (userId: string) => {
    const result = await this.prisma.budget.aggregate({
      where: { userId },
      _sum: { amount: true },
    });
    return result._sum.amount || 0;
  };

  private getTotalSpent = async (userId: string) => {
    const result = await this.prisma.budget.aggregate({
      where: { userId },
      _sum: { spent: true },
    });
    return result._sum.spent || 0;
  };

  async getBudgetSummary(userId: string, month?: string, year?: string) {
    let where: any = { userId };

    if (month) {
      const [y, m] = month.split('-').map(Number);
      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0); // last day of month
      where.startDate = { gte: startDate, lte: endDate };
    } else if (year) {
      where.startDate = {
        gte: new Date(`${year}-01-01`),
        lte: new Date(`${year}-12-31`),
      };
    }

    const totalBudget = await this.prisma.budget.aggregate({
      where,
      _sum: { amount: true },
    });

    const totalSpent = await this.prisma.budget.aggregate({
      where,
      _sum: { spent: true },
    });

    return {
      totalBudget: totalBudget._sum.amount || 0,
      totalSpent: totalSpent._sum.spent || 0,
      totalRemaining:
        (totalBudget._sum.amount || 0) - (totalSpent._sum.spent || 0),
    };
  }
}
