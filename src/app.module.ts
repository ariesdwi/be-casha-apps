import { Module } from '@nestjs/common';
import { CategoryModule } from './modules/category/category.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { TransactionModule } from './modules/transaction/transaction.module';
import { OpenAIModule } from './openai/openai.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [PrismaModule, CategoryModule, TransactionModule, OpenAIModule, AuthModule],
})
export class AppModule {}
