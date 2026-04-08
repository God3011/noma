export interface SavedMeal {
    id: string;
    name: string;
    ingredients?: string;
    cooking_method?: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    created_at: string;
}
