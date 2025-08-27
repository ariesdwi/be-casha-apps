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
    // Get current date for context
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const prompt = `
You are a financial assistant. Parse the user input into JSON with the following fields:
- name: transaction name (string, cleaned up)
- amount: transaction amount (number, parse Indonesian formats like "rb" = 1000, "jt" = 1000000)
- datetime: ISO 8601 string (use today's date if not specified: ${currentDate})
- category: short category name (Food, Transport, Shopping, Bills, etc.)

Today's date is: ${currentDate}
If the user doesn't specify a date, assume today's date.
If the user specifies a date (like "20-08-2023", "yesterday", "last week"), use that instead.
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

    let parsed: any;
    try {
      parsed = JSON.parse(text ?? '{}');
    } catch (e) {
      parsed = {};
    }

    // ✅ Default datetime to start of today UTC if missing
    if (!parsed.datetime) {
      const now = new Date();
      parsed.datetime = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      ).toISOString();
    }

    // ✅ Normalize amount (ensure number)
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

    // ✅ Ensure category and name exist
    parsed.category ??= 'Other';
    parsed.name ??= 'Unknown';

    return parsed;
  }

  // NEW: Method to parse transaction from image
  async parseTransactionFromImage(imageBuffer: Buffer, imageMimeType: string) {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const prompt = `
You are a financial assistant. Analyze this receipt image and extract transaction details into JSON with:
- name: merchant/store name (string)
- amount: total amount paid (number)
- datetime: ISO 8601 string (use today's date ${currentDate} if not visible)
- category: short category based on items (Food, Shopping, Electronics, etc.)

If date is not visible on receipt, use today's date: ${currentDate}
`;

    // Convert buffer to base64 for OpenAI
    const base64Image = imageBuffer.toString('base64');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o', // Use GPT-4o for better image understanding
      messages: [
        {
          role: 'system',
          content: prompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract transaction details from this receipt:',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${imageMimeType};base64,${base64Image}`,
              },
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
    } catch (e) {
      throw new Error('Failed to parse AI response');
    }

    // Apply the same normalization as text parsing
    return this.normalizeParsedData(parsed);
  }

  // Helper method to normalize parsed data (common for both text and image)
  private normalizeParsedData(parsed: any) {
    // ✅ Default datetime to start of today UTC if missing
    if (!parsed.datetime) {
      const now = new Date();
      parsed.datetime = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      ).toISOString();
    }

    // ✅ Normalize amount (ensure number)
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

    // ✅ Ensure category and name exist
    parsed.category ??= 'Other';
    parsed.name ??= 'Unknown';

    return parsed;
  }

  
}
