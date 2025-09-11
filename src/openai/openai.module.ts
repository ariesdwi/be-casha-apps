import { Module } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule, // biar ConfigService bisa dipakai
    HttpModule, // biar HttpService bisa dipakai
  ],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}
