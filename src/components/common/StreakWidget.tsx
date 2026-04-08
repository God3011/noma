import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { theme } from '../../constants/theme';
import { getToday } from '../../utils/dateHelpers';

interface StreakWidgetProps {
    completedDates: string[]; // array of strings in 'YYYY-MM-DD' format
}

function getShortMonth(monthIndex: number) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
}

const screenWidth = Dimensions.get('window').width;
const widgetWidth = screenWidth - 40; // 20 padding on each side of the container in HomeScreen
const contentWidth = widgetWidth - 48; // 24 padding inside StreakWidget container

export function StreakWidget({ completedDates }: StreakWidgetProps) {
    const todayStr = getToday();
    const today = new Date(todayStr);

    // We want 3 months ending in the current month. Order: Current (0), Prev (1), Prev Prev (2)
    const monthsData = useMemo(() => {
        const data = [];
        for (let i = 0; i <= 2; i++) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const year = d.getFullYear();
            const month = d.getMonth();
            const monthName = getShortMonth(month);

            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

            const days = [];
            // padding for first week
            for (let j = 0; j < firstDayOfWeek; j++) {
                days.push(null);
            }
            for (let j = 1; j <= daysInMonth; j++) {
                days.push(j);
            }

            data.push({ year, month, monthName, days });
        }
        return data;
    }, [todayStr]);

    return (
        <View style={styles.container}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.monthsScroll}
            >
                {monthsData.map((m, mIndex) => (
                    <View key={mIndex} style={[styles.monthBlock, { width: contentWidth }]}>
                        <Text style={styles.monthLabel}>{m.monthName}</Text>
                        <View style={styles.grid}>
                            {m.days.map((day, dIndex) => {
                                if (day === null) {
                                    return <View key={dIndex} style={styles.emptyDot} />;
                                }
                                const dateStr = `${m.year}-${String(m.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const isCompleted = completedDates.includes(dateStr);

                                return (
                                    <View
                                        key={dIndex}
                                        style={[
                                            styles.dot,
                                            isCompleted ? styles.dotActive : styles.dotInactive
                                        ]}
                                    />
                                );
                            })}
                        </View>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.bottomSection}>
                <View style={styles.circleGraphic}>
                    <Text style={styles.circleNumber}>{completedDates.length}</Text>
                </View>
                <View>
                    <Text style={styles.bottomTitle}>Total Streaks</Text>
                    <Text style={styles.bottomSubtitle}>Active Days</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: theme.colors.surfaceContainerLow,
        borderRadius: 24,
        padding: 24,
        marginBottom: 20,
    },
    monthsScroll: {
        marginBottom: 24,
    },
    monthBlock: {
        alignItems: 'center',
    },
    monthLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.colors.textPrimary,
        marginBottom: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        width: 140, // 7 items * 20px (10px width + 10px margin total)
    },
    emptyDot: {
        width: 10,
        height: 10,
        margin: 5,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        margin: 5,
    },
    dotInactive: {
        backgroundColor: theme.colors.surfaceContainerHighest,
    },
    dotActive: {
        backgroundColor: theme.colors.primary,
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
        elevation: 2,
    },
    bottomSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
    },
    circleGraphic: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    circleNumber: {
        color: theme.colors.primary,
        fontSize: 16,
        fontWeight: '700',
    },
    bottomTitle: {
        color: theme.colors.textWhite,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    bottomSubtitle: {
        color: theme.colors.textMuted,
        fontSize: 13,
    }
});
