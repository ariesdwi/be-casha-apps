// import { Injectable } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import OpenAI from 'openai';

// @Injectable()
// export class OpenAIService {
//   private openai: OpenAI;

//   // ✅ Expanded real-world categories
//   private allowedCategories = [
//     'Food', // Restaurants, groceries, cafes
//     'Shopping', // Clothes, electronics, goods
//     'Entertainment', // Movies, games, events, hobbies
//     'Transportation', // Gas, public transport, taxis, flights
//     'Utilities', // Electricity, water, internet, phone
//     'Rent', // Housing payments
//     'Healthcare', // Doctor visits, medicine, insurance
//     'Education', // Tuition, courses, books
//     'Travel', // Hotels, flights, tours
//     'Subscriptions', // Netflix, Spotify, apps
//     'Gifts', // Presents, donations
//     'Investments', // Stocks, crypto, funds
//     'Taxes', // Income tax, property tax
//     'Insurance', // Life, car, health
//     'Savings', // Bank deposits, emergency funds
//     'Other', // Anything else
//   ];

//   // Currency exchange rates (you might want to fetch these from an API in production)
//  private exchangeRates: Record<string, number> = {
//     USD: 16460, // 1 USD ≈ 16,460 IDR
//     EUR: 17600, // 1 EUR ≈ 17,600 IDR
//     SGD: 12150, // 1 SGD ≈ 12,150 IDR
//     MYR: 3500,  // 1 MYR ≈ 3,500 IDR
//     GBP: 19400, // 1 GBP ≈ 19,400 IDR
//     AUD: 10800, // 1 AUD ≈ 10,800 IDR
//     JPY: 112,   // 1 JPY ≈ 112 IDR
//     CNY: 2260,  // 1 CNY ≈ 2,260 IDR
//     KRW: 12,    // 1 KRW ≈ 12 IDR
//   };

//   constructor(private config: ConfigService) {
//     const apiKey = this.config.get<string>('OPENAI_API_KEY');
//     if (!apiKey) {
//       throw new Error('❌ OPENAI_API_KEY is not set in environment variables');
//     }
//     this.openai = new OpenAI({ apiKey });
//   }

//   async parseTransaction(input: string) {
//     const currentDate = new Date().toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });

//     const prompt = `
// You are a financial assistant. Parse the user input into JSON with fields:
// - name: transaction name (string, cleaned up)
// - amount: transaction amount (number, parse Indonesian formats like "rb" = 1000, "jt" = 1000000)
// - currency: currency code (IDR, USD, EUR, SGD, MYR, GBP, AUD, JPY, CNY, KRW, etc.)
// - datetime: ISO 8601 string (use today's date if not specified: ${currentDate})
// - category: MUST BE ONE OF THESE EXACT VALUES: ${this.allowedCategories.join(', ')}

// STRICT RULES:
// 1. Food: restaurants, groceries, cafes
// 2. Shopping: goods, clothes, electronics
// 3. Entertainment: movies, games, hobbies
// 4. Transportation: fuel, taxi, bus, flights
// 5. Utilities: electricity, water, internet, phone
// 6. Rent: housing payments
// 7. Healthcare, Education, Travel, Subscriptions, Gifts, Investments, Taxes, Insurance, Savings: follow standard usage
// 8. Other: anything else

// IMPORTANT: Detect and include the currency code (IDR, USD, EUR, etc.) in the response.
// `;

//     const response = await this.openai.chat.completions.create({
//       model: 'gpt-4o-mini',
//       messages: [
//         { role: 'system', content: prompt },
//         { role: 'user', content: input },
//       ],
//       response_format: { type: 'json_object' },
//     });

//     const text = response.choices[0].message?.content?.trim();
//     let parsed: any;
//     try {
//       parsed = JSON.parse(text ?? '{}');
//     } catch {
//       parsed = {};
//     }

//     if (!this.allowedCategories.includes(parsed.category)) {
//       parsed.category = 'Other';
//     }

//     return this.normalizeParsedData(parsed);
//   }

//   async parseTransactionFromImage(imageBuffer: Buffer, imageMimeType: string) {
//     const currentDate = new Date().toLocaleDateString('en-US', {
//       weekday: 'long',
//       year: 'numeric',
//       month: 'long',
//       day: 'numeric',
//     });

