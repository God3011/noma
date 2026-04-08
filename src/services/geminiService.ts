import { ScannedProduct } from '../types/foodRating';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../constants/apiConfig';

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_INSTRUCTION = `You are a nutrition expert for an Indian food tracking app.
The user will give you a product barcode number. Search your knowledge for any product associated with that barcode and return its nutritional information.
If you cannot identify the specific product, make your best guess based on typical Indian packaged foods.
Return ONLY valid JSON, no markdown, no explanation.
Return this exact JSON format:
{"name":"product name","brand":"brand name or empty string","confidence":"low|medium|high","notes":"brief description of what this product likely is","nutrition":{"calories_per_100g":0,"protein_g":0,"fat_g":0,"carbs_g":0,"sugar_g":0,"sodium_mg":0,"fiber_g":0}}`;

function makeFallback(barcode: string, notes: string): ScannedProduct {
  return {
    barcode,
    name: 'Unknown Product',
    brand: '',
    source: 'ai',
    rating: 'C',
    rating_reasons: [],
    gemini_notes: notes,
    gemini_confidence: 'low',
    nutrition: {
      calories_per_100g: 450,
      protein_g: 6,
      fat_g: 22,
      carbs_g: 58,
      sugar_g: 4,
      sodium_mg: 600,
      fiber_g: 2,
    },
  };
}

export async function analyzeWithGemini(barcode: string): Promise<ScannedProduct> {
  const MAX_RETRIES = 2;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `Product barcode: ${barcode}` }],
            },
          ],
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 512,
            responseMimeType: 'application/json',
          },
        }),
      });

      // Check HTTP status first (mirrors aiEstimator.ts)
      if (!response.ok) {
        const isRetryable = response.status === 503 || response.status === 429;
        if (isRetryable && attempt < MAX_RETRIES) {
          const delay = (attempt + 1) * 2000;
          console.warn(`[Gemini] HTTP ${response.status}, retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        if (isRetryable) {
          // All retries exhausted on overload — return estimated fallback
          console.warn('[Gemini] All retries exhausted (overloaded), using estimated values');
          return makeFallback(barcode, 'AI service busy — showing typical values');
        }
        const errBody = await response.text().catch(() => '');
        throw new Error(`Gemini HTTP ${response.status}: ${errBody.slice(0, 200)}`);
      }

      const data = await response.json();

      if (data.error) {
        const msg: string = data.error.message ?? '';
        const isRetryable =
          data.error.code === 503 ||
          msg.toLowerCase().includes('high demand') ||
          msg.toLowerCase().includes('overloaded') ||
          msg.toLowerCase().includes('unavailable');

        if (isRetryable && attempt < MAX_RETRIES) {
          const delay = (attempt + 1) * 2000;
          console.warn(`[Gemini] ${msg}, retrying in ${delay}ms...`);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        if (isRetryable) {
          console.warn('[Gemini] All retries exhausted (overloaded), using estimated values');
          return makeFallback(barcode, 'AI service busy — showing typical values');
        }
        throw new Error(`Gemini API error: ${msg}`);
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      if (!text) throw new Error('Gemini returned empty text');

      let parsed: any;
      try {
        parsed = JSON.parse(text.trim());
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) throw new Error(`Unparseable response: ${text.slice(0, 100)}`);
        parsed = JSON.parse(match[0]);
      }

      return {
        barcode,
        name: parsed.name || 'Unknown Product',
        brand: parsed.brand || '',
        source: 'ai',
        rating: 'C',
        rating_reasons: [],
        gemini_notes: parsed.notes || '',
        gemini_confidence: parsed.confidence || 'low',
        nutrition: {
          calories_per_100g: parsed.nutrition?.calories_per_100g ?? 450,
          protein_g:         parsed.nutrition?.protein_g         ?? 6,
          fat_g:             parsed.nutrition?.fat_g             ?? 22,
          carbs_g:           parsed.nutrition?.carbs_g           ?? 58,
          sugar_g:           parsed.nutrition?.sugar_g           ?? 4,
          sodium_mg:         parsed.nutrition?.sodium_mg         ?? 600,
          fiber_g:           parsed.nutrition?.fiber_g           ?? 2,
        },
      };
    } catch (err: any) {
      if (attempt < MAX_RETRIES) {
        console.warn(`[Gemini] attempt ${attempt + 1} failed: ${err.message}`);
        await new Promise((r) => setTimeout(r, (attempt + 1) * 2000));
        continue;
      }
      // All retries done — rethrow so ScannerScreen can show the real error
      throw err;
    }
  }

  throw new Error('Gemini: all retries exhausted');
}
