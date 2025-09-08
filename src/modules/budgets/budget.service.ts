// import { Injectable, NotFoundException } from '@nestjs/common';
// import { PrismaService } from '../../common/prisma/prisma.service';
// import { CreateBudgetDto } from './dto/create-budget.dto';
// import { UpdateBudgetDto } from './dto/update-budget.dto';

// @Injectable()
// export class BudgetService {
//   constructor(private prisma: PrismaService) {}

//   // CREATE budget
//   create = async (data: CreateBudgetDto, userId: string) => {
//     if (!data.category) {
//       throw new NotFoundException('Category is required');
//     }

//     // Find or create category
//     let category = await this.prisma.category.findUnique({
//       where: { name: data.category },
//     });

//     if (!category) {
//       category = await this.prisma.category.create({
//         data: { name: data.category },
//       });
//     }

//     // Create budget
//     const budget = await this.prisma.budget.create({
//       data: {
//         amount: data.amount,
//         spent: 0, // initial spent is 0
//         period: data.period,
//         startDate: new Date(data.startDate),
//         endDate: new Date(data.endDate),
//         userId, // from JWT
//         categoryId: category.id,
//       },
//       include: { category: true },
//     });

//     return this.formatBudget(budget);
//   };

//   // FIND ALL budgets by user
//   findAll = async (userId: string) => {
//     const budgets = await this.prisma.budget.findMany({
//       where: { userId },
//       include: { category: true },
//     });

//     return budgets.map(this.formatBudget);
//   };

//   // FIND ONE budget by id (verify user)
//   findOne = async (id: string, userId: string) => {
//     const budget = await this.prisma.budget.findUnique({
//       where: { id },
//       include: { category: true },
//     });

//     if (!budget || budget.userId !== userId) {
//       throw new NotFoundException('Budget not found');
//     }

//     return this.formatBudget(budget);
//   };

//   // UPDATE budget
//   update = async (id: string, data: UpdateBudgetDto, userId: string) => {
//     const budget = await this.prisma.budget.findUnique({ where: { id } });

//     if (!budget || budget.userId !== userId) {
//       throw new NotFoundException('Budget not found');
//     }

//     let categoryId;
//     if (data.category) {
//       let category = await this.prisma.category.findUnique({
//         where: { name: data.category },
//       });
//       if (!category) {
//         category = await this.prisma.category.create({
//           data: { name: data.category },
//         });
//       }
//       categoryId = category.id;
//     }

//     const updatedBudget = await this.prisma.budget.update({
//       where: { id },
//       data: {
//         amount: data.amount,
//         period: data.period,
//         startDate: data.startDate ? new Date(data.startDate) : undefined,
//         endDate: data.endDate ? new Date(data.endDate) : undefined,
//         categoryId,
//       },
//       include: { category: true },
//     });

//     return this.formatBudget(updatedBudget);
//   };

//   // DELETE budget
//   remove = async (id: string, userId: string) => {
//     const budget = await this.prisma.budget.findUnique({ where: { id } });

//     if (!budget || budget.userId !== userId) {
//       throw new NotFoundException('Budget not found');
//     }

//     return this.prisma.budget.delete({ where: { id } });
//   };

//   getTotalBudget = async (userId: string) => {
//     const result = await this.prisma.budget.aggregate({
//       where: { userId },
//       _sum: {
//         amount: true,
//       },
//     });

//     return result._sum.amount || 0;
//   };

//   // GET TOTAL SPENT for a user
//   getTotalSpent = async (userId: string) => {
//     const result = await this.prisma.budget.aggregate({
//       where: { userId },
//       _sum: {
//         spent: true,
//       },
//     });

//     return result._sum.spent || 0;
//   };

//   // GET BUDGET SUMMARY (total budget, spent, and remaining)
//   getBudgetSummary = async (userId: string) => {
//     const totalBudget = await this.getTotalBudget(userId);
//     const totalSpent = await this.getTotalSpent(userId);
//     const totalRemaining = totalBudget - totalSpent;

//     return {
//       totalBudget,
//       totalSpent,
//       totalRemaining,
//     };
//   };

//   // Helper to format budget with remaining amount
//   private formatBudget(budget) {
//     return {
//       id: budget.id,
//       amount: budget.amount,
//       spent: budget.spent || 0,
//       remaining: budget.amount - (budget.spent || 0),
//       period: budget.period,
//       startDate: budget.startDate,
//       endDate: budget.endDate,
//       category: {
//         id: budget.category.id,
//         name: budget.category.name,
//       },
//     };
//   }
// }

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) {}

  // CREATE budget (depends on JWT user)
  create = async (data: CreateBudgetDto, userId: string) => {
    if (!data.category) {
      throw new NotFoundException('Category is required');
    }

    // Find or create category
    let category = await this.prisma.category.findUnique({
      where: { name: data.category },
    });

    if (!category) {
      category = await this.prisma.category.create({
        data: { name: data.category },
      });
    }

    // Create budget
    const budget = await this.prisma.budget.create({
      data: {
        amount: data.amount,
        spent: 0,
        period: data.period,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        userId, // from JWT
        categoryId: category.id,
      },
      include: { category: true },
    });

    return this.formatBudget(budget);
  };

  // FIND ALL budgets by user
  findAll = async (userId: string) => {
    const budgets = await this.prisma.budget.findMany({
      where: { userId },
      include: { category: true },
    });

    return budgets.map(this.formatBudget);
  };

  // FIND ONE budget by id (verify user)
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

  // UPDATE budget (scoped to JWT user)
  update = async (id: string, data: UpdateBudgetDto, userId: string) => {
    const budget = await this.prisma.budget.findUnique({ where: { id } });

    if (!budget || budget.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }

    let categoryId: string | undefined;
    if (data.category) {
      let category = await this.prisma.category.findUnique({
        where: { name: data.category },
      });
      if (!category) {
        category = await this.prisma.category.create({
          data: { name: data.category },
        });
      }
      categoryId = category.id;
    }

    const updatedBudget = await this.prisma.budget.update({
      where: { id },
      data: {
        amount: data.amount,
        period: data.period,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        categoryId,
      },
      include: { category: true },
    });

    return this.formatBudget(updatedBudget);
  };

  // DELETE budget (scoped to JWT user)
  remove = async (id: string, userId: string) => {
    const budget = await this.prisma.budget.findUnique({ where: { id } });

    if (!budget || budget.userId !== userId) {
      throw new NotFoundException('Budget not found');
    }

    return this.prisma.budget.delete({ where: { id } });
  };

  // GET TOTAL BUDGET for a user
  getTotalBudget = async (userId: string) => {
    const result = await this.prisma.budget.aggregate({
      where: { userId },
      _sum: { amount: true },
    });

    return result._sum.amount || 0;
  };

  // GET TOTAL SPENT for a user
  getTotalSpent = async (userId: string) => {
    const result = await this.prisma.budget.aggregate({
      where: { userId },
      _sum: { spent: true },
    });

    return result._sum.spent || 0;
  };

  // GET BUDGET SUMMARY (total, spent, remaining)
  getBudgetSummary = async (userId: string) => {
    const totalBudget = await this.getTotalBudget(userId);
    const totalSpent = await this.getTotalSpent(userId);
    const totalRemaining = totalBudget - totalSpent;

    return { totalBudget, totalSpent, totalRemaining };
  };

  // Helper to format budget with remaining amount
  private formatBudget(budget) {
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
}
