import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { useUserStore } from '../../store/useUserStore';
import { calculateBMR, calculateTDEE, calculateCalorieTiers } from '../../utils/calorieCalculator';
import { CalorieTierCard } from '../../components/onboarding/CalorieTierCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { theme } from '../../constants/theme';

export function CaloriePlanScreen() {
    const profile = useUserStore((s) => s.profile);
    const setPlan = useUserStore((s) => s.setPlan);
    const [selectedTier, setSelectedTier] = useState<'aggressive' | 'moderate' | 'easy'>('moderate');

    const calculations = useMemo(() => {
        if (!profile) return null;
        const bmr = calculateBMR(profile);
        const tdee = calculateTDEE(profile);
        const weightToLose = Math.max(0, profile.weight_kg - profile.goal_weight_kg);
        const tiers = calculateCalorieTiers(tdee, weightToLose);
        return { bmr, tdee, tiers };
    }, [profile]);

    const handleStart = () => {
        if (!calculations || !profile) return;
        const tier = calculations.tiers.find((t) => t.tier === selectedTier);
        if (!tier) return;
        setPlan({
            tier: selectedTier,
            daily_calories: tier.dailyCalories,
            tdee: calculations.tdee,
            bmr: Math.round(calculations.bmr),
        });
    };

    if (!profile || !calculations) return null;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
            <StatusBar barStyle="dark-content" />
            {/* Progress */}
            <View style={styles.progressRow}>
                <View style={[styles.progressDot, styles.progressDone]} />
                <View style={[styles.progressDot, styles.progressDone]} />
                <View style={[styles.progressDot, styles.progressActive]} />
            </View>
            <Text style={styles.step}>Step 3 of 3</Text>

            <Text style={styles.heading}>Your Plan</Text>
            <Text style={styles.subtitle}>
                Based on your profile, your daily energy expenditure is approximately{' '}
                <Text style={styles.highlight}>{calculations.tdee} kcal</Text>
            </Text>

            {/* Summary stats */}
            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{Math.round(calculations.bmr)}</Text>
                    <Text style={styles.statLabel}>BMR</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{calculations.tdee}</Text>
                    <Text style={styles.statLabel}>TDEE</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>
                        {Math.max(0, Math.round((profile.weight_kg - profile.goal_weight_kg) * 10) / 10)}
                    </Text>
                    <Text style={styles.statLabel}>kg to lose</Text>
                </View>
            </View>

            {/* Tier cards */}
            <Text style={styles.tierHeading}>Choose your pace</Text>
            <View style={styles.tierRow}>
                {calculations.tiers.map((tier) => (
                    <CalorieTierCard
                        key={tier.tier}
                        tier={tier}
                        isSelected={selectedTier === tier.tier}
                        isRecommended={tier.tier === 'moderate'}
                        onSelect={() => setSelectedTier(tier.tier)}
                    />
                ))}
            </View>

            <View style={{ marginTop: 32 }}>
                <PrimaryButton title="Start My Journey" onPress={handleStart} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scroll: {
        padding: 24,
        paddingTop: 60,
        paddingBottom: 48,
    },
    progressRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    progressDot: {
        height: 4,
        flex: 1,
        borderRadius: 2,
        backgroundColor: theme.colors.surfaceContainerHigh,
    },
    progressActive: {
        backgroundColor: theme.colors.primary,
    },
    progressDone: {
        backgroundColor: theme.colors.primaryLight,
    },
    step: {
        fontSize: 12,
        color: theme.colors.textMuted,
        fontWeight: '600',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 24,
    },
    heading: {
        fontSize: 28,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: theme.colors.textSecondary,
        lineHeight: 22,
        marginBottom: 24,
    },
    highlight: {
        color: theme.colors.primary,
        fontWeight: '700',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    statBox: {
        flex: 1,
        backgroundColor: theme.colors.surfaceContainerLowest,
        borderRadius: theme.borderRadius.sm,
        padding: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.surfaceContainerHigh,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.textPrimary,
    },
    statLabel: {
        fontSize: 11,
        color: theme.colors.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginTop: 4,
    },
    tierHeading: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.colors.textPrimary,
        marginBottom: 16,
    },
    tierRow: {
        gap: 12,
    },
});
