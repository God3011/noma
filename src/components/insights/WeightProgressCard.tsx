import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { UserProfile, CaloriePlan } from '../../types/user';

interface Props {
    profile: UserProfile | null;
    plan: CaloriePlan | null;
    avgDailyCalories: number;
}

export default function WeightProgressCard({ profile, plan, avgDailyCalories }: Props) {
    if (!profile || !plan) return null;

    const currentWeight = profile.weight_kg ?? 0;
    const goalWeight = profile.goal_weight_kg ?? currentWeight;
    const tolose = Math.max(0, currentWeight - goalWeight);

    const targetCals = plan.daily_calories;
    const actualCals = avgDailyCalories;
    const dailyDeficit = targetCals - actualCals;

    let etaText = '';
    let status: 'on-track' | 'behind' | 'ahead' = 'on-track';

    if (tolose <= 0) {
        etaText = 'Goal reached!';
        status = 'ahead';
    } else if (dailyDeficit <= 0 || actualCals === 0) {
        etaText = actualCals === 0
            ? 'Start logging meals to see your ETA'
            : 'At maintenance — increase deficit to lose weight';
        status = 'behind';
    } else {
        const weeksToGoal = (tolose * 7700) / (dailyDeficit * 7);
        const planWeeks = plan.tdee > 0 ? (tolose * 7700) / ((plan.tdee - targetCals) * 7) : weeksToGoal;
        etaText = `At this pace: ~${Math.ceil(weeksToGoal)} weeks to goal`;
        if (weeksToGoal > planWeeks * 1.15) status = 'behind';
        else if (weeksToGoal < planWeeks * 0.85) status = 'ahead';
    }

    // Progress: assume start weight was current + tolose (we don't store starting weight)
    // Show how close they are to goal vs original gap
    const originalGap = Math.max(0.1, currentWeight - goalWeight + tolose); // always positive
    const progress = originalGap > 0 ? Math.min(1, Math.max(0, (originalGap - tolose) / originalGap)) : 0;

    const statusColors = {
        'on-track': theme.colors.primary,
        'behind': theme.colors.tertiary,
        'ahead': theme.colors.secondary,
    };
    const statusLabels = { 'on-track': 'On track', 'behind': 'Behind', 'ahead': 'Ahead of plan' };
    const color = statusColors[status];

    return (
        <View style={[styles.card, { borderColor: color }]}>
            <View style={styles.row}>
                <View>
                    <Text style={styles.goalText}>Goal: {goalWeight}kg</Text>
                    <Text style={styles.remainText}>{tolose.toFixed(1)} kg remaining</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
                    <Text style={[styles.badgeText, { color }]}>{statusLabels[status]}</Text>
                </View>
            </View>
            <Text style={styles.etaText}>{etaText}</Text>
            <View style={styles.barBg}>
                <View style={[styles.barFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 20,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.md,
        borderWidth: 1,
        padding: 16,
    },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    goalText: { fontSize: 13, color: theme.colors.textSecondary },
    remainText: { fontSize: 22, fontWeight: '700', color: theme.colors.textPrimary, marginTop: 2 },
    etaText: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 8 },
    badge: {
        paddingHorizontal: 10, paddingVertical: 4,
        borderRadius: theme.borderRadius.pill, borderWidth: 1,
    },
    badgeText: { fontSize: 12, fontWeight: '600' },
    barBg: { height: 6, backgroundColor: theme.colors.outlineVariant, borderRadius: 3, marginTop: 12 },
    barFill: { height: 6, borderRadius: 3 },
});
