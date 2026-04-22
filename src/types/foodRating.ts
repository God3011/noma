export interface NutritionData {
  calories_per_100g: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  sugar_g: number;
  sodium_mg: number;
  fiber_g: number;
}

export interface ScannedProduct {
  barcode: string;
  name: string;
  brand: string;
  source: 'database' | 'ai' | 'noma_verified';
  rating: string;
  rating_reasons: string[];
  nutrition: NutritionData;
  gemini_notes?: string;
  gemini_confidence?: 'low' | 'medium' | 'high';
  data_source?: string;
}

export interface ScanHistoryItem {
  product: ScannedProduct;
  scanned_at: string;
}
