import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('❌ OPENAI_API_KEY is not set in environment variables');
    }

    this.openai = new OpenAI({ apiKey });
  }

  async parseTransaction(input: string) {
    const prompt = `
You are a financial assistant. Parse the user input into JSON with the following fields:
- name: transaction name (string, cleaned up)
- amount: transaction amount (number, parse Indonesian formats like "rb" = 1000, "jt" = 1000000)
- datetime: ISO 8601 string (use today's date if not specified)
- category: short category name (Food, Transport, Shopping, Bills, etc.)
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: input },
      ],
      response_format: { type: 'json_object' }, // ✅ forces valid JSON only
    });

    const text = response.choices[0].message?.content?.trim();

    try {
      return JSON.parse(text ?? '{}');
    } catch (e) {
      throw new Error(`Failed to parse AI response: ${text}`);
    }
  }
}
