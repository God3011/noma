// Simple food estimation based on common food keywords
// Returns approximate calories and macros per typical serving

interface FoodEstimate {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    confidence: 'high' | 'medium' | 'low';
    matchedItem: string;
}

interface FoodEntry {
    keywords: string[];
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
}

const FOOD_DATABASE: FoodEntry[] = [
    // Proteins
    { keywords: ['chicken breast', 'grilled chicken'], name: 'Chicken Breast (150g)', calories: 230, protein_g: 43, carbs_g: 0, fat_g: 5 },
    { keywords: ['chicken thigh'], name: 'Chicken Thigh (150g)', calories: 320, protein_g: 37, carbs_g: 0, fat_g: 18 },
    { keywords: ['chicken'], name: 'Chicken (150g)', calories: 270, protein_g: 40, carbs_g: 0, fat_g: 12 },
    { keywords: ['salmon', 'fish fillet'], name: 'Salmon Fillet (150g)', calories: 310, protein_g: 34, carbs_g: 0, fat_g: 18 },
    { keywords: ['tuna'], name: 'Tuna (150g)', calories: 180, protein_g: 40, carbs_g: 0, fat_g: 1 },
    { keywords: ['egg', 'boiled egg', 'fried egg'], name: 'Eggs (2 large)', calories: 180, protein_g: 12, carbs_g: 1, fat_g: 13 },
    { keywords: ['paneer'], name: 'Paneer (100g)', calories: 265, protein_g: 18, carbs_g: 3, fat_g: 20 },
    { keywords: ['tofu'], name: 'Tofu (150g)', calories: 130, protein_g: 14, carbs_g: 3, fat_g: 7 },
    { keywords: ['steak', 'beef'], name: 'Beef Steak (200g)', calories: 450, protein_g: 50, carbs_g: 0, fat_g: 26 },
    { keywords: ['mutton', 'lamb'], name: 'Mutton/Lamb (150g)', calories: 370, protein_g: 36, carbs_g: 0, fat_g: 24 },

    // Indian dishes
    { keywords: ['dal', 'daal', 'lentil'], name: 'Dal (1 bowl)', calories: 180, protein_g: 12, carbs_g: 24, fat_g: 4 },
    { keywords: ['roti', 'chapati', 'chapathi'], name: 'Roti/Chapati (2)', calories: 200, protein_g: 6, carbs_g: 36, fat_g: 4 },
    { keywords: ['naan'], name: 'Naan (1)', calories: 260, protein_g: 7, carbs_g: 40, fat_g: 8 },
    { keywords: ['rice', 'steamed rice', 'white rice'], name: 'Rice (1 cup cooked)', calories: 210, protein_g: 4, carbs_g: 45, fat_g: 1 },
    { keywords: ['biryani'], name: 'Biryani (1 plate)', calories: 480, protein_g: 22, carbs_g: 55, fat_g: 18 },
    { keywords: ['dosa'], name: 'Dosa (1)', calories: 170, protein_g: 4, carbs_g: 28, fat_g: 5 },
    { keywords: ['idli'], name: 'Idli (3)', calories: 180, protein_g: 5, carbs_g: 36, fat_g: 1 },
    { keywords: ['sambar'], name: 'Sambar (1 bowl)', calories: 130, protein_g: 6, carbs_g: 18, fat_g: 4 },
    { keywords: ['curd', 'yogurt', 'dahi'], name: 'Curd/Yogurt (1 cup)', calories: 100, protein_g: 8, carbs_g: 8, fat_g: 4 },
    { keywords: ['upma'], name: 'Upma (1 bowl)', calories: 250, protein_g: 6, carbs_g: 35, fat_g: 10 },
    { keywords: ['poha'], name: 'Poha (1 bowl)', calories: 270, protein_g: 5, carbs_g: 40, fat_g: 10 },
    { keywords: ['rajma'], name: 'Rajma (1 bowl)', calories: 200, protein_g: 13, carbs_g: 30, fat_g: 3 },
    { keywords: ['chole', 'chana', 'chickpea'], name: 'Chole/Chana (1 bowl)', calories: 220, protein_g: 12, carbs_g: 30, fat_g: 6 },
    { keywords: ['palak paneer'], name: 'Palak Paneer (1 bowl)', calories: 300, protein_g: 15, carbs_g: 10, fat_g: 22 },
    { keywords: ['butter chicken'], name: 'Butter Chicken (1 bowl)', calories: 420, protein_g: 30, carbs_g: 12, fat_g: 28 },

    // Grains & carbs
    { keywords: ['oats', 'oatmeal', 'porridge'], name: 'Oats (1 cup)', calories: 250, protein_g: 10, carbs_g: 40, fat_g: 5 },
    { keywords: ['brown rice'], name: 'Brown Rice (1 cup)', calories: 215, protein_g: 5, carbs_g: 44, fat_g: 2 },
    { keywords: ['pasta', 'spaghetti', 'penne'], name: 'Pasta (1 cup)', calories: 350, protein_g: 12, carbs_g: 55, fat_g: 8 },
    { keywords: ['bread', 'toast', 'slice'], name: 'Bread (2 slices)', calories: 170, protein_g: 6, carbs_g: 30, fat_g: 3 },
    { keywords: ['sandwich'], name: 'Sandwich (1)', calories: 350, protein_g: 15, carbs_g: 40, fat_g: 14 },

    // Fruits & vegetables
    { keywords: ['banana'], name: 'Banana (1 medium)', calories: 105, protein_g: 1, carbs_g: 27, fat_g: 0 },
    { keywords: ['apple'], name: 'Apple (1 medium)', calories: 95, protein_g: 0, carbs_g: 25, fat_g: 0 },
    { keywords: ['salad', 'green salad', 'mixed salad'], name: 'Mixed Salad (1 bowl)', calories: 90, protein_g: 3, carbs_g: 12, fat_g: 4 },
    { keywords: ['fruit bowl', 'fruits'], name: 'Fruit Bowl', calories: 150, protein_g: 2, carbs_g: 38, fat_g: 0 },

    // Drinks
    { keywords: ['protein shake', 'whey', 'protein powder'], name: 'Protein Shake', calories: 200, protein_g: 30, carbs_g: 8, fat_g: 4 },
    { keywords: ['milk', 'glass of milk'], name: 'Milk (1 glass)', calories: 150, protein_g: 8, carbs_g: 12, fat_g: 8 },
    { keywords: ['tea', 'chai'], name: 'Tea with Milk', calories: 60, protein_g: 2, carbs_g: 8, fat_g: 2 },
    { keywords: ['coffee', 'black coffee'], name: 'Coffee', calories: 5, protein_g: 0, carbs_g: 1, fat_g: 0 },
    { keywords: ['latte', 'cappuccino'], name: 'Latte/Cappuccino', calories: 180, protein_g: 8, carbs_g: 18, fat_g: 8 },
    { keywords: ['juice', 'orange juice'], name: 'Juice (1 glass)', calories: 110, protein_g: 1, carbs_g: 26, fat_g: 0 },
    { keywords: ['smoothie'], name: 'Smoothie', calories: 250, protein_g: 8, carbs_g: 40, fat_g: 6 },
    { keywords: ['lassi'], name: 'Lassi (1 glass)', calories: 200, protein_g: 6, carbs_g: 30, fat_g: 6 },

    // Snacks
    { keywords: ['almonds', 'almond'], name: 'Almonds (30g)', calories: 170, protein_g: 6, carbs_g: 6, fat_g: 15 },
    { keywords: ['peanuts', 'groundnuts'], name: 'Peanuts (30g)', calories: 170, protein_g: 7, carbs_g: 5, fat_g: 14 },
    { keywords: ['nuts', 'mixed nuts', 'dry fruits'], name: 'Mixed Nuts (30g)', calories: 180, protein_g: 5, carbs_g: 7, fat_g: 16 },
    { keywords: ['cookie', 'biscuit'], name: 'Cookies (3)', calories: 200, protein_g: 2, carbs_g: 28, fat_g: 9 },
    { keywords: ['chips', 'crisps'], name: 'Chips (small bag)', calories: 250, protein_g: 3, carbs_g: 25, fat_g: 16 },
    { keywords: ['chocolate', 'dark chocolate'], name: 'Chocolate (40g)', calories: 210, protein_g: 3, carbs_g: 22, fat_g: 13 },
    { keywords: ['energy bar', 'protein bar', 'granola bar'], name: 'Energy/Protein Bar', calories: 230, protein_g: 12, carbs_g: 28, fat_g: 8 },

    // Fast food
    { keywords: ['pizza'], name: 'Pizza (2 slices)', calories: 560, protein_g: 22, carbs_g: 60, fat_g: 24 },
    { keywords: ['burger', 'hamburger'], name: 'Burger', calories: 500, protein_g: 25, carbs_g: 40, fat_g: 26 },
    { keywords: ['fries', 'french fries'], name: 'French Fries (medium)', calories: 350, protein_g: 4, carbs_g: 44, fat_g: 17 },
    { keywords: ['wrap', 'burrito'], name: 'Wrap/Burrito', calories: 400, protein_g: 18, carbs_g: 45, fat_g: 16 },
    { keywords: ['momos', 'dumpling'], name: 'Momos (6 pcs)', calories: 250, protein_g: 12, carbs_g: 30, fat_g: 8 },
];

