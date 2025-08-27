import { Budget as PrismaBudget } from '../../../../generated/prisma';

export class BudgetEntity implements PrismaBudget {
  id: string;
  amount: number;
  spent: number; // <-- new field
  period: string;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  categoryId: string;

  // Optional helper
  get remaining(): number {
    return this.amount - (this.spent || 0);
  }
}
