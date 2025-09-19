// import { Module } from '@nestjs/common';
// import { CategoryModule } from './modules/category/category.module';
// import { PrismaModule } from './common/prisma/prisma.module';
// import { TransactionModule } from './modules/transaction/transaction.module';
// import { OpenAIModule } from './openai/openai.module';
// import { AuthModule } from './modules/auth/auth.module';
// import { BudgetModule } from './modules/budgets/budget.module';

// @Module({
//   imports: [
//     PrismaModule,
//     CategoryModule,
//     TransactionModule,
//     OpenAIModule,
//     AuthModule,
//     BudgetModule,
//   ],
// })
// export class AppModule {}


import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { CategoryModule } from './modules/category/category.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { OpenAIModule } from './openai/openai.module';
import { AuthModule } from './modules/auth/auth.module';
import { BudgetModule } from './modules/budgets/budget.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    // ✅ Load .env variables globally
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ✅ Your feature modules
    PrismaModule,
    CategoryModule,
    TransactionModule,
    OpenAIModule,
    AuthModule,
    BudgetModule,
    EmailModule, // <- added
  ],
})
export class AppModule {}
