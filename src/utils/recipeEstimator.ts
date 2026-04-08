import { GEMINI_API_KEY, GEMINI_MODEL } from '../constants/apiConfig';

interface RecipeEstimate {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    per_serving_note: string;
}

const RECIPE_PROMPT = `You are a nutrition expert. Given a list of ingredients and a cooking method, estimate the total nutritional content PER SERVING.

Rules:
- Consider how cooking methods affect nutrition (frying adds fat, boiling doesn't)
- Estimate for ONE standard serving
- Account for oil, butter, ghee used in cooking
- Be accurate for Indian cooking styles and ingredients
- Return ONLY valid JSON, no markdown

Return this exact JSON format:
{"calories":number,"protein_g":number,"carbs_g":number,"fat_g":number,"per_serving_note":"brief note about serving size"}`;

export async function estimateRecipe(
    ingredients: string,
    cookingMethod: string
): Promise<RecipeEstimate | null> {
    if (!GEMINI_API_KEY || (GEMINI_API_KEY as string) === 'YOUR_API_KEY_HERE') {
        return null;
    }

    try {
        const userMessage = `Ingredients:\n${ingredients}\n\nCooking Method:\n${cookingMethod}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: userMessage }],
                        },
                    ],
                    systemInstruction: {
                        parts: [{ text: RECIPE_PROMPT }],
                    },
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 300,
                        responseMimeType: 'application/json',
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.warn('Gemini recipe API error:', response.status, errorText);
            return null;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;

        const parsed = JSON.parse(text);

        if (typeof parsed.calories === 'number') {
            return {
                calories: Math.round(parsed.calories),
                protein_g: Math.round(parsed.protein_g || 0),
                carbs_g: Math.round(parsed.carbs_g || 0),
                fat_g: Math.round(parsed.fat_g || 0),
                per_serving_note: parsed.per_serving_note || 'Per serving',
            };
        }
        return null;
    } catch (err) {
        console.warn('Recipe estimation error:', err);
        return null;
    }
}
