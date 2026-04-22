import React, { useState, useEffect, useCallback } from 'react';
import {
    ScrollView, View, Text, TouchableOpacity,
    StyleSheet, RefreshControl, InteractionManager,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { useFoodLogStore } from '../../store/useFoodLogStore';
import { useWorkoutStore } from '../../store/useWorkoutStore';
import { useUserStore } from '../../store/useUserStore';
import { aggregateInsights, InsightsData } from '../../utils/insightsCalculator';
import SectionHeader from '../../components/insights/SectionHeader';
import StatHighlightCard from '../../components/insights/StatHighlightCard';
import CalorieTrendChart from '../../components/insights/CalorieTrendChart';
import MacroDonutChart from '../../components/insights/MacroDonutChart';
import WorkoutFrequencyChart from '../../components/insights/WorkoutFrequencyChart';
import DailyScoreLineChart from '../../components/insights/DailyScoreLineChart';
import StreakCard from '../../components/insights/StreakCard';
import BestWorstDayCard from '../../components/insights/BestWorstDayCard';
import WeightProgressCard from '../../components/insights/WeightProgressCard';
import AIWeeklySummary from '../../components/insights/AIWeeklySummary';

type Range = 7 | 30;

export default function InsightsScreen() {
    const [range, setRange] = useState<Range>(7);
    const [insights, setInsights] = useState<InsightsData | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const profile = useUserStore((s) => s.profile);
    const plan = useUserStore((s) => s.plan);
    const meals = useFoodLogStore((s) => s.meals);
    const workouts = useWorkoutStore((s) => s.workouts);

    const compute = useCallback(() => {
        if (!profile) return;
        InteractionManager.runAfterInteractions(() => {
            const data = aggregateInsights({ meals, workouts, profile, plan, days: range });
            setInsights(data);
        });
    }, [meals, workouts, profile, plan, range]);

    useFocusEffect(useCallback(() => { compute(); }, [compute]));
    useEffect(() => { compute(); }, [range]);

    const onRefresh = async () => {
        setRefreshing(true);
        compute();
        setRefreshing(false);
    };

    const weekLabel = () => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - (range - 1));
        const fmt = (d: Date) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        return `${fmt(start)} – ${fmt(end)}`;
    };

    const target = plan?.daily_calories ?? 2000;

    if (!profile) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>Complete your profile to see insights.</Text>
            </View>
        );
    }

    if (!insights) {
        return (
            <View style={styles.container}>
                <Text style={styles.emptyText}>Log some meals and workouts to see insights.</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
            }
        >
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Insights</Text>
                <Text style={styles.dateRange}>{weekLabel()}</Text>
            </View>

            {/* Range selector */}
            <View style={styles.rangeRow}>
                {([7, 30] as Range[]).map(r => (
                    <TouchableOpacity
                        key={r}
                        style={[styles.rangePill, range === r && styles.rangePillActive]}
                        onPress={() => setRange(r)}
                    >
                        <Text style={[styles.rangePillText, range === r && styles.rangePillTextActive]}>
                            {r} days
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Streak + Overall Score — top of page */}
            <StreakCard current={insights.currentStreak} best={insights.bestStreak} />
            <View style={styles.statRow}>
                <StatHighlightCard
                    label="Overall Score"
                    value={`${Math.round(insights.avgDailyScore)}`}
                    unit="/ 100"
                    trend={insights.scoreTrend}
                />
                <StatHighlightCard
                    label="Workouts"
                    value={`${insights.workoutCount}`}
                    unit="sessions"
                    trend={insights.workoutTrend}
                />
            </View>

            {/* This Week */}
            <SectionHeader title="This period" />
            <View style={styles.statRow}>
                <StatHighlightCard
                    label="Avg calories"
                    value={`${Math.round(insights.avgDailyCalories)}`}
                    unit="kcal"
                    trend={insights.calorieTrend}
                />
                <StatHighlightCard
                    label="Avg score"
                    value={`${Math.round(insights.avgDailyScore)}`}
                    unit="/ 100"
                    trend={insights.scoreTrend}
                />
            </View>

            {/* Nutrition */}
            <SectionHeader title="Nutrition" subtitle="Calories vs your daily target" />
            <CalorieTrendChart data={insights.calorieTrendData} target={target} />
            <SectionHeader subtitle="Macro split this period" />
            <MacroDonutChart data={insights.macroTotals} />
            <BestWorstDayCard best={insights.bestDay} worst={insights.worstDay} target={target} />

            {/* Workouts */}
            <SectionHeader title="Workouts" subtitle="Training days in this period" />
            <WorkoutFrequencyChart data={insights.workoutFrequencyData} />

            {/* Daily Score */}
            <SectionHeader title="Daily score" subtitle="Your 0–100 rating over time" />
            <DailyScoreLineChart data={insights.dailyScoreData} />
            <View style={styles.statRow}>
                <StatHighlightCard
                    label="Average score"
                    value={`${Math.round(insights.avgDailyScore)}`}
                    unit="/ 100"
                    trend={insights.scoreTrend}
                />
            </View>

            {/* Goal Progress */}
            <SectionHeader title="Goal progress" />
            <WeightProgressCard profile={profile} plan={plan} avgDailyCalories={insights.avgDailyCalories} />

            {/* AI Summary */}
            <SectionHeader title="AI summary" subtitle="Powered by Gemini" />
            <AIWeeklySummary insights={insights} profile={profile} plan={plan} range={range} />

            <View style={{ height: 120 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { paddingBottom: 24 },
    header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 8 },
    title: { fontSize: 28, fontWeight: '700', color: theme.colors.textPrimary },
    dateRange: { fontSize: 14, color: theme.colors.textSecondary, marginTop: 2 },
    rangeRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
    rangePill: {
        paddingHorizontal: 16, paddingVertical: 7,
        borderRadius: theme.borderRadius.pill,
        borderWidth: 1, borderColor: theme.colors.outlineVariant,
    },
    rangePillActive: {
        backgroundColor: theme.colors.primary,
        borderColor: theme.colors.primary,
    },
    rangePillText: { fontSize: 13, color: theme.colors.textSecondary, fontWeight: '500' },
    rangePillTextActive: { color: theme.colors.onPrimary },
    statRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
    emptyText: {
        color: theme.colors.textSecondary, textAlign: 'center',
        marginTop: 120, fontSize: 15, paddingHorizontal: 40,
    },
});
