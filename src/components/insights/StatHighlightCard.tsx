import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

interface Props {
    label: string;
    value: string;
    unit?: string;
    trend?: 'up' | 'down' | 'flat';
}

export default function StatHighlightCard({ label, value, unit, trend }: Props) {
    const trendColor =
        trend === 'up' ? theme.colors.primary :
        trend === 'down' ? theme.colors.danger :
        theme.colors.textMuted;
    const trendSymbol = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '–';

    return (
        <View style={styles.card}>
            <Text style={[styles.trend, { color: trendColor }]}>{trendSymbol}</Text>
            <Text style={styles.value}>{value}</Text>
            {unit ? <Text style={styles.unit}>{unit}</Text> : null}
            <Text style={styles.label}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flex: 1,
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.md,
        padding: 14,
        minHeight: 90,
    },
    trend: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
    value: { fontSize: 24, fontWeight: '700', color: theme.colors.textPrimary },
    unit: { fontSize: 11, color: theme.colors.textSecondary, marginTop: -2 },
    label: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },
});
