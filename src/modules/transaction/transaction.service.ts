// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../../common/prisma/prisma.service.js';
// import { OpenAIService } from '../../openai/openai.service.js';

// @Injectable()
// export class TransactionService {
//   constructor(
//     private prisma: PrismaService,
//     private openAIService: OpenAIService,
//   ) {}

//   // ✅ Return transactions only for the logged-in user
//   async findAll(userId: string) {
//     const transactions = await this.prisma.transaction.findMany({
//       where: { userId },
//       include: { category: true },
//       orderBy: { datetime: 'desc' },
//     });

//     return transactions.map((tx) => ({
//       id: tx.id,
//       name: tx.name,
//       amount: tx.amount,
//       datetime: tx.datetime,
//       category: tx.category.name,
//     }));
//   }

//   // ✅ Create a transaction from text input
//   async createFromText(input: string, userId: string) {
//     const parsed = await this.openAIService.parseTransaction(input);
//     return this.createTransaction(parsed, userId);
//   }

//   // ✅ NEW: Create a transaction from image (receipt)
//   async createFromImage(
//     imageBuffer: Buffer,
//     imageMimeType: string,
//     userId: string,
//   ) {
//     const parsed = await this.openAIService.parseTransactionFromImage(
//       imageBuffer,
//       imageMimeType,
//     );
//     return this.createTransaction(parsed, userId);
//   }

//   // ✅ Refactored: Common transaction creation logic
//   private async createTransaction(parsed: any, userId: string) {
//     // Ensure datetime and amount are properly formatted
//     const txDatetime = new Date(parsed.datetime);
//     const txAmount = Number(parsed.amount) || 0;

//     // Upsert category
//     const category = await this.prisma.category.upsert({
//       where: { name: parsed.category },
//       update: {},
//       create: { name: parsed.category, isActive: true },
//     });

//     // Create transaction
//     const transaction = await this.prisma.transaction.create({
//       data: {
//         name: parsed.name,
//         amount: txAmount,
//         datetime: txDatetime,
//         category: { connect: { id: category.id } },
//         user: { connect: { id: userId } },
//       },
//       include: { category: true },
//     });

//     // Update corresponding budget if it exists
//     await this.updateBudget(userId, category.id, txDatetime, txAmount);

//     return {
//       id: transaction.id,
//       name: transaction.name,
//       amount: transaction.amount,
//       datetime: transaction.datetime,
//       category: transaction.category.name,
//     };
//   }

//   // ✅ Helper: Update budget if exists
//   private async updateBudget(
//     userId: string,
//     categoryId: string,
//     datetime: Date,
//     amount: number,
//   ) {
//     const budget = await this.prisma.budget.findFirst({
//       where: {
//         userId,
//         categoryId,
//         startDate: { lte: datetime },
//         endDate: { gte: datetime },
//       },
//     });

//     if (budget) {
//       await this.prisma.budget.update({
//         where: { id: budget.id },
//         data: {
//           spent: (budget.spent || 0) + amount,
//         },
//       });
//     }
//   }
// }

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { OpenAIService } from '../../openai/openai.service.js';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private openAIService: OpenAIService,
  ) {}

  // ✅ Return transactions only for the logged-in user
  async findAll(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { datetime: 'desc' },
    });

    return transactions.map((tx) => ({
      id: tx.id,
      name: tx.name,
      amount: tx.amount,
      datetime: tx.datetime,
      category: tx.category.name,
    }));
  }

  // ✅ Create a transaction from text input
  async createFromText(input: string, userId: string) {
    const parsed = await this.openAIService.parseTransaction(input);
    return this.createTransaction(parsed, userId);
  }

  // ✅ NEW: Create a transaction from image (receipt)
  async createFromImage(
    imageBuffer: Buffer,
    imageMimeType: string,
    userId: string,
  ) {
    const parsed = await this.openAIService.parseTransactionFromImage(
      imageBuffer,
      imageMimeType,
    );
    return this.createTransaction(parsed, userId);
  }

  // ✅ Refactored: Common transaction creation logic
  private async createTransaction(parsed: any, userId: string) {
    const txDatetime = new Date(parsed.datetime);
    const txAmount = Number(parsed.amount) || 0;

    const category = await this.prisma.category.upsert({
      where: { name: parsed.category },
      update: {},
      create: { name: parsed.category, isActive: true },
    });

    const transaction = await this.prisma.transaction.create({
      data: {
        name: parsed.name,
        amount: txAmount,
        datetime: txDatetime,
        category: { connect: { id: category.id } },
        user: { connect: { id: userId } },
      },
      include: { category: true },
    });

    await this.updateBudget(userId, category.id, txDatetime, txAmount);

    return this.mapTransaction(transaction);
  }

  // ✅ UPDATE transaction
  async updateTransaction(
    userId: string,
    transactionId: string,
    data: { name?: string; amount?: number; datetime?: Date; category?: string },
  ) {
    // Cek dulu apakah transaksi ada & milik user ini
    const existing = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { category: true },
    });

    if (!existing) throw new NotFoundException('Transaction not found');
    if (existing.userId !== userId) throw new ForbiddenException();

    // Handle category (jika ada update)
    let categoryId = existing.categoryId;
    if (data.category) {
      const category = await this.prisma.category.upsert({
        where: { name: data.category },
        update: {},
        create: { name: data.category, isActive: true },
      });
      categoryId = category.id;
    }

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        name: data.name ?? existing.name,
        amount: data.amount ?? existing.amount,
        datetime: data.datetime ?? existing.datetime,
        categoryId,
      },
      include: { category: true },
    });

    return this.mapTransaction(updated);
  }

  // ✅ DELETE transaction
  async deleteTransaction(userId: string, transactionId: string) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existing) throw new NotFoundException('Transaction not found');
    if (existing.userId !== userId) throw new ForbiddenException();

    await this.prisma.transaction.delete({ where: { id: transactionId } });

    return { success: true };
  }

  // ✅ Helper: Update budget if exists
  private async updateBudget(
    userId: string,
    categoryId: string,
    datetime: Date,
    amount: number,
  ) {
    const budget = await this.prisma.budget.findFirst({
      where: {
        userId,
        categoryId,
        startDate: { lte: datetime },
        endDate: { gte: datetime },
      },
    });

    if (budget) {
      await this.prisma.budget.update({
        where: { id: budget.id },
        data: {
          spent: (budget.spent || 0) + amount,
        },
      });
    }
  }

  // ✅ Helper: map transaction
  private mapTransaction(tx: any) {
    return {
      id: tx.id,
      name: tx.name,
      amount: tx.amount,
      datetime: tx.datetime,
      category: tx.category.name,
    };
  }
}
