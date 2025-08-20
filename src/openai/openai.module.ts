import { Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [OpenAIService],
  exports: [OpenAIService], // 👈 allow other modules to use it
})
export class OpenAIModule {}
