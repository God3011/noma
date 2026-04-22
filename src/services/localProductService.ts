import { ScannedProduct } from '../types/foodRating';

// Bundled local DB — loaded once at import time
const localDB: Record<string, any> = require('../data/localProducts.json');

export function lookupLocal(barcode: string): ScannedProduct | null {
    const p = localDB[barcode];
    if (!p) return null;

    return {
        barcode,
        name: p.name || 'Unknown Product',
        brand: p.brand || '',
        source: 'database',
        rating: 'C',
        rating_reasons: [],
        nutrition: {
            calories_per_100g: p.calories ?? 0,
            protein_g:         p.protein ?? 0,
            fat_g:             p.total_fat ?? 0,
            carbs_g:           p.total_carbs ?? 0,
            sugar_g:           p.total_sugars ?? 0,
            sodium_mg:         p.sodium ?? 0,
            fiber_g:           p.dietary_fiber ?? 0,
        },
        data_source: 'Local DB',   // shown in UI
    };
}
