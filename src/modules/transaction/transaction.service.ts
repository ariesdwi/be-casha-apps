import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { OpenAIService } from '../../openai/openai.service.js';

@Injectable()
export class TransactionService {
  constructor(
    private prisma: PrismaService,
    private openAIService: OpenAIService,
  ) {}

  async findAll() {
    const transactions = await this.prisma.transaction.findMany({
      include: { category: true },
    });

    return {
      transactions: transactions.map((tx) => ({
        id: tx.id,
        name: tx.name,
        amount: tx.amount,
        datetime: tx.datetime,
        category: tx.category.name,
      })),
    };
  }

  async createFromText(input: string) {
    const parsed = await this.openAIService.parseTransaction(input);

    const category = await this.prisma.category.upsert({
      where: { name: parsed.category },
      update: {},
      create: { name: parsed.category, isActive: true },
    });

    const transaction = await this.prisma.transaction.create({
      data: {
        name: parsed.name,
        amount: parsed.amount,
        datetime: new Date(parsed.datetime),
        category: { connect: { id: category.id } },
      },
      include: { category: true },
    });

    return {
      id: transaction.id,
      name: transaction.name,
      amount: transaction.amount,
      datetime: transaction.datetime,
      category: transaction.category.name,
    };
  }
}
