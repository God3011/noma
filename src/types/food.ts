export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
    id: string;
    date: string;         // 'YYYY-MM-DD'
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    meal_type: MealType;
    logged_at: string;    // ISO timestamp
}
