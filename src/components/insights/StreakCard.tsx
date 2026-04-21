import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface Props {
    current: number;
    best: number;
}

export default function StreakCard({ current, best }: Props) {
    const isBest = current > 0 && current >= best;
    const highlightColor = isBest ? theme.colors.primary : theme.colors.textPrimary;

    return (
        <View style={styles.card}>
            <View style={styles.col}>
                {current > 0 && (
                    <View style={styles.dot} />
                )}
                <Text style={[styles.number, { color: highlightColor }]}>{current}</Text>
                <Text style={styles.label}>day streak</Text>
                <Text style={styles.sub}>current</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.col}>
                <Text style={[styles.number, isBest ? { color: theme.colors.primary } : {}]}>{best}</Text>
                <Text style={styles.label}>day streak</Text>
                <Text style={styles.sub}>best in period</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 20,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.md,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    col: { flex: 1, alignItems: 'center' },
    dot: {
        width: 8, height: 8, borderRadius: 4,
        backgroundColor: theme.colors.tertiary,
        marginBottom: 6,
    },
    number: { fontSize: 36, fontWeight: '700', color: theme.colors.textPrimary },
    label: { fontSize: 13, color: theme.colors.textSecondary, marginTop: 2 },
    sub: { fontSize: 11, color: theme.colors.textMuted, marginTop: 2 },
    divider: { width: 1, height: 60, backgroundColor: theme.colors.outlineVariant, marginHorizontal: 16 },
});