export function estimateFromText(text: string): FoodEstimate | null {
    if (!text || text.trim().length < 2) return null;

    const lower = text.toLowerCase().trim();

    // Try exact multi-word matches first (longer keywords = more specific)
    const sorted = [...FOOD_DATABASE].sort((a, b) => {
        const aMax = Math.max(...a.keywords.map((k) => k.length));
        const bMax = Math.max(...b.keywords.map((k) => k.length));
        return bMax - aMax;
    });

    for (const entry of sorted) {
        for (const kw of entry.keywords) {
            if (lower.includes(kw)) {
                // Check for quantity multipliers
                const multiplier = parseQuantityMultiplier(lower);
                return {
                    calories: Math.round(entry.calories * multiplier),
                    protein_g: Math.round(entry.protein_g * multiplier),
                    carbs_g: Math.round(entry.carbs_g * multiplier),
                    fat_g: Math.round(entry.fat_g * multiplier),
                    confidence: multiplier !== 1 ? 'medium' : 'high',
                    matchedItem: entry.name,
                };
            }
        }
    }

    return null;
}

function parseQuantityMultiplier(text: string): number {
    const doublePatterns = /\b(2|two|double|twice)\b/i;
    const triplePatterns = /\b(3|three|triple)\b/i;
    const halfPatterns = /\b(half|0\.5)\b/i;
    const largePatterns = /\b(large|big|extra)\b/i;
    const smallPatterns = /\b(small|little|mini)\b/i;

    if (triplePatterns.test(text)) return 3;
    if (doublePatterns.test(text)) return 2;
    if (halfPatterns.test(text)) return 0.5;
    if (largePatterns.test(text)) return 1.4;
    if (smallPatterns.test(text)) return 0.7;
    return 1;
}
