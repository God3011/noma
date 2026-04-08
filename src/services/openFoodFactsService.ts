import { ScannedProduct } from '../types/foodRating';

const INDIA_BASE = 'https://in.openfoodfacts.org/api/v0/product';
const WORLD_BASE = 'https://world.openfoodfacts.org/api/v0/product';

export async function lookupBarcode(barcode: string): Promise<ScannedProduct | null> {
  let data = await fetchProduct(`${INDIA_BASE}/${barcode}.json`);
  if (!data) {
    data = await fetchProduct(`${WORLD_BASE}/${barcode}.json`);
  }
  if (!data) return null;
  return parseProduct(barcode, data);
}

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

function parseProduct(barcode: string, p: any): ScannedProduct {
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