//     const prompt = `
// You are a financial assistant. Analyze this receipt image and extract transaction details into JSON:
// - name: merchant/store name (string)
// - amount: total amount paid (number)
// - currency: currency code (IDR, USD, EUR, SGD, MYR, GBP, AUD, JPY, CNY, KRW, etc.)
// - datetime: ISO 8601 string (use today's date ${currentDate} if not visible)
// - category: MUST BE ONE OF THESE EXACT VALUES: ${this.allowedCategories.join(', ')}

// STRICT RULES:
// 1. Food, Shopping, Entertainment, Transportation, Utilities, Rent
// 2. Healthcare, Education, Travel, Subscriptions, Gifts, Investments, Taxes, Insurance, Savings
// 3. Other: anything else

// IMPORTANT: Detect and include the currency code (IDR, USD, EUR, etc.) in the response.
// `;

//     const base64Image = imageBuffer.toString('base64');

//     const response = await this.openai.chat.completions.create({
//       model: 'gpt-4o', // GPT-4o for image understanding
//       messages: [
//         { role: 'system', content: prompt },
//         {
//           role: 'user',
//           content: [
//             {
//               type: 'text',
//               text: 'Extract transaction details from this receipt:',
//             },
//             {
//               type: 'image_url',
//               image_url: { url: `data:${imageMimeType};base64,${base64Image}` },
//             },
//           ],
//         },
//       ],
//       response_format: { type: 'json_object' },
//       max_tokens: 1000,
//     });

//     const text = response.choices[0].message?.content?.trim();
//     let parsed: any;
//     try {
//       parsed = JSON.parse(text ?? '{}');
//     } catch {
//       throw new Error('Failed to parse AI response');
//     }

//     if (!this.allowedCategories.includes(parsed.category)) {
//       parsed.category = 'Other';
//     }

//     return this.normalizeParsedData(parsed);
//   }

//   private normalizeParsedData(parsed: any) {
//     if (!parsed.datetime) {
//       const now = new Date();
//       parsed.datetime = new Date(
//         Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
//       ).toISOString();
//     }

//     // Parse amount and handle Indonesian formats
//     if (parsed.amount) {
//       const amt = String(parsed.amount).toLowerCase().replace(/\s/g, '');
//       if (amt.endsWith('rb'))
//         parsed.amount = parseFloat(amt.replace('rb', '')) * 1000;
//       else if (amt.endsWith('jt'))
//         parsed.amount = parseFloat(amt.replace('jt', '')) * 1000000;
//       else parsed.amount = parseFloat(amt);
//     } else {
//       parsed.amount = 0;
//     }

//     // Convert non-IDR currencies to IDR
//     if (parsed.currency && parsed.currency.toUpperCase() !== 'IDR') {
//       const currencyCode = parsed.currency.toUpperCase();
//       const exchangeRate = this.exchangeRates[currencyCode] || 1;

//       // Store original amount and currency for reference
//       parsed.originalAmount = parsed.amount;
//       parsed.originalCurrency = currencyCode;

//       // Convert to IDR
//       parsed.amount = parsed.amount * exchangeRate;
//       parsed.currency = 'IDR';
//     } else {
//       parsed.currency = 'IDR'; // Default to IDR if no currency specified
//     }

//     parsed.category ??= 'Other';
//     parsed.name ??= 'Unknown';

//     if (!this.allowedCategories.includes(parsed.category)) {
//       parsed.category = 'Other';
//     }

//     return parsed;
//   }

