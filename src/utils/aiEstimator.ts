import { GEMINI_API_KEY, GEMINI_MODEL } from '../constants/apiConfig';

interface AIFoodEstimate {
    items: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
}

const SYSTEM_PROMPT = `You are a nutrition estimation expert. Given a food description, estimate the total nutritional content.

Rules:
- Estimate for a typical single-person serving unless quantity is specified
- Account for ALL items mentioned (e.g. "roti with dal" = roti calories + dal calories)
- Use Indian serving sizes when Indian food is mentioned
- Be reasonably accurate — no need to be exact
- Return ONLY valid JSON, no markdown, no explanation

Return this exact JSON format:
{"items":"Short summary of items","calories":number,"protein_g":number,"carbs_g":number,"fat_g":number}`;

export async function estimateWithAI(description: string): Promise<AIFoodEstimate | null> {
    if (!GEMINI_API_KEY || (GEMINI_API_KEY as string) === 'YOUR_API_KEY_HERE') {
        return null;
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: `Estimate nutrition for: "${description}"` }],
                        },
                    ],
                    systemInstruction: {
                        parts: [{ text: SYSTEM_PROMPT }],
                    },
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 200,
                        responseMimeType: 'application/json',
                    },
                }),
            }
        );

        if (!response.ok) {
            console.warn('Gemini API error:', response.status);
            return null;
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;

        const parsed = JSON.parse(text);

        // Validate the response has required fields
        if (
            typeof parsed.calories === 'number' &&
            typeof parsed.protein_g === 'number' &&
            typeof parsed.carbs_g === 'number' &&
            typeof parsed.fat_g === 'number'
        ) {
            return {
                items: parsed.items || description,
                calories: Math.round(parsed.calories),
                protein_g: Math.round(parsed.protein_g),
                carbs_g: Math.round(parsed.carbs_g),
                fat_g: Math.round(parsed.fat_g),
            };
        }

        return null;
    } catch (err) {
        console.warn('Food estimation AI error:', err);
        return null;
    }
}
