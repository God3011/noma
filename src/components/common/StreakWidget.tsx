import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import { getToday } from '../../utils/dateHelpers';

interface StreakWidgetProps { completedDates: string[]; }

function getShortMonth(m: number) {
    return ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m];
}

export function StreakWidget({ completedDates }: StreakWidgetProps) {
    const todayStr = getToday();
    const today = new Date(todayStr);
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = useMemo(() => {
        const arr: number[] = [];
        for (let j = 1; j <= daysInMonth; j++) arr.push(j);
        return arr;
    }, [todayStr]);

    return (
        <View style={styles.container}>
            <View style={styles.leftCol}>
                <View style={styles.circle}>
                    <Text style={styles.count}>{completedDates.length}</Text>
                </View>
                <Text style={styles.countLabel}>Active</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.rightCol}>
                <Text style={styles.monthLabel}>{getShortMonth(month)}</Text>
                <View style={styles.grid}>
                    {days.map((day) => {
                        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                        const active = completedDates.includes(dateStr);
                        return <View key={day} style={[styles.dot, active ? styles.dotActive : styles.dotInactive]} />;
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: 12, paddingVertical: 7,
        marginBottom: 10, marginTop: 4, gap: 10,
    },
    leftCol: { alignItems: 'center', gap: 3 },
    circle: {
        width: 32, height: 32, borderRadius: 16,
        borderWidth: 2, borderColor: theme.colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    count: { fontSize: 13, fontWeight: '800', color: theme.colors.primary },
    countLabel: { fontSize: 8, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.4 },
    divider: { width: 1, height: 38, backgroundColor: theme.colors.outlineVariant },
    rightCol: { flex: 1 },
    monthLabel: { fontSize: 9, fontWeight: '700', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    dotInactive: { backgroundColor: theme.colors.surfaceContainerHighest },
    dotActive: { backgroundColor: theme.colors.primary },
});
