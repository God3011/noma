import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface DayInfo {
    date: string;
    label: string;
    calories: number;
}

interface Props {
    best: DayInfo | null;
    worst: DayInfo | null;
    target: number;
}

export default function BestWorstDayCard({ best, worst, target }: Props) {
    if (!best && !worst) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Not enough data yet</Text>
            </View>
        );
    }

    const bestDiff = best ? Math.abs(best.calories - target) : 0;
    const worstDiff = worst ? worst.calories - target : 0;

    return (
        <View style={styles.row}>
            <View style={[styles.card, styles.cardBest]}>
                <Text style={styles.cardTag}>BEST DAY</Text>
                <Text style={styles.dateLabel}>{best?.label ?? '—'}</Text>
                <Text style={styles.calories}>{best ? Math.round(best.calories) : '—'} kcal</Text>
                <Text style={styles.diffGood}>{bestDiff > 0 ? `${Math.round(bestDiff)} kcal from target` : 'On target'}</Text>
            </View>
            <View style={[styles.card, styles.cardWorst]}>
                <Text style={styles.cardTag}>WORST DAY</Text>
                <Text style={styles.dateLabel}>{worst?.label ?? '—'}</Text>
                <Text style={styles.calories}>{worst ? Math.round(worst.calories) : '—'} kcal</Text>
                <Text style={styles.diffBad}>
                    {worst
                        ? worstDiff > 0
                            ? `${Math.round(worstDiff)} kcal over`
                            : `${Math.round(Math.abs(worstDiff))} kcal under`
                        : '—'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    row: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginTop: 12 },
    card: {
        flex: 1,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.md,
        padding: 14,
        borderLeftWidth: 3,
    },
    cardBest: { borderLeftColor: theme.colors.primary },
    cardWorst: { borderLeftColor: theme.colors.danger },
    cardTag: {
        fontSize: 9, fontWeight: '700', letterSpacing: 1.2,
        color: theme.colors.textMuted, textTransform: 'uppercase', marginBottom: 6,
    },
    dateLabel: { fontSize: 13, fontWeight: '600', color: theme.colors.textPrimary, marginBottom: 4 },
    calories: { fontSize: 18, fontWeight: '700', color: theme.colors.textPrimary },
    diffGood: { fontSize: 11, color: theme.colors.primary, marginTop: 4 },
    diffBad: { fontSize: 11, color: theme.colors.danger, marginTop: 4 },
    emptyContainer: {
        marginHorizontal: 20,
        marginTop: 12,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.md,
        padding: 24,
        alignItems: 'center',
    },
    emptyText: { fontSize: 13, color: theme.colors.textMuted, textAlign: 'center' },
});
