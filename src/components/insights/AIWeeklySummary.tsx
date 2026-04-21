import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { GEMINI_API_KEY, GEMINI_MODEL } from '../../constants/apiConfig';
import { theme } from '../../constants/theme';
import { UserProfile, CaloriePlan } from '../../types/user';
import { InsightsData } from '../../utils/insightsCalculator';

interface Props {
    insights: InsightsData;
    profile: UserProfile | null;
    plan: CaloriePlan | null;
    range: number;
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
export default function AIWeeklySummary({ insights, profile, plan, range }: Props) {
    const [summary, setSummary] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => { generate(); }, []);

    const generate = async () => {
        if (!GEMINI_API_KEY) { setError(true); return; }

        setLoading(true);
        setError(false);
        setSummary(null);

        const prompt = `You are a friendly fitness coach reviewing someone's ${range}-day nutrition and workout data.

User profile:
- Goal: lose weight from ${profile?.weight_kg ?? '?'}kg to ${profile?.goal_weight_kg ?? '?'}kg
- Daily calorie target: ${plan?.daily_calories ?? 'unknown'} kcal
- Plan tier: ${plan?.tier ?? 'moderate'}

Their last ${range} days:
- Average daily calories: ${Math.round(insights.avgDailyCalories)} kcal
- Total workouts: ${insights.workoutCount} sessions
- Current workout streak: ${insights.currentStreak} days
- Average daily score: ${Math.round(insights.avgDailyScore)} / 100
- Macro split: Protein ${Math.round(insights.macroTotals.protein_g)}g, Carbs ${Math.round(insights.macroTotals.carbs_g)}g, Fat ${Math.round(insights.macroTotals.fat_g)}g

Write a 3-4 sentence plain-English summary of how they did. Be specific, encouraging but honest. Point out 1 thing they did well and 1 thing to improve. Keep it conversational and concise. Do NOT use bullet points or headers — just natural paragraph text.`;

        try {
            const res = await fetch(GEMINI_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: 256 },
                }),
            });
            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
            if (text) setSummary(text.trim());
            else setError(true);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.card}>
            <View style={styles.topRow}>
                <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>AI</Text>
                </View>
                <TouchableOpacity onPress={generate} disabled={loading}>
                    <Text style={styles.refreshBtn}>{loading ? 'Generating...' : 'Refresh'}</Text>
                </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 12 }} />}

            {error && !loading && (
                <Text style={styles.errorText}>Could not generate summary. Check your Gemini API key.</Text>
            )}

            {summary && !loading && (
                <Text style={styles.summaryText}>{summary}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 20,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        borderColor: '#534AB7',
        padding: 16,
        minHeight: 80,
    },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    aiBadge: {
        backgroundColor: '#26215C',
        paddingHorizontal: 10, paddingVertical: 3,
        borderRadius: theme.borderRadius.pill,
    },
    aiBadgeText: { color: '#AFA9EC', fontSize: 12, fontWeight: '700' },
    refreshBtn: { color: theme.colors.textSecondary, fontSize: 13 },
    summaryText: { color: theme.colors.textPrimary, fontSize: 14, lineHeight: 22 },
    errorText: { color: theme.colors.danger, fontSize: 13, marginTop: 8 },
});
