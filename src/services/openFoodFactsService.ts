import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { ScannedProduct } from '../types/foodRating';
import { analyzeWithGemini } from './geminiService';

const INDIA_BASE = 'https://in.openfoodfacts.org/api/v0/product';
const WORLD_BASE = 'https://world.openfoodfacts.org/api/v0/product';

// Check YOUR catalog first
const lookupOwnCatalog = async (barcode: string): Promise<ScannedProduct | null> => {
  const key = String(barcode);
  console.log('[NOMA catalog] looking up barcode:', key);
  try {
    const snap = await getDoc(doc(db, 'product_catalog', key));
    if (snap.exists()) {
      console.log('[NOMA catalog] HIT — returning verified product');
      const data = snap.data();
      return {
        barcode:    key,
        name:       data.name,
        brand:      data.brand,
        source:     'noma_verified' as const,
        rating:     'C',
        rating_reasons: [],
        nutrition: {
          calories_per_100g: data.calories,
          protein_g:         data.protein_g,
          fat_g:             data.fat_g,
          carbs_g:           data.carbs_g,
          sugar_g:           data.sugar_g,
          sodium_mg:         data.sodium_mg,
          fiber_g:           data.fiber_g,
        },
      };
    }
    console.log('[NOMA catalog] MISS — no document for', key);
    return null;
  } catch (e: any) {
    console.error('[NOMA catalog] ERROR', e?.code, e?.message, e);
    return null;
  }
};

export const lookupBarcode = async (barcode: string): Promise<ScannedProduct> => {
  // 1️⃣ Your verified Indian product catalog
  const ours = await lookupOwnCatalog(barcode);
  if (ours) return ours;

  // 2️⃣ Open Food Facts India — TEMPORARILY DISABLED to test Firestore connection
  // let data = await fetchProduct(`${INDIA_BASE}/${barcode}.json`);
  // if (!data) data = await fetchProduct(`${WORLD_BASE}/${barcode}.json`);
  // if (data) return parseOpenFoodFacts(barcode, data);

  // 3️⃣ Gemini AI fallback
  return await analyzeWithGemini(barcode);
};

async function fetchProduct(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'NOMA-App/1.0' },
    });
    const json = await res.json();
    if (json.status === 1 && json.product) return json.product;
    return null;
  } catch {
    return null;
  }
}

function parseOpenFoodFacts(barcode: string, p: any): ScannedProduct {
  const n = p.nutriments ?? {};
  const kcalPer100 = n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0);
  return {
    barcode,
    name: p.product_name || p.product_name_en || p.product_name_hi || 'Unknown Product',
    brand: p.brands || '',
    source: 'database',
    rating: 'C',
    rating_reasons: [],
    nutrition: {
      calories_per_100g: Math.round(kcalPer100),
      protein_g:         n['proteins_100g']      ?? 0,
      fat_g:             n['fat_100g']            ?? 0,
      carbs_g:           n['carbohydrates_100g']  ?? 0,
      sugar_g:           n['sugars_100g']          ?? 0,
      sodium_mg:         (n['sodium_100g'] ?? 0) * 1000,
      fiber_g:           n['fiber_100g']           ?? 0,
    },
  };
}
