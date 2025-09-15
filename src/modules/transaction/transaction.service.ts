import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { OpenAIService } from '../../openai/openai.service.js';
import dayjs from 'dayjs';

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

    return transactions.map((tx) => this.mapTransaction(tx));
  }

  // ✅ Create a transaction from text input
  async createFromText(input: string, userId: string) {
    const parsed = await this.openAIService.parseTransaction(input);
    return this.createTransaction(parsed, userId);
  }

  // ✅ Create a transaction from image (receipt)
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
    const txDatetime = this.parseDatetime(parsed);
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
    data: {
      name?: string;
      amount?: number;
      datetime?: Date;
      category?: string;
    },
  ) {
    const existing = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { category: true },
    });

    if (!existing) throw new NotFoundException('Transaction not found');
    if (existing.userId !== userId) throw new ForbiddenException();

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

  // ✅ Helper: parse datetime safely
  private parseDatetime(parsed: any): Date {
    let txDatetime: Date;

    if (parsed.datetime) {
      // Full datetime provided
      txDatetime = new Date(parsed.datetime);
    } else if (parsed.date) {
      // Date (with optional time)
      const time = parsed.time ?? '00:00';
      txDatetime = dayjs(`${parsed.date} ${time}`, 'YYYY-MM-DD HH:mm').toDate();
    } else {
      // Fallback: now
      txDatetime = new Date();
    }

    if (!dayjs(txDatetime).isValid()) {
      throw new Error(`Invalid datetime: ${JSON.stringify(parsed)}`);
    }

    return txDatetime;
  }
}
