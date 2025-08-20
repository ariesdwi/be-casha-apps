import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { OpenAIModule } from '../../openai/openai.module';

@Module({
  imports: [OpenAIModule],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
