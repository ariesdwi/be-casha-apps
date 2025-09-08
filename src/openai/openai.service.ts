import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  // ✅ Expanded real-world categories
  private allowedCategories = [
    'Food', // Restaurants, groceries, cafes
    'Shopping', // Clothes, electronics, goods
    'Entertainment', // Movies, games, events, hobbies
    'Transportation', // Gas, public transport, taxis, flights
    'Utilities', // Electricity, water, internet, phone
    'Rent', // Housing payments
    'Healthcare', // Doctor visits, medicine, insurance
    'Education', // Tuition, courses, books
    'Travel', // Hotels, flights, tours
    'Subscriptions', // Netflix, Spotify, apps
    'Gifts', // Presents, donations
    'Investments', // Stocks, crypto, funds
    'Taxes', // Income tax, property tax
    'Insurance', // Life, car, health
    'Savings', // Bank deposits, emergency funds
    'Other', // Anything else
  ];

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('❌ OPENAI_API_KEY is not set in environment variables');
    }
    this.openai = new OpenAI({ apiKey });
  }

  async parseTransaction(input: string) {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const prompt = `
You are a financial assistant. Parse the user input into JSON with fields:
- name: transaction name (string, cleaned up)
- amount: transaction amount (number, parse Indonesian formats like "rb" = 1000, "jt" = 1000000)
- datetime: ISO 8601 string (use today's date if not specified: ${currentDate})
- category: MUST BE ONE OF THESE EXACT VALUES: ${this.allowedCategories.join(', ')}

STRICT RULES:
1. Food: restaurants, groceries, cafes
2. Shopping: goods, clothes, electronics
3. Entertainment: movies, games, hobbies
4. Transportation: fuel, taxi, bus, flights
5. Utilities: electricity, water, internet, phone
6. Rent: housing payments
7. Healthcare, Education, Travel, Subscriptions, Gifts, Investments, Taxes, Insurance, Savings: follow standard usage
8. Other: anything else
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: input },
      ],
      response_format: { type: 'json_object' },
    });

    const text = response.choices[0].message?.content?.trim();
    let parsed: any;
    try {
      parsed = JSON.parse(text ?? '{}');
    } catch {
      parsed = {};
    }

    if (!this.allowedCategories.includes(parsed.category)) {
      parsed.category = 'Other';
    }

    return this.normalizeParsedData(parsed);
  }

  async parseTransactionFromImage(imageBuffer: Buffer, imageMimeType: string) {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const prompt = `
You are a financial assistant. Analyze this receipt image and extract transaction details into JSON:
- name: merchant/store name (string)
- amount: total amount paid (number)
- datetime: ISO 8601 string (use today's date ${currentDate} if not visible)
- category: MUST BE ONE OF THESE EXACT VALUES: ${this.allowedCategories.join(', ')}

STRICT RULES:
1. Food, Shopping, Entertainment, Transportation, Utilities, Rent
2. Healthcare, Education, Travel, Subscriptions, Gifts, Investments, Taxes, Insurance, Savings
3. Other: anything else
`;

    const base64Image = imageBuffer.toString('base64');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o', // GPT-4o for image understanding
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract transaction details from this receipt:',
            },
            {
              type: 'image_url',
              image_url: { url: `data:${imageMimeType};base64,${base64Image}` },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const text = response.choices[0].message?.content?.trim();
    let parsed: any;
    try {
      parsed = JSON.parse(text ?? '{}');
    } catch {
      throw new Error('Failed to parse AI response');
    }

    if (!this.allowedCategories.includes(parsed.category)) {
      parsed.category = 'Other';
    }

    return this.normalizeParsedData(parsed);
  }

  private normalizeParsedData(parsed: any) {
    if (!parsed.datetime) {
      const now = new Date();
      parsed.datetime = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      ).toISOString();
    }

    if (parsed.amount) {
      const amt = String(parsed.amount).toLowerCase().replace(/\s/g, '');
      if (amt.endsWith('rb'))
        parsed.amount = parseFloat(amt.replace('rb', '')) * 1000;
      else if (amt.endsWith('jt'))
        parsed.amount = parseFloat(amt.replace('jt', '')) * 1000000;
      else parsed.amount = parseFloat(amt);
    } else {
      parsed.amount = 0;
    }

    parsed.category ??= 'Other';
    parsed.name ??= 'Unknown';

    if (!this.allowedCategories.includes(parsed.category)) {
      parsed.category = 'Other';
    }

    return parsed;
  }
}