//   // Optional: Method to update exchange rates dynamically
//   async updateExchangeRates() {
//     // In a real application, you might want to fetch rates from an API like:
//     // https://api.exchangerate-api.com/v4/latest/USD
//     // This is a simplified static example
//     console.log('Exchange rates updated manually');
//   }
// }

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OpenAIService {
  private openai: OpenAI;
  private apiUrl = 'https://api.exchangerate.host/latest';

  // ✅ Expanded real-world categories
  private allowedCategories = [
    'Food',
    'Shopping',
    'Entertainment',
    'Transportation',
    'Utilities',
    'Rent',
    'Healthcare',
    'Education',
    'Travel',
    'Subscriptions',
    'Gifts',
    'Investments',
    'Taxes',
    'Insurance',
    'Savings',
    'Other',
  ];

  // Cache for exchange rates
  private exchangeRatesCache: Map<string, { rate: number; timestamp: number }> =
    new Map();
  private cacheDuration = 3600000; // 1 hour in ms

  constructor(
    private config: ConfigService,
    private httpService: HttpService,
  ) {
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
- name
- amount
- currency
- datetime (ISO 8601, default today: ${currentDate})
- category (must be: ${this.allowedCategories.join(', ')})
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

    return await this.normalizeParsedData(parsed);
  }

  async parseTransactionFromImage(imageBuffer: Buffer, imageMimeType: string) {
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const prompt = `
You are a financial assistant. Analyze this receipt image and return JSON:
- name
- amount
- currency
- datetime (ISO 8601, default today: ${currentDate})
- category (must be: ${this.allowedCategories.join(', ')})
`;

    const base64Image = imageBuffer.toString('base64');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: prompt },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Extract transaction details:' },
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

    return await this.normalizeParsedData(parsed);
  }

  private async normalizeParsedData(parsed: any) {
    if (!parsed.datetime) {
      parsed.datetime = new Date().toISOString();
    }

    // Parse amount with Indonesian suffixes
    if (parsed.amount) {
      const amt = String(parsed.amount).toLowerCase().replace(/\s/g, '');
      if (amt.endsWith('rb'))
        parsed.amount = parseFloat(amt.replace('rb', '')) * 1000;
      else if (amt.endsWith('jt'))
        parsed.amount = parseFloat(amt.replace('jt', '')) * 1_000_000;
      else parsed.amount = parseFloat(amt);
    } else {
      parsed.amount = 0;
    }

    // Convert non-IDR
    if (parsed.currency && parsed.currency.toUpperCase() !== 'IDR') {
      const currencyCode = parsed.currency.toUpperCase();

      try {
        const exchangeRate = await this.getExchangeRate(currencyCode, 'IDR');

        parsed.originalAmount = parsed.amount;
        parsed.originalCurrency = currencyCode;

        parsed.amount = Math.round(parsed.amount * exchangeRate * 100) / 100;
        parsed.currency = 'IDR';
        parsed.exchangeRate = exchangeRate;
        parsed.exchangeRateSource = 'exchangerate.host';
      } catch (error) {
        console.error(`❌ Conversion failed for ${currencyCode}:`, error);
        parsed.conversionError =
          'Failed to convert currency, using original amount';
      }
    } else {
      parsed.currency = 'IDR';
    }

    parsed.category ??= 'Other';
    parsed.name ??= 'Unknown';

    if (!this.allowedCategories.includes(parsed.category)) {
      parsed.category = 'Other';
    }

    return parsed;
  }

  private async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
  ): Promise<number> {
    const cacheKey = `${fromCurrency}_${toCurrency}`;
    const now = Date.now();

    const cached = this.exchangeRatesCache.get(cacheKey);
    if (cached && now - cached.timestamp < this.cacheDuration) {
      return cached.rate;
    }

    try {
      const apiKey = this.config.get<string>('EXCHANGE_RATE_API_KEY');
      const response = await firstValueFrom(
        this.httpService.get(
          'https://api.apilayer.com/exchangerates_data/latest',
          {
            headers: { apikey: apiKey },
            params: { base: fromCurrency, symbols: toCurrency },
          },
        ),
      );

      const rate = response.data?.rates?.[toCurrency];
      if (!rate) throw new Error('Rate not found');

      this.exchangeRatesCache.set(cacheKey, { rate, timestamp: now });
      return rate;
    } catch (error) {
      console.error('Exchange rate API error:', error.message);

      // fallback ke static rates
      const fallbackRates: Record<string, number> = {
        USD: 16460,
        EUR: 17600,
        SGD: 12150,
        MYR: 3500,
        GBP: 19400,
        AUD: 10800,
        JPY: 112,
        CNY: 2260,
        KRW: 12,
      };
      const fallbackRate = fallbackRates[fromCurrency];
      if (fallbackRate) {
        console.warn(
          `⚠️ Using fallback rate for ${fromCurrency}: ${fallbackRate}`,
        );
        return fallbackRate;
      }
      throw new Error(
        `No exchange rate available for ${fromCurrency} → ${toCurrency}`,
      );
    }
  }

  async updateExchangeRates(): Promise<void> {
    this.exchangeRatesCache.clear();
  }

  getCachedRates(): Record<string, number> {
    const rates: Record<string, number> = {};
    this.exchangeRatesCache.forEach((value, key) => {
      rates[key] = value.rate;
    });
    return rates;
  }
}
