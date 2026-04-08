import { NutritionData } from '../types/foodRating';

export type NutritionRating = 'A' | 'B' | 'C' | 'D' | 'E';

export interface RatingResult {
  rating: NutritionRating;
  reasons: string[];
}

export function calculateRating(n: NutritionData): RatingResult {
  let score = 0;
  const reasons: string[] = [];

  // Calories (per 100g)
  if (n.calories_per_100g > 500)      { score += 4; reasons.push('Very high in calories'); }
  else if (n.calories_per_100g > 350) { score += 2; reasons.push('High in calories'); }
  else if (n.calories_per_100g < 150) { score -= 1; reasons.push('Low in calories'); }

  // Sugar
  if (n.sugar_g > 25)      { score += 4; reasons.push('Very high sugar content'); }
  else if (n.sugar_g > 12) { score += 2; reasons.push('High sugar content'); }
  else if (n.sugar_g < 3)  { score -= 1; reasons.push('Low in sugar'); }

  // Sodium (mg)
  if (n.sodium_mg > 1000)      { score += 4; reasons.push('Very high sodium'); }
  else if (n.sodium_mg > 500)  { score += 2; reasons.push('High sodium content'); }
  else if (n.sodium_mg < 120)  { score -= 1; reasons.push('Low sodium'); }

  // Fat
  if (n.fat_g > 25)      { score += 3; reasons.push('Very high in fat'); }
  else if (n.fat_g > 15) { score += 1; reasons.push('High in fat'); }

  // Protein (good)
  if (n.protein_g > 10)     { score -= 2; reasons.push('Good source of protein'); }
  else if (n.protein_g > 5) { score -= 1; reasons.push('Contains some protein'); }

  // Fiber (good)
  if (n.fiber_g > 6)     { score -= 2; reasons.push('High in fiber'); }
  else if (n.fiber_g > 3) { score -= 1; reasons.push('Good source of fiber'); }

  let rating: NutritionRating;
  if      (score <= -1) rating = 'A';
  else if (score <=  2) rating = 'B';
  else if (score <=  5) rating = 'C';
  else if (score <=  9) rating = 'D';
  else                  rating = 'E';

  if (reasons.length === 0) reasons.push('Average nutritional profile');

  return { rating, reasons };
}
